import 'server-only';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import {
  HOME_REPAIRS_CATEGORY,
  PILOT_PROVINCE
} from '@/features/enquiries/pilot-catalog';
import { getPhoneLookupValues } from '@/features/enquiries/phone-normalization';
import type {
  EnquiryActionState,
  EnquiryFormField
} from '@/features/enquiries/form-state';
import { recordFunnelEvent } from '@/server/funnel-events';
import { consumeEnquirySubmissionSlot } from '@/server/enquiry-rate-limit';
import {
  getPilotCoverage,
  isPilotIntakeEnabled
} from '@/lib/pilot-readiness';
import { asyncOptionalAuthenticatedClient } from '@/server/clients';

const enquirySubmissionSchema = z.object({
  submissionKey: z.uuid(),
  categoryId: z.uuid(),
  cityId: z.uuid(),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^\+?[0-9\s()-]+$/),
  customerEmail: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.email().max(254).optional()
  ),
  preferredContact: z.enum(['PHONE', 'WHATSAPP']),
  jobDescription: z.string().trim().min(20).max(2000),
  urgency: z.enum([
    'FLEXIBLE',
    'WITHIN_WEEK',
    'WITHIN_MONTH',
    'SPECIFIC_DATE'
  ]),
  workType: z
    .string()
    .trim()
    .min(2)
    .max(50),
  locationContext: z
    .string()
    .trim()
    .min(2)
    .max(50),
  materialsResponsibility: z.enum([
    'CUSTOMER',
    'SUPPLIER',
    'NOT_SURE'
  ]),
  privacyNotice: z.literal('accepted'),
  website: z.string().max(0),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(100).optional(),
  targetSupplierId: z.uuid().optional(),
  entryChannel: z.enum(['GUIDED_REQUEST', 'PERSONAL_BUSINESS_PAGE']).optional()
});

function getFieldErrorName(
  value: PropertyKey | undefined
): EnquiryFormField | null {
  switch (value) {
    case 'categoryId':
    case 'cityId':
    case 'customerName':
    case 'customerPhone':
    case 'customerEmail':
    case 'preferredContact':
    case 'jobDescription':
    case 'urgency':
    case 'workType':
    case 'locationContext':
    case 'materialsResponsibility':
    case 'privacyNotice':
      return value;
    default:
      return null;
  }
}

export async function createPublicEnquiry(
  _previousState: EnquiryActionState,
  formData: FormData
): Promise<EnquiryActionState> {
  if (!isPilotIntakeEnabled()) {
    await recordFunnelEvent({
      type: 'ENQUIRY_SUBMISSION_FAILED',
      sessionKey:
        typeof formData.get('submissionKey') === 'string'
          ? (formData.get('submissionKey') as string)
          : randomUUID()
    });
    return {
      status: 'error',
      message:
        'Pilot enquiry intake is temporarily closed. Please check back when the controlled pilot opens.'
    };
  }

  const honeypot = formData.get('website');
  if (typeof honeypot === 'string' && honeypot.trim()) {
    console.warn('Blocked a public enquiry submission by honeypot.');
    await recordFunnelEvent({
      type: 'ENQUIRY_SUBMISSION_FAILED',
      sessionKey:
        typeof formData.get('submissionKey') === 'string'
          ? (formData.get('submissionKey') as string)
          : randomUUID()
    });
    return {
      status: 'error',
      message: 'We could not accept this request. Please try again.'
    };
  }

  const parsed = enquirySubmissionSchema.safeParse({
    submissionKey: formData.get('submissionKey'),
    categoryId: formData.get('categoryId'),
    cityId: formData.get('cityId'),
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    customerEmail: formData.get('customerEmail'),
    preferredContact: formData.get('preferredContact'),
    jobDescription: formData.get('jobDescription'),
    urgency: formData.get('urgency'),
    workType: formData.get('workType'),
    locationContext: formData.get('locationContext'),
    materialsResponsibility: formData.get('materialsResponsibility'),
    privacyNotice:
      formData.get('privacyNotice') === 'accepted' ? 'accepted' : '',
    website: honeypot,
    utmSource: formData.get('utmSource') || undefined,
    utmMedium: formData.get('utmMedium') || undefined,
    utmCampaign: formData.get('utmCampaign') || undefined,
    targetSupplierId: formData.get('targetSupplierId') || undefined,
    entryChannel:
      formData.get('entryChannel') === 'PERSONAL_BUSINESS_PAGE'
        ? 'PERSONAL_BUSINESS_PAGE'
        : 'GUIDED_REQUEST'
  });

  if (!parsed.success) {
    const fieldErrors: Partial<Record<EnquiryFormField, string>> = {};

    for (const issue of parsed.error.issues) {
      const field = getFieldErrorName(issue.path[0]);
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }

    const submissionKey = formData.get('submissionKey');
    await recordFunnelEvent({
      type: 'ENQUIRY_SUBMISSION_FAILED',
      sessionKey:
        typeof submissionKey === 'string' ? submissionKey : randomUUID()
    });

    return {
      status: 'error',
      message: 'Please review the highlighted fields and try again.',
      fieldErrors
    };
  }

  const existingEnquiry = await prisma.enquiry.findUnique({
    where: { submissionKey: parsed.data.submissionKey },
    select: { publicReference: true }
  });

  if (existingEnquiry) {
    return {
      status: 'success',
      reference: existingEnquiry.publicReference
    };
  }

  const phone = getPhoneLookupValues(parsed.data.customerPhone);
  const hasSubmissionSlot = await consumeEnquirySubmissionSlot(phone.canonical);
  if (!hasSubmissionSlot) {
    return {
      status: 'error',
      message:
        'We have received too many requests for this contact recently. Please try again later.'
    };
  }

  const [category, city] = await prisma.$transaction([
    prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        parentId: HOME_REPAIRS_CATEGORY.id,
        isActive: true
      },
      select: { id: true, slug: true }
    }),
    prisma.city.findFirst({
      where: {
        id: parsed.data.cityId,
        provinceId: PILOT_PROVINCE.id,
        isActive: true
      },
      select: { id: true }
    })
  ]);

  if (!category || !city) {
    await recordFunnelEvent({
      type: 'ENQUIRY_SUBMISSION_FAILED',
      sessionKey: parsed.data.submissionKey,
      attribution: {
        utmSource: parsed.data.utmSource,
        utmMedium: parsed.data.utmMedium,
        utmCampaign: parsed.data.utmCampaign
      },
      categoryId: category?.id,
      cityId: city?.id
    });
    return {
      status: 'error',
      message:
        'That service or area is not available. Reload the page and choose again.',
      fieldErrors: {
        ...(!category ? { categoryId: 'Choose an available service.' } : {}),
        ...(!city ? { cityId: 'Choose an available area.' } : {})
      }
    };
  }

  const workTypesByCategory: Record<string, string[]> = {
    plumbing: [
      'REPAIR',
      'INSTALLATION',
      'BLOCKAGE_OR_DRAIN',
      'GEYSER',
      'OTHER'
    ],
    electrical: [
      'FAULT_OR_REPAIR',
      'INSTALLATION',
      'LIGHTING',
      'APPLIANCE',
      'OTHER'
    ],
    handyman: [
      'SMALL_REPAIR',
      'INSTALLATION',
      'ASSEMBLY',
      'MAINTENANCE',
      'OTHER'
    ]
  };
  const contextsByCategory: Record<string, string[]> = {
    plumbing: [
      'GEYSER',
      'BATHROOM',
      'SHOWER',
      'KITCHEN',
      'OUTDOOR',
      'OTHER'
    ],
    electrical: [
      'INTERIOR',
      'OUTDOOR',
      'DISTRIBUTION_BOARD',
      'APPLIANCE',
      'OTHER'
    ],
    handyman: [
      'INTERIOR',
      'OUTDOOR',
      'FURNITURE',
      'MOUNTING',
      'OTHER'
    ]
  };
  const allowedWorkTypes = workTypesByCategory[category.slug] ?? [];
  const allowedContexts = contextsByCategory[category.slug] ?? [];

  if (
    !allowedWorkTypes.includes(parsed.data.workType) ||
    !allowedContexts.includes(parsed.data.locationContext)
  ) {
    return {
      status: 'error',
      message: 'Please choose valid category-specific work and location details.',
      fieldErrors: {
        ...(!allowedWorkTypes.includes(parsed.data.workType)
          ? { workType: 'Choose a valid work type.' }
          : {}),
        ...(!allowedContexts.includes(parsed.data.locationContext)
          ? { locationContext: 'Choose a valid location context.' }
          : {})
      }
    };
  }

  const structuredAnswers = {
    urgency: parsed.data.urgency,
    workType: parsed.data.workType,
    locationContext: parsed.data.locationContext,
    materialsResponsibility: parsed.data.materialsResponsibility
  };

  if (parsed.data.targetSupplierId) {
    const targetSupplier = await prisma.supplier.findFirst({
      where: {
        id: parsed.data.targetSupplierId,
        deletedAt: null,
        isActive: true,
        status: 'APPROVED',
        isVerified: true,
        categories: {
          some: {
            categoryId: category.id,
            isConfirmed: true
          }
        },
        serviceAreas: {
          some: {
            cityId: city.id,
            isConfirmed: true,
            isActive: true
          }
        }
      },
      select: { id: true }
    });

    if (!targetSupplier) {
      return {
        status: 'error',
        message:
          'This supplier is not eligible to accept the selected service or area. Use the general request form instead.'
      };
    }
  }

  const coverage = await getPilotCoverage(category.id, city.id);
  if (!coverage.isCovered) {
    await recordFunnelEvent({
      type: 'ENQUIRY_SUBMISSION_FAILED',
      sessionKey: parsed.data.submissionKey,
      attribution: {
        utmSource: parsed.data.utmSource,
        utmMedium: parsed.data.utmMedium,
        utmCampaign: parsed.data.utmCampaign
      },
      categoryId: category.id,
      cityId: city.id
    });
    return {
      status: 'error',
      message:
        'This service area is not open for the controlled pilot yet. We need five eligible local providers before accepting requests.'
    };
  }

  const possibleDuplicate = await prisma.enquiry.findFirst({
    where: {
      source: 'WEBSITE',
      customerPhone: { in: phone.lookupValues },
      categoryId: category.id,
      cityId: city.id,
      status: { not: 'REJECTED_SPAM' },
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true }
  });

  const client = await asyncOptionalAuthenticatedClient();
  const publicReference = `GMO-${randomUUID().replaceAll('-', '').toUpperCase()}`;
  const enquiry = await prisma.enquiry.upsert({
    where: { submissionKey: parsed.data.submissionKey },
    update: {},
    create: {
      publicReference,
      submissionKey: parsed.data.submissionKey,
      clientId: client?.id ?? null,
      categoryId: category.id,
      cityId: city.id,
      possibleDuplicateOfId: possibleDuplicate?.id ?? null,
      customerName: parsed.data.customerName,
      customerPhone: phone.canonical,
      customerEmail: parsed.data.customerEmail ?? null,
      preferredContact: parsed.data.preferredContact,
      jobDescription: parsed.data.jobDescription,
      formTemplateVersion: 'gmo-pilot-v1',
      structuredAnswers,
      privacyNoticeVersion: 'gmo-request-v1',
      privacyNoticeAcceptedAt: new Date(),
      entryChannel: parsed.data.entryChannel ?? 'GUIDED_REQUEST',
      targetSupplierId: parsed.data.targetSupplierId ?? null,
      utmSource: parsed.data.utmSource ?? null,
      utmMedium: parsed.data.utmMedium ?? null,
      utmCampaign: parsed.data.utmCampaign ?? null
    },
    select: { publicReference: true }
  });

  await recordFunnelEvent({
    type: 'ENQUIRY_SUBMITTED',
    sessionKey: parsed.data.submissionKey,
    attribution: {
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign
    },
    categoryId: category.id,
    cityId: city.id
  });

  return {
    status: 'success',
    reference: enquiry.publicReference
  };
}
