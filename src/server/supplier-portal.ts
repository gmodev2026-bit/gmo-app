import 'server-only';

import { unauthorized } from 'next/navigation';
import prisma from '@/lib/prisma';
import { isAuthenticated } from '@/server/user';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  canEditSupplierProfile,
  getAllowedSupplierTransitions
} from '@/features/suppliers/status';

const supplierDraftSchema = z
  .object({
    businessName: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    businessType: z.enum(['SERVICE_PROVIDER', 'PRODUCT_SELLER', 'HYBRID']),
    tagline: z.string().trim().max(160),
    description: z.string().trim().max(4000),
    contactName: z.string().trim().max(120),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(30)
      .regex(/^[+0-9()\-\s]+$/),
    email: z
      .string()
      .trim()
      .max(254)
      .refine((value) => value === '' || z.email().safeParse(value).success),
    website: z
      .string()
      .trim()
      .max(2048)
      .refine(
        (value) =>
          value === '' ||
          z.url({ protocol: /^https?$/ }).safeParse(value).success
      ),
    categoryIds: z.array(z.uuid()).min(1),
    primaryCategoryId: z.uuid(),
    cityIds: z.array(z.uuid()).min(1),
    offerings: z.string().trim().max(2000)
  })
  .refine((value) => value.categoryIds.includes(value.primaryCategoryId), {
    message: 'Primary category must be selected.',
    path: ['primaryCategoryId']
  });

function requireVerifiedSupplierUser(account: {
  role: string;
  emailVerified: boolean;
  banned: boolean;
}) {
  return account.role === 'user' && account.emailVerified && !account.banned;
}

export async function getSupplierPortalProfile() {
  const session = await isAuthenticated();
  if (!session) {
    unauthorized();
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, emailVerified: true, banned: true }
  });

  if (
    !account ||
    account.role !== 'user' ||
    !account.emailVerified ||
    account.banned
  ) {
    return null;
  }

  return prisma.supplier.findFirst({
    where: {
      ownerUserId: session.user.id,
      deletedAt: null,
      AND: [
        { slug: { not: { startsWith: 'simulation-' } } },
        { slug: { not: { startsWith: 'test-only-' } } }
      ]
    },
    select: {
      id: true,
      businessName: true,
      slug: true,
      businessType: true,
      tagline: true,
      description: true,
      contactName: true,
      phone: true,
      email: true,
      website: true,
      isContactNamePublic: true,
      isPhonePublic: true,
      isEmailPublic: true,
      isWebsitePublic: true,
      status: true,
      isVerified: true,
      isActive: true,
      isIndexable: true,
      categories: {
        select: {
          categoryId: true,
          isPrimary: true,
          category: { select: { name: true } }
        }
      },
      serviceAreas: {
        select: {
          cityId: true,
          city: {
            select: {
              name: true,
              province: { select: { name: true } }
            }
          }
        }
      },
      offerings: {
        where: { isActive: true },
        select: { id: true, name: true, description: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' }
      },
      reviewHistory: {
        where: { toStatus: 'CHANGES_REQUESTED' },
        select: { reason: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      mediaAssets: {
        where: { purpose: { in: ['LOGO', 'COVER', 'GALLERY'] } },
        select: {
          id: true,
          purpose: true,
          status: true,
          altText: true,
          width: true,
          height: true,
          byteSize: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
}

export async function getSupplierOnboardingOptions() {
  const session = await isAuthenticated();
  if (!session) unauthorized();

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, emailVerified: true, banned: true }
  });
  if (!account || !requireVerifiedSupplierUser(account)) return null;

  const [categories, cities] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: { not: null } },
      select: { id: true, name: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
    }),
    prisma.city.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        province: { select: { name: true } }
      },
      orderBy: [{ province: { name: 'asc' } }, { name: 'asc' }]
    })
  ]);

  return { categories, cities };
}

function supplierFormValues(formData: FormData) {
  return supplierDraftSchema.safeParse({
    businessName: formData.get('businessName'),
    slug: formData.get('slug'),
    businessType: formData.get('businessType'),
    tagline: formData.get('tagline') ?? '',
    description: formData.get('description') ?? '',
    contactName: formData.get('contactName') ?? '',
    phone: formData.get('phone'),
    email: formData.get('email') ?? '',
    website: formData.get('website') ?? '',
    categoryIds: formData.getAll('categoryIds'),
    primaryCategoryId: formData.get('primaryCategoryId'),
    cityIds: formData.getAll('cityIds'),
    offerings: formData.get('offerings') ?? ''
  });
}

async function requireVerifiedOwner() {
  const session = await isAuthenticated();
  if (!session) unauthorized();

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, emailVerified: true, banned: true }
  });
  if (!account || !requireVerifiedSupplierUser(account)) return null;
  return session.user.id;
}

export async function saveSupplierDraft(formData: FormData) {
  const ownerUserId = await requireVerifiedOwner();
  if (!ownerUserId)
    return {
      status: 'error' as const,
      message: 'Verify your email before managing a supplier profile.'
    };

  const parsed = supplierFormValues(formData);
  if (!parsed.success) {
    return {
      status: 'error' as const,
      message: 'Please review the highlighted profile fields.'
    };
  }

  const values = parsed.data;
  const profileData = {
    businessName: values.businessName,
    slug: values.slug,
    businessType: values.businessType,
    tagline: values.tagline || null,
    description: values.description || null,
    contactName: values.contactName || null,
    phone: values.phone,
    email: values.email || null,
    website: values.website || null
  };

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.supplier.findUnique({
        where: { ownerUserId },
        select: { id: true, status: true, slug: true, deletedAt: true }
      });

      let supplierId: string;
      let previousSlug: string | null = null;
      let eventType: 'SUPPLIER_CREATED' | 'PROFILE_UPDATED';

      if (existing) {
        if (existing.deletedAt) {
          return {
            status: 'error' as const,
            message: 'This supplier profile is no longer available.'
          };
        }
        if (!canEditSupplierProfile(existing.status)) {
          return {
            status: 'error' as const,
            message:
              existing.status === 'PENDING_APPROVAL'
                ? 'This profile is awaiting review and cannot be edited.'
                : 'Approved profile edits require an admin review workflow.'
          };
        }

        const updated = await transaction.supplier.updateMany({
          where: {
            id: existing.id,
            status: existing.status,
            deletedAt: null
          },
          data: profileData
        });
        if (updated.count !== 1) {
          return {
            status: 'error' as const,
            message:
              'The supplier profile changed while you were editing. Reload and try again.'
          };
        }
        supplierId = existing.id;
        previousSlug = existing.slug;
        eventType = 'PROFILE_UPDATED';
      } else {
        const supplier = await transaction.supplier.create({
          data: {
            ownerUserId,
            ...profileData,
            status: 'DRAFT'
          },
          select: { id: true }
        });
        supplierId = supplier.id;
        eventType = 'SUPPLIER_CREATED';
      }

      if (previousSlug && previousSlug !== values.slug) {
        await transaction.supplierSlugHistory.create({
          data: { supplierId, slug: previousSlug }
        });
      }

      await transaction.supplierCategory.deleteMany({
        where: { supplierId }
      });
      await transaction.supplierServiceArea.deleteMany({
        where: { supplierId }
      });
      await transaction.supplierCategory.createMany({
        data: values.categoryIds.map((categoryId) => ({
          supplierId,
          categoryId,
          isPrimary: categoryId === values.primaryCategoryId,
          isConfirmed: false
        }))
      });
      await transaction.supplierServiceArea.createMany({
        data: values.cityIds.map((cityId) => ({
          supplierId,
          cityId,
          isConfirmed: false,
          isActive: true
        }))
      });
      await transaction.supplierOffering.deleteMany({
        where: { supplierId }
      });
      const offeringNames = values.offerings
        .split('\n')
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
        .slice(0, 20);
      if (offeringNames.length > 0) {
        await transaction.supplierOffering.createMany({
          data: offeringNames.map((name, index) => ({
            supplierId,
            name: name.slice(0, 160),
            sortOrder: index,
            isActive: true
          }))
        });
      }

      await transaction.supplierReviewEvent.create({
        data: {
          supplierId,
          actorUserId: ownerUserId,
          type: eventType,
          reason:
            eventType === 'SUPPLIER_CREATED'
              ? 'Supplier created a profile draft.'
              : 'Supplier saved profile draft changes.',
          details: { source: 'SUPPLIER_PORTAL' }
        }
      });

      return { status: 'success' as const };
    });

    if (result.status === 'error') return result;
    revalidatePath('/dashboard/supplier');
    revalidatePath('/admin/suppliers');
    return { status: 'success' as const, message: 'Draft saved.' };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return {
        status: 'error' as const,
        message: 'That public slug or business profile is already in use.'
      };
    }
    throw error;
  }
}

export async function submitSupplierProfile() {
  const ownerUserId = await requireVerifiedOwner();
  if (!ownerUserId)
    return {
      status: 'error' as const,
      message: 'Verify your email before submitting a supplier profile.'
    };

  const result = await prisma.$transaction(async (transaction) => {
    const supplier = await transaction.supplier.findFirst({
      where: {
        ownerUserId,
        deletedAt: null,
        AND: [
          { slug: { not: { startsWith: 'simulation-' } } },
          { slug: { not: { startsWith: 'test-only-' } } }
        ]
      },
      select: {
        id: true,
        status: true,
        categories: { select: { categoryId: true } },
        serviceAreas: { select: { cityId: true } }
      }
    });

    if (!supplier) {
      return {
        status: 'error' as const,
        message: 'Save a draft before submitting.'
      };
    }
    if (supplier.status === 'PENDING_APPROVAL') {
      return {
        status: 'success' as const,
        message: 'Profile is already pending review.'
      };
    }
    if (
      !getAllowedSupplierTransitions(supplier.status).includes(
        'PENDING_APPROVAL'
      )
    ) {
      return {
        status: 'error' as const,
        message:
          supplier.status === 'APPROVED'
            ? 'This profile is already approved.'
            : 'This profile cannot be submitted for review.'
      };
    }
    if (!supplier.categories.length || !supplier.serviceAreas.length) {
      return {
        status: 'error' as const,
        message: 'Select at least one category and service area.'
      };
    }

    const updated = await transaction.supplier.updateMany({
      where: {
        id: supplier.id,
        status: supplier.status,
        deletedAt: null
      },
      data: { status: 'PENDING_APPROVAL' }
    });
    if (updated.count !== 1) {
      return {
        status: 'error' as const,
        message:
          'The supplier profile changed while you were submitting. Reload and try again.'
      };
    }

    await transaction.supplierReviewEvent.create({
      data: {
        supplierId: supplier.id,
        actorUserId: ownerUserId,
        type: 'STATUS_CHANGED',
        fromStatus: supplier.status,
        toStatus: 'PENDING_APPROVAL',
        reason: 'Supplier submitted the business profile for admin review.'
      }
    });
    return {
      status: 'success' as const,
      message: 'Profile submitted for review.'
    };
  });

  revalidatePath('/dashboard/supplier');
  revalidatePath('/admin/suppliers');
  return result;
}

const supplierContactVisibilitySchema = z.object({
  isContactNamePublic: z.boolean(),
  isPhonePublic: z.boolean(),
  isEmailPublic: z.boolean(),
  isWebsitePublic: z.boolean()
});

export async function saveSupplierContactVisibility(formData: FormData) {
  const ownerUserId = await requireVerifiedOwner();
  if (!ownerUserId) {
    return {
      status: 'error' as const,
      message: 'Verify your email before changing public contact preferences.'
    };
  }

  const parsed = supplierContactVisibilitySchema.safeParse({
    isContactNamePublic: formData.get('isContactNamePublic') === 'on',
    isPhonePublic: formData.get('isPhonePublic') === 'on',
    isEmailPublic: formData.get('isEmailPublic') === 'on',
    isWebsitePublic: formData.get('isWebsitePublic') === 'on'
  });
  if (!parsed.success) {
    return {
      status: 'error' as const,
      message: 'Choose valid public contact preferences.'
    };
  }

  const result = await prisma.$transaction(async (transaction) => {
    const supplier = await transaction.supplier.findFirst({
      where: {
        ownerUserId,
        deletedAt: null,
        AND: [
          { slug: { not: { startsWith: 'simulation-' } } },
          { slug: { not: { startsWith: 'test-only-' } } }
        ]
      },
      select: {
        id: true,
        slug: true,
        status: true,
        isContactNamePublic: true,
        isPhonePublic: true,
        isEmailPublic: true,
        isWebsitePublic: true
      }
    });
    if (!supplier) {
      return {
        status: 'error' as const,
        message: 'Save a supplier profile before changing contact preferences.'
      };
    }

    const updatedPreferences = parsed.data;
    if (
      supplier.status === 'PENDING_APPROVAL' &&
      ((updatedPreferences.isContactNamePublic &&
        !supplier.isContactNamePublic) ||
        (updatedPreferences.isPhonePublic && !supplier.isPhonePublic) ||
        (updatedPreferences.isEmailPublic && !supplier.isEmailPublic) ||
        (updatedPreferences.isWebsitePublic && !supplier.isWebsitePublic))
    ) {
      return {
        status: 'error' as const,
        message:
          'You can hide contact details while review is pending, but wait for the review outcome before making new details public.'
      };
    }

    const changed =
      supplier.isContactNamePublic !==
        updatedPreferences.isContactNamePublic ||
      supplier.isPhonePublic !== updatedPreferences.isPhonePublic ||
      supplier.isEmailPublic !== updatedPreferences.isEmailPublic ||
      supplier.isWebsitePublic !== updatedPreferences.isWebsitePublic;
    if (!changed) {
      return {
        status: 'success' as const,
        message: 'Public contact preferences are unchanged.'
      };
    }

    const updated = await transaction.supplier.updateMany({
      where: {
        id: supplier.id,
        ownerUserId,
        deletedAt: null,
        status: supplier.status,
        isContactNamePublic: supplier.isContactNamePublic,
        isPhonePublic: supplier.isPhonePublic,
        isEmailPublic: supplier.isEmailPublic,
        isWebsitePublic: supplier.isWebsitePublic
      },
      data: updatedPreferences
    });
    if (updated.count !== 1) {
      return {
        status: 'error' as const,
        message:
          'Your contact preferences changed in another session. Reload and try again.'
      };
    }

    await transaction.supplierReviewEvent.create({
      data: {
        supplierId: supplier.id,
        actorUserId: ownerUserId,
        type: 'PROFILE_UPDATED',
        reason: 'Supplier changed public contact visibility preferences.',
        details: {
          source: 'SUPPLIER_PORTAL',
          publicContactVisibility: updatedPreferences
        }
      }
    });

    return {
      status: 'success' as const,
      message: 'Public contact preferences saved.'
    };
  });

  if (result.status === 'success') {
    revalidatePath('/dashboard/supplier');
    const supplier = await prisma.supplier.findUnique({
      where: { ownerUserId },
      select: { slug: true }
    });
    if (supplier) revalidatePath(`/b/${supplier.slug}`);
  }
  return result;
}
