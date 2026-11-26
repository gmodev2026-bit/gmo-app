import 'server-only';

import { z } from 'zod';
import {
  Prisma,
  type EnquiryStatus
} from '@/generated/prisma/client';
import {
  isAllowedTargetSupplier,
  isValidDispatchSelection
} from '@/features/enquiries/dispatch';
import { isFreePilotQuotaExhausted } from '@/features/enquiries/quota';
import { getAllowedEnquiryTransitions } from '@/features/enquiries/status';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/server/authorization';
import { writeAdminAuditEvent } from '@/server/admin/audit';

const reviewSchema = z.object({
  enquiryId: z.uuid(),
  toStatus: z.enum([
    'PENDING_REVIEW',
    'NEEDS_INFORMATION',
    'QUALIFIED',
    'REJECTED',
    'REJECTED_SPAM',
    'MATCHING'
  ]),
  reason: z.string().trim().min(5).max(500)
});

const contactVerificationSchema = z.object({
  enquiryId: z.uuid(),
  verificationMethod: z.enum(['PHONE_CALL', 'WHATSAPP_MESSAGE']),
  sharingApproval: z.literal('confirmed')
});

export type EnquiryQueueFilter = 'open' | 'all' | EnquiryStatus;

const PAGE_SIZE = 25;

export async function listAdminEnquiries(
  filter: EnquiryQueueFilter,
  requestedPage: number
) {
  await requireAdmin();

  const where: {
    status?: EnquiryStatus | { in: EnquiryStatus[] };
  } = {};

  if (filter === 'open') {
    where.status = { in: ['PENDING_REVIEW', 'NEEDS_INFORMATION'] };
  } else if (filter !== 'all') {
    where.status = filter;
  }

  const total = await prisma.enquiry.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.max(1, Math.min(requestedPage, pageCount));
  const enquiries = await prisma.enquiry.findMany({
    where,
    select: {
      id: true,
      publicReference: true,
      status: true,
      possibleDuplicateOfId: true,
      createdAt: true,
      category: { select: { name: true } },
      city: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE
  });

  return { enquiries, page, pageCount, total };
}

export async function getAdminEnquiry(id: string) {
  await requireAdmin();

  return prisma.enquiry.findUnique({
    where: { id },
    select: {
      id: true,
      publicReference: true,
      status: true,
      createdAt: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      preferredContact: true,
      targetSupplierId: true,
      jobDescription: true,
      formTemplateVersion: true,
      structuredAnswers: true,
      privacyNoticeVersion: true,
      privacyNoticeAcceptedAt: true,
      contactVerifiedAt: true,
      contactVerificationMethod: true,
      supplierSharingApprovedAt: true,
      category: { select: { name: true } },
      city: { select: { name: true } },
      possibleDuplicateOf: {
        select: {
          id: true,
          publicReference: true,
          status: true,
          createdAt: true
        }
      },
      leadAssignments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          status: true,
          dispatchedAt: true,
          supplier: {
            select: { id: true, businessName: true, phone: true }
          },
          availabilityResponses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              response: true,
              note: true,
              createdAt: true,
              actor: { select: { name: true } }
            }
          }
        }
      },
      leadActivities: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          channel: true,
          status: true,
          outcome: true,
          summary: true,
          scheduledAt: true,
          occurredAt: true,
          completedAt: true,
          createdAt: true,
          actor: { select: { name: true } },
          leadAssignment: {
            select: { supplier: { select: { businessName: true } } }
          }
        }
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          reason: true,
          createdAt: true,
          actor: { select: { name: true } }
        }
      }
    }
  });
}

export async function recordEnquiryContactVerification(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = contactVerificationSchema.safeParse({
    enquiryId: formData.get('enquiryId'),
    verificationMethod: formData.get('verificationMethod'),
    sharingApproval: formData.get('sharingApproval')
  });

  if (!parsed.success) {
    return {
      status: 'error' as const,
      message: 'Confirm the contact verification and customer sharing approval.'
    };
  }

  const result = await prisma.$transaction(async (transaction) => {
    const enquiry = await transaction.enquiry.findUnique({
      where: { id: parsed.data.enquiryId },
      select: {
        id: true,
        preferredContact: true,
        contactVerifiedAt: true,
        contactVerificationMethod: true,
        supplierSharingApprovedAt: true
      }
    });

    if (!enquiry) {
      return { status: 'not-found' as const };
    }

    const expectedMethod =
      enquiry.preferredContact === 'WHATSAPP'
        ? 'WHATSAPP_MESSAGE'
        : 'PHONE_CALL';
    if (parsed.data.verificationMethod !== expectedMethod) {
      return { status: 'wrong-channel' as const };
    }

    if (
      enquiry.contactVerifiedAt &&
      enquiry.contactVerificationMethod &&
      enquiry.supplierSharingApprovedAt
    ) {
      return { status: 'already-recorded' as const };
    }

    const verifiedAt = new Date();
    const updated = await transaction.enquiry.updateMany({
      where: {
        id: enquiry.id,
        contactVerifiedAt: enquiry.contactVerifiedAt,
        contactVerificationMethod: enquiry.contactVerificationMethod,
        supplierSharingApprovedAt: enquiry.supplierSharingApprovedAt
      },
      data: {
        contactVerifiedAt: verifiedAt,
        contactVerificationMethod: parsed.data.verificationMethod,
        supplierSharingApprovedAt: verifiedAt
      }
    });

    if (updated.count !== 1) {
      return { status: 'conflict' as const };
    }

    await transaction.leadActivity.create({
      data: {
        enquiryId: enquiry.id,
        type: 'CUSTOMER_REACHED',
        channel:
          parsed.data.verificationMethod === 'WHATSAPP_MESSAGE'
            ? 'WHATSAPP'
            : 'PHONE',
        status: 'COMPLETED',
        outcome: 'REACHED',
        summary:
          'Customer contact channel verified; customer explicitly approved sharing relevant request details with up to three suitable providers.',
        actorUserId: actor.id,
        occurredAt: verifiedAt,
        completedAt: verifiedAt
      }
    });

    await writeAdminAuditEvent(transaction, {
      actorUserId: actor.id,
      action: 'ENQUIRY_CONTACT_VERIFIED',
      entityType: 'ENQUIRY',
      entityId: enquiry.id,
      details: { method: parsed.data.verificationMethod }
    });

    return { status: 'success' as const };
  });

  switch (result.status) {
    case 'not-found':
      return { status: 'error' as const, message: 'Enquiry not found.' };
    case 'wrong-channel':
      return {
        status: 'error' as const,
        message: "Verify the contact using the customer's selected channel."
      };
    case 'already-recorded':
      return {
        status: 'success' as const,
        message: 'Contact verification and sharing approval are already recorded.'
      };
    case 'conflict':
      return {
        status: 'error' as const,
        message: 'Another admin updated this verification. Reload and review it.'
      };
    case 'success':
      return {
        status: 'success' as const,
        message: 'Contact verification and customer approval recorded.'
      };
  }
}

export async function updateAdminEnquiryStatus(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = reviewSchema.safeParse({
    enquiryId: formData.get('enquiryId'),
    toStatus: formData.get('toStatus'),
    reason: formData.get('reason')
  });

  if (!parsed.success) {
    return {
      status: 'error' as const,
      message:
        'Choose a valid next status and enter a reason of 5–500 characters.'
    };
  }

  const result = await prisma.$transaction(async (transaction) => {
    const enquiry = await transaction.enquiry.findUnique({
      where: { id: parsed.data.enquiryId },
      select: { id: true, status: true }
    });

    if (!enquiry) {
      return { status: 'not-found' as const };
    }

    if (
      !getAllowedEnquiryTransitions(enquiry.status).includes(
        parsed.data.toStatus
      )
    ) {
      return { status: 'invalid-transition' as const };
    }

    const updated = await transaction.enquiry.updateMany({
      where: { id: enquiry.id, status: enquiry.status },
      data: { status: parsed.data.toStatus }
    });

    if (updated.count !== 1) {
      return { status: 'conflict' as const };
    }

    await transaction.enquiryStatusHistory.create({
      data: {
        enquiryId: enquiry.id,
        actorUserId: actor.id,
        fromStatus: enquiry.status,
        toStatus: parsed.data.toStatus,
        reason: parsed.data.reason
      }
    });

    await writeAdminAuditEvent(transaction, {
      actorUserId: actor.id,
      action: 'ENQUIRY_STATUS_CHANGED',
      entityType: 'ENQUIRY',
      entityId: enquiry.id,
      details: {
        fromStatus: enquiry.status,
        toStatus: parsed.data.toStatus
      }
    });

    return { status: 'success' as const };
  });

  switch (result.status) {
    case 'not-found':
      return { status: 'error' as const, message: 'Enquiry not found.' };
    case 'invalid-transition':
      return {
        status: 'error' as const,
        message:
          'That status change is not allowed. Reload the enquiry and try again.'
      };
    case 'conflict':
      return {
        status: 'error' as const,
        message: 'Another admin updated this enquiry. Reload and try again.'
      };
    case 'success':
      return {
        status: 'success' as const,
        message: 'Enquiry status and review history updated.'
      };
  }
}

const availabilitySchema = z.object({
  enquiryId: z.uuid(),
  supplierId: z.uuid(),
  response: z.enum([
    'AVAILABLE',
    'UNAVAILABLE',
    'NO_RESPONSE',
    'NEEDS_CLARIFICATION'
  ]),
  note: z.string().trim().max(500).transform((value) => value || null)
});

const dispatchSchema = z.object({
  enquiryId: z.uuid(),
  supplierIds: z
    .array(z.uuid())
    .min(1)
    .max(3)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'Remove duplicate suppliers.'
    )
});

export async function getDeterministicEnquiryMatches(enquiryId: string) {
  await requireAdmin();

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    select: {
      id: true,
      categoryId: true,
      cityId: true,
      targetSupplierId: true
    }
  });

  if (!enquiry) {
    return null;
  }

  const matches = await prisma.supplier.findMany({
    where: {
      ...(enquiry.targetSupplierId ? { id: enquiry.targetSupplierId } : {}),
      deletedAt: null,
      AND: [
        { slug: { not: { startsWith: 'simulation-' } } },
        { slug: { not: { startsWith: 'test-only-' } } }
      ],
      isActive: true,
      status: 'APPROVED',
      isVerified: true,
      categories: {
        some: {
          categoryId: enquiry.categoryId,
          isConfirmed: true
        }
      },
      serviceAreas: {
        some: {
          cityId: enquiry.cityId,
          isConfirmed: true,
          isActive: true
        }
      }
    },
    select: {
      id: true,
      businessName: true,
      phone: true,
      categories: {
        where: { categoryId: enquiry.categoryId },
        select: { isConfirmed: true }
      },
      serviceAreas: {
        where: { cityId: enquiry.cityId },
        select: { isConfirmed: true, isActive: true }
      }
    },
    orderBy: [{ businessName: 'asc' }, { id: 'asc' }]
  });

  const candidates = await prisma.supplier.findMany({
    where: {
      deletedAt: null,
      AND: [
        { slug: { not: { startsWith: 'simulation-' } } },
        { slug: { not: { startsWith: 'test-only-' } } }
      ],
      ...(enquiry.targetSupplierId
        ? { id: enquiry.targetSupplierId }
        : {
            OR: [
              { categories: { some: { categoryId: enquiry.categoryId } } },
              { serviceAreas: { some: { cityId: enquiry.cityId } } }
            ]
          })
    },
    select: {
      id: true,
      businessName: true,
      status: true,
      isVerified: true,
      isActive: true,
      categories: {
        where: { categoryId: enquiry.categoryId },
        select: { isConfirmed: true }
      },
      serviceAreas: {
        where: { cityId: enquiry.cityId },
        select: { isConfirmed: true, isActive: true }
      }
    },
    orderBy: [{ businessName: 'asc' }, { id: 'asc' }]
  });

  const matchIds = new Set(matches.map((supplier) => supplier.id));
  const excluded = candidates
    .filter((supplier) => !matchIds.has(supplier.id))
    .map((supplier) => ({
      id: supplier.id,
      businessName: supplier.businessName,
      reasons: getSupplierExclusionReasons(supplier)
    }));

  return { matches, excluded };
}

function getSupplierExclusionReasons(
  supplier: {
    status: string;
    isVerified: boolean;
    isActive: boolean;
    categories: Array<{ isConfirmed: boolean }>;
    serviceAreas: Array<{ isConfirmed: boolean; isActive: boolean }>;
  }
) {
  const reasons: string[] = [];

  if (supplier.status !== 'APPROVED') {
    reasons.push('Supplier is not approved');
  }
  if (!supplier.isVerified) {
    reasons.push('Supplier is not verified');
  }
  if (!supplier.isActive) {
    reasons.push('Supplier is inactive');
  }
  if (!supplier.categories.some((item) => item.isConfirmed)) {
    reasons.push('Category is not confirmed');
  }
  if (
    !supplier.serviceAreas.some(
      (item) => item.isConfirmed && item.isActive
    )
  ) {
    reasons.push('City service area is not confirmed');
  }

  return reasons;
}

export async function recordSupplierAvailability(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = availabilitySchema.safeParse({
    enquiryId: formData.get('enquiryId'),
    supplierId: formData.get('supplierId'),
    response: formData.get('response'),
    note: formData.get('note') ?? ''
  });

  if (!parsed.success) {
    return {
      status: 'error' as const,
      message: 'Choose a valid availability response.'
    };
  }

  const result = await prisma.$transaction(async (transaction) => {
    const enquiry = await transaction.enquiry.findUnique({
      where: { id: parsed.data.enquiryId },
      select: {
        id: true,
        categoryId: true,
        cityId: true,
        targetSupplierId: true
      }
    });

    if (!enquiry) {
      return { status: 'not-found' as const };
    }
    if (
      !isAllowedTargetSupplier(
        enquiry.targetSupplierId,
        parsed.data.supplierId
      )
    ) {
      return { status: 'target-mismatch' as const };
    }

    const supplier = await transaction.supplier.findFirst({
      where: {
        id: parsed.data.supplierId,
        deletedAt: null,
        AND: [
          { slug: { not: { startsWith: 'simulation-' } } },
          { slug: { not: { startsWith: 'test-only-' } } }
        ],
        isActive: true,
        status: 'APPROVED',
        isVerified: true,
        categories: {
          some: {
            categoryId: enquiry.categoryId,
            isConfirmed: true
          }
        }
      },
      select: { id: true }
    });

    if (!supplier) {
      return { status: 'ineligible' as const };
    }

    const eligibleArea = await transaction.supplierServiceArea.findUnique({
      where: {
        supplierId_cityId: {
          supplierId: supplier.id,
          cityId: enquiry.cityId
        }
      },
      select: { isConfirmed: true, isActive: true }
    });

    if (!eligibleArea || !eligibleArea.isConfirmed || !eligibleArea.isActive) {
      return { status: 'ineligible' as const };
    }

    const assignment = await transaction.leadAssignment.upsert({
      where: {
        enquiryId_supplierId: {
          enquiryId: enquiry.id,
          supplierId: supplier.id
        }
      },
      update: {},
      create: {
        enquiryId: enquiry.id,
        supplierId: supplier.id,
        status: 'PENDING_AVAILABILITY'
      },
      select: { id: true }
    });

    await transaction.supplierAvailabilityResponse.create({
      data: {
        leadAssignmentId: assignment.id,
        supplierId: supplier.id,
        enquiryId: enquiry.id,
        response: parsed.data.response,
        note: parsed.data.note,
        actorUserId: actor.id
      }
    });

    await transaction.leadAssignment.update({
      where: { id: assignment.id },
      data: {
        status:
          parsed.data.response === 'AVAILABLE'
            ? 'CONFIRMED'
            : 'PENDING_AVAILABILITY'
      }
    });

    await writeAdminAuditEvent(transaction, {
      actorUserId: actor.id,
      action: 'SUPPLIER_AVAILABILITY_RECORDED',
      entityType: 'ENQUIRY',
      entityId: enquiry.id,
      details: {
        supplierId: supplier.id,
        response: parsed.data.response
      }
    });

    return { status: 'success' as const };
  });

  switch (result.status) {
    case 'not-found':
      return { status: 'error' as const, message: 'Enquiry not found.' };
    case 'ineligible':
      return {
        status: 'error' as const,
        message: 'This supplier is not eligible for the enquiry category and city.'
      };
    case 'target-mismatch':
      return {
        status: 'error' as const,
        message:
          'This request is for a specific supplier. Ask the customer before contacting another provider.'
      };
    case 'success':
      return {
        status: 'success' as const,
        message: 'Availability response recorded.'
      };
  }
}

export async function dispatchAdminEnquiry(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = dispatchSchema.safeParse({
    enquiryId: formData.get('enquiryId'),
    supplierIds: formData.getAll('supplierIds')
  });

  if (!parsed.success) {
    return {
      status: 'error' as const,
      message: 'Select one to three confirmed suppliers.'
    };
  }

  const result = await prisma.$transaction(
    async (transaction) => {
      const enquiry = await transaction.enquiry.findUnique({
        where: { id: parsed.data.enquiryId },
        select: {
          id: true,
          status: true,
          categoryId: true,
          cityId: true,
          targetSupplierId: true,
          contactVerifiedAt: true,
          supplierSharingApprovedAt: true
        }
      });

      if (!enquiry) {
        return { status: 'not-found' as const };
      }
      if (!['QUALIFIED', 'MATCHING'].includes(enquiry.status)) {
        return { status: 'invalid-status' as const };
      }
      if (!enquiry.contactVerifiedAt || !enquiry.supplierSharingApprovedAt) {
        return { status: 'contact-not-ready' as const };
      }
      if (
        !isValidDispatchSelection(
          enquiry.targetSupplierId,
          parsed.data.supplierIds
        )
      ) {
        return { status: 'target-mismatch' as const };
      }

      const suppliers = await transaction.supplier.findMany({
        where: {
          id: { in: parsed.data.supplierIds },
          deletedAt: null,
          AND: [
            { slug: { not: { startsWith: 'simulation-' } } },
            { slug: { not: { startsWith: 'test-only-' } } }
          ],
          isActive: true,
          status: 'APPROVED',
          isVerified: true,
          categories: {
            some: {
              categoryId: enquiry.categoryId,
              isConfirmed: true
            }
          },
          serviceAreas: {
            some: {
              cityId: enquiry.cityId,
              isConfirmed: true,
              isActive: true
            }
          }
        },
        select: { id: true, businessName: true }
      });

      if (suppliers.length !== parsed.data.supplierIds.length) {
        return { status: 'ineligible' as const };
      }

      const assignments: Array<{ id: string; supplierId: string }> = [];
      for (const supplier of suppliers) {
        const assignment = await transaction.leadAssignment.findUnique({
          where: {
            enquiryId_supplierId: {
              enquiryId: enquiry.id,
              supplierId: supplier.id
            }
          },
          select: { id: true, status: true }
        });

        if (!assignment || assignment.status === 'DISPATCHED') {
          return {
            status: 'invalid-availability' as const,
            supplierName: supplier.businessName
          };
        }

        const latestAvailability =
          await transaction.supplierAvailabilityResponse.findFirst({
            where: {
              leadAssignmentId: assignment.id,
              supplierId: supplier.id,
              enquiryId: enquiry.id
            },
            orderBy: { createdAt: 'desc' },
            select: { response: true }
          });

        if (
          !latestAvailability ||
          latestAvailability.response !== 'AVAILABLE'
        ) {
          return {
            status: 'invalid-availability' as const,
            supplierName: supplier.businessName
          };
        }

        const committedCount = await transaction.quotaLedgerEntry.count({
          where: { supplierId: supplier.id }
        });
        if (isFreePilotQuotaExhausted(committedCount)) {
          return {
            status: 'quota-exhausted' as const,
            supplierName: supplier.businessName
          };
        }

        assignments.push({
          id: assignment.id,
          supplierId: supplier.id
        });
      }

      const updated = await transaction.enquiry.updateMany({
        where: { id: enquiry.id, status: enquiry.status },
        data: { status: 'DISPATCHED' }
      });
      if (updated.count !== 1) {
        return { status: 'conflict' as const };
      }

      for (const assignment of assignments) {
        await transaction.leadAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'DISPATCHED',
            dispatchedAt: new Date(),
            dispatchedByUserId: actor.id
          }
        });

        await transaction.quotaLedgerEntry.create({
          data: {
            supplierId: assignment.supplierId,
            enquiryId: enquiry.id,
            leadAssignmentId: assignment.id,
            type: 'FREE_ASSIGNMENT_CONSUMED',
            actorUserId: actor.id,
            reason: 'Committed dispatch consumed lifetime pilot quota.'
          }
        });

        await transaction.outboxEvent.create({
          data: {
            idempotencyKey: `supplier-dispatch:${assignment.id}:v1`,
            type: 'SUPPLIER_DISPATCH_CONFIRMED',
            enquiryId: enquiry.id,
            leadAssignmentId: assignment.id,
            payload: {
              schemaVersion: 1,
              supplierId: assignment.supplierId
            }
          }
        });
      }

      await transaction.enquiryStatusHistory.create({
        data: {
          enquiryId: enquiry.id,
          actorUserId: actor.id,
          fromStatus: enquiry.status,
          toStatus: 'DISPATCHED',
          reason: `Dispatch confirmed to ${suppliers.length} confirmed-available supplier(s).`
        }
      });

      await writeAdminAuditEvent(transaction, {
        actorUserId: actor.id,
        action: 'ENQUIRY_DISPATCHED',
        entityType: 'ENQUIRY',
        entityId: enquiry.id,
        details: {
          supplierCount: assignments.length,
          supplierIds: assignments.map((assignment) => assignment.supplierId)
        }
      });

      return {
        status: 'success' as const,
        outboxEventCount: assignments.length
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );

  switch (result.status) {
    case 'not-found':
      return { status: 'error' as const, message: 'Enquiry not found.' };
    case 'invalid-status':
      return {
        status: 'error' as const,
        message: 'Qualify or enter matching status before dispatch.'
      };
    case 'contact-not-ready':
      return {
        status: 'error' as const,
        message:
          "Verify the customer's selected contact channel and record their explicit sharing approval before dispatch."
      };
    case 'ineligible':
      return {
        status: 'error' as const,
        message: 'One or more suppliers are no longer eligible.'
      };
    case 'target-mismatch':
      return {
        status: 'error' as const,
        message:
          'This is a supplier-specific request. Only its selected supplier may be dispatched; ask the customer before offering alternatives.'
      };
    case 'invalid-availability':
      return {
        status: 'error' as const,
        message: `${result.supplierName ?? 'A selected supplier'} is not confirmed available for this enquiry.`
      };
    case 'quota-exhausted':
      return {
        status: 'error' as const,
        message: `${result.supplierName ?? 'A selected supplier'} has exhausted the five-assignment lifetime pilot allowance.`
      };
    case 'conflict':
      return {
        status: 'error' as const,
        message: 'Another admin changed this enquiry. Reload and try again.'
      };
    case 'success':
      return {
        status: 'success' as const,
        message: `Dispatch confirmed. ${result.outboxEventCount} notification event(s) queued; no provider messages were sent.`
      };
  }
}
