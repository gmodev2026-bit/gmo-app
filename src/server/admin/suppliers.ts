import 'server-only';

import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/server/authorization';
import { writeAdminAuditEvent } from '@/server/admin/audit';
import { getAllowedSupplierTransitions } from '@/features/suppliers/status';
import type { SupplierMutationResult } from '@/features/suppliers/action-state';
import { deleteBunnyImage, BunnyStorageError } from '@/lib/bunny-storage';

const PAGE_SIZE = 25;

const supplierProfileFieldsSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Enter a valid URL slug.')
    .max(100),
  businessType: z.enum(['SERVICE_PROVIDER', 'PRODUCT_SELLER', 'HYBRID']),
  tagline: z.string().trim().max(160).transform(emptyToNull),
  description: z.string().trim().max(4000).transform(emptyToNull),
  contactName: z.string().trim().max(120).transform(emptyToNull),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^[+0-9()\-\s]+$/, 'Enter a valid phone number.'),
  email: z
    .string()
    .trim()
    .max(254)
    .refine(
      (value) => value === '' || z.email().safeParse(value).success,
      'Enter a valid email address.'
    )
    .transform(emptyToNull),
  website: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (value) =>
        value === '' ||
        z.url({ protocol: /^https?$/ }).safeParse(value).success,
      'Enter a valid http or https website URL.'
    )
    .transform(emptyToNull),
  categoryIds: z
    .array(z.uuid())
    .min(1, 'Select at least one confirmed service category.')
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'Remove duplicate categories.'
    ),
  primaryCategoryId: z.uuid(),
  cityIds: z
    .array(z.uuid())
    .min(1, 'Select at least one confirmed service area.')
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'Remove duplicate service areas.'
    ),
  internalNotes: z.string().trim().max(4000).transform(emptyToNull)
});

const supplierProfileSchema = supplierProfileFieldsSchema.refine(
  hasSelectedPrimaryCategory,
  {
    message: 'Choose a primary category from the selected categories.',
    path: ['primaryCategoryId']
  }
);

const updateSupplierSchema = supplierProfileFieldsSchema
  .extend({
    supplierId: z.uuid(),
    reason: z.string().trim().min(5).max(500)
  })
  .refine(hasSelectedPrimaryCategory, {
    message: 'Choose a primary category from the selected categories.',
    path: ['primaryCategoryId']
  });

const reviewSchema = z.object({
  supplierId: z.uuid(),
  toStatus: z.enum([
    'DRAFT',
    'PENDING_APPROVAL',
    'CHANGES_REQUESTED',
    'APPROVED',
    'SUSPENDED'
  ]),
  isVerified: z.enum(['true', 'false']).transform((value) => value === 'true'),
  isIndexable: z.enum(['true', 'false']).transform((value) => value === 'true'),
  verificationMethod: z.string().trim().max(200).transform(emptyToNull),
  reason: z.string().trim().min(5).max(500)
});

const supplierOwnerLinkSchema = z.object({
  supplierId: z.uuid(),
  email: z.email().trim().toLowerCase()
});

const mediaReviewSchema = z.object({
  mediaAssetId: z.uuid(),
  decision: z.enum(['approve', 'remove']),
  reason: z.string().trim().min(5).max(500)
});

export type SupplierMediaReviewResult =
  | { success: true; supplierId: string; slug: string }
  | {
      success: false;
      message: string;
      supplierId?: string;
      slug?: string;
    };

export async function listAdminSuppliers(requestedPage: number) {
  await requireAdmin();

  const total = await prisma.supplier.count({ where: { deletedAt: null } });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.max(1, Math.min(requestedPage, pageCount));
  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      businessName: true,
      slug: true,
      status: true,
      isVerified: true,
      categories: {
        where: { isConfirmed: true },
        select: { category: { select: { name: true } } },
        orderBy: { isPrimary: 'desc' }
      },
      serviceAreas: {
        where: { isConfirmed: true, isActive: true },
        select: {
          city: {
            select: {
              name: true,
              province: { select: { name: true } }
            }
          }
        },
        orderBy: { city: { name: 'asc' } }
      }
    },
    orderBy: [{ businessName: 'asc' }, { id: 'asc' }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE
  });

  return { suppliers, page, pageCount, total };
}

export async function getSupplierFormOptions() {
  await requireAdmin();

  const [categories, cities] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
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

export async function getAdminSupplier(id: string) {
  await requireAdmin();

  return prisma.supplier.findFirst({
    where: { id, deletedAt: null },
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
      isIndexable: true,
      verificationMethod: true,
      verifiedAt: true,
      verifiedBy: { select: { name: true } },
      owner: {
        select: {
          name: true,
          email: true,
          emailVerified: true
        }
      },
      internalNotes: true,
      categories: {
        select: {
          categoryId: true,
          isPrimary: true,
          isConfirmed: true,
          category: { select: { name: true } }
        },
        orderBy: { isPrimary: 'desc' }
      },
      serviceAreas: {
        select: {
          cityId: true,
          isConfirmed: true,
          isActive: true,
          city: {
            select: {
              name: true,
              province: { select: { name: true } }
            }
          }
        },
        orderBy: { city: { name: 'asc' } }
      },
      reviewHistory: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          fromStatus: true,
          toStatus: true,
          fromVerified: true,
          toVerified: true,
          reason: true,
          createdAt: true,
          actor: { select: { name: true } }
        }
      },
      mediaAssets: {
        where: { purpose: { in: ['LOGO', 'COVER', 'GALLERY'] } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          purpose: true,
          status: true,
          altText: true,
          width: true,
          height: true,
          byteSize: true,
          createdAt: true
        }
      }
    }
  });
}

export async function reviewAdminSupplierMedia(
  formData: FormData
): Promise<SupplierMediaReviewResult> {
  const actor = await requireAdmin();
  const parsed = mediaReviewSchema.safeParse({
    mediaAssetId: formData.get('mediaAssetId'),
    decision: formData.get('decision'),
    reason: formData.get('reason')
  });
  if (!parsed.success) {
    return { success: false, message: 'Review the image action and reason.' };
  }

  const media = await prisma.mediaAsset.findUnique({
    where: { id: parsed.data.mediaAssetId },
    select: {
      id: true,
      supplierId: true,
      objectKey: true,
      purpose: true,
      status: true,
      supplier: { select: { slug: true } }
    }
  });
  if (!media || media.purpose === 'VERIFICATION_DOCUMENT') {
    return { success: false, message: 'Supplier image not found.' };
  }

  if (parsed.data.decision === 'approve' && media.status !== 'PENDING') {
    return {
      success: false,
      message: 'Only pending images can be approved.',
      supplierId: media.supplierId,
      slug: media.supplier.slug
    };
  }
  if (
    parsed.data.decision === 'remove' &&
    !['PENDING', 'READY', 'FAILED', 'REMOVED'].includes(media.status)
  ) {
    return {
      success: false,
      message: 'This image cannot be removed.',
      supplierId: media.supplierId,
      slug: media.supplier.slug
    };
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const current = await transaction.mediaAsset.findUnique({
      where: { id: media.id },
      select: { status: true }
    });
    if (!current) {
      return { success: false as const, message: 'Supplier image not found.' };
    }

    const nextStatus =
      parsed.data.decision === 'approve' ? 'READY' : 'REMOVED';
    const allowedStatuses =
      parsed.data.decision === 'approve'
        ? ['PENDING']
        : ['PENDING', 'READY', 'FAILED', 'REMOVED'];
    if (!allowedStatuses.includes(current.status)) {
      return {
        success: false as const,
        message: 'The image status changed. Refresh and review it again.'
      };
    }

    if (current.status !== nextStatus) {
      await transaction.mediaAsset.update({
        where: { id: media.id },
        data: { status: nextStatus }
      });
    }

    await writeAdminAuditEvent(transaction, {
      actorUserId: actor.id,
      action: 'SUPPLIER_MEDIA_REVIEWED',
      entityType: 'SUPPLIER',
      entityId: media.supplierId,
      details: {
        mediaAssetId: media.id,
        purpose: media.purpose,
        fromStatus: current.status,
        toStatus: nextStatus,
        reason: parsed.data.reason
      }
    });

    return { success: true as const };
  });

  if (!updated.success) {
    return {
      success: false,
      message: updated.message,
      supplierId: media.supplierId,
      slug: media.supplier.slug
    };
  }

  if (parsed.data.decision === 'remove') {
    try {
      await deleteBunnyImage(media.objectKey);
    } catch (error) {
      if (error instanceof BunnyStorageError) {
        console.error('Removed supplier image could not be deleted from Bunny:', {
          mediaAssetId: media.id,
          error: error.message
        });
      } else {
        throw error;
      }
      return {
        success: false,
        message:
          'The image is no longer visible, but Bunny storage cleanup failed. Retry cleanup after checking storage availability.',
        supplierId: media.supplierId,
        slug: media.supplier.slug
      };
    }
  }

  return {
    success: true,
    supplierId: media.supplierId,
    slug: media.supplier.slug
  };
}

export async function linkAdminSupplierOwner(
  formData: FormData
): Promise<SupplierMutationResult> {
  const actor = await requireAdmin();
  const parsed = supplierOwnerLinkSchema.safeParse({
    supplierId: formData.get('supplierId'),
    email: formData.get('email')
  });

  if (!parsed.success) {
    return {
      success: false,
      message: 'Enter the email of an existing GrowMeOnline account.'
    };
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const supplier = await transaction.supplier.findFirst({
        where: {
          id: parsed.data.supplierId,
          deletedAt: null,
          AND: [
            { slug: { not: { startsWith: 'simulation-' } } },
            { slug: { not: { startsWith: 'test-only-' } } }
          ]
        },
        select: { id: true, ownerUserId: true }
      });

      if (!supplier) {
        return { success: false, message: 'Supplier not found.' };
      }
      if (supplier.ownerUserId) {
        return {
          success: false,
          message: 'This supplier is already linked to an account.'
        };
      }

      const owner = await transaction.user.findUnique({
        where: { email: parsed.data.email },
        select: {
          id: true,
          emailVerified: true,
          role: true,
          banned: true,
          ownedSupplier: { select: { id: true } }
        }
      });

      if (!owner) {
        return {
          success: false,
          message:
            'No account matches that email. The supplier must create an account first.'
        };
      }
      if (!owner.emailVerified) {
        return {
          success: false,
          message: 'The account email must be verified before linking.'
        };
      }
      if (owner.role !== 'user' || owner.banned) {
        return {
          success: false,
          message: 'Only an active, non-admin account can own a supplier profile.'
        };
      }
      if (owner.ownedSupplier) {
        return {
          success: false,
          message: 'This account is already linked to a supplier.'
        };
      }

      const updated = await transaction.supplier.updateMany({
        where: {
          id: supplier.id,
          ownerUserId: null,
          deletedAt: null
        },
        data: { ownerUserId: owner.id }
      });

      if (updated.count !== 1) {
        return {
          success: false,
          message:
            'Another admin linked this supplier first. Reload and review the profile.'
        };
      }

      await writeAdminAuditEvent(transaction, {
        actorUserId: actor.id,
        action: 'SUPPLIER_ACCOUNT_LINKED',
        entityType: 'SUPPLIER',
        entityId: supplier.id,
        details: { ownerUserId: owner.id }
      });

      return { success: true, supplierId: supplier.id };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        message: 'This account is already linked to another supplier.'
      };
    }
    throw error;
  }
}

export async function createAdminSupplier(
  formData: FormData
): Promise<SupplierMutationResult> {
  const actor = await requireAdmin();
  const parsed = supplierProfileSchema.safeParse(readProfileForm(formData));

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Check the supplier details.'
    };
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const existing = await transaction.supplier.findUnique({
        where: { slug: parsed.data.slug },
        select: { id: true }
      });

      if (existing) {
        return {
          success: false,
          message: 'That supplier slug is already in use.'
        };
      }

      const [categoryCount, cityCount] = await Promise.all([
        transaction.category.count({
          where: { id: { in: parsed.data.categoryIds }, isActive: true }
        }),
        transaction.city.count({
          where: { id: { in: parsed.data.cityIds }, isActive: true }
        })
      ]);

      if (
        categoryCount !== parsed.data.categoryIds.length ||
        cityCount !== parsed.data.cityIds.length
      ) {
        return {
          success: false,
          message:
            'One or more selected services or areas are no longer active.'
        };
      }

      const supplier = await transaction.supplier.create({
        data: {
          businessName: parsed.data.businessName,
          slug: parsed.data.slug,
          businessType: parsed.data.businessType,
          tagline: parsed.data.tagline,
          description: parsed.data.description,
          contactName: parsed.data.contactName,
          phone: parsed.data.phone,
          email: parsed.data.email,
          website: parsed.data.website,
          internalNotes: parsed.data.internalNotes,
          categories: {
            create: parsed.data.categoryIds.map((categoryId) => ({
              categoryId,
              isPrimary: categoryId === parsed.data.primaryCategoryId,
              isConfirmed: true
            }))
          },
          serviceAreas: {
            create: parsed.data.cityIds.map((cityId) => ({
              cityId,
              isConfirmed: true
            }))
          },
          reviewHistory: {
            create: {
              actorUserId: actor.id,
              type: 'SUPPLIER_CREATED',
              toStatus: 'DRAFT',
              toVerified: false,
              reason: 'Supplier record created manually by an admin.'
            }
          }
        },
        select: { id: true }
      });

      await writeAdminAuditEvent(transaction, {
        actorUserId: actor.id,
        action: 'SUPPLIER_CREATED',
        entityType: 'SUPPLIER',
        entityId: supplier.id,
        details: {
          categoryCount: parsed.data.categoryIds.length,
          serviceAreaCount: parsed.data.cityIds.length
        }
      });

      return { success: true, supplierId: supplier.id };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        message: 'That supplier slug is already in use.'
      };
    }
    throw error;
  }
}

export async function updateAdminSupplierProfile(
  formData: FormData
): Promise<SupplierMutationResult> {
  const actor = await requireAdmin();
  const parsed = updateSupplierSchema.safeParse({
    ...readProfileForm(formData),
    supplierId: formData.get('supplierId'),
    reason: formData.get('reason')
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Check the supplier details.'
    };
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const current = await transaction.supplier.findFirst({
        where: { id: parsed.data.supplierId, deletedAt: null },
        select: {
          id: true,
          updatedAt: true,
          slug: true,
          categories: { select: { categoryId: true } },
          serviceAreas: { select: { cityId: true } }
        }
      });

      if (!current) {
        return { success: false, message: 'Supplier not found.' };
      }

      const [categoryCount, cityCount] = await Promise.all([
        transaction.category.count({
          where: { id: { in: parsed.data.categoryIds }, isActive: true }
        }),
        transaction.city.count({
          where: { id: { in: parsed.data.cityIds }, isActive: true }
        })
      ]);

      if (
        categoryCount !== parsed.data.categoryIds.length ||
        cityCount !== parsed.data.cityIds.length
      ) {
        return {
          success: false,
          message:
            'One or more selected services or areas are no longer active.'
        };
      }

      const updated = await transaction.supplier.updateMany({
        where: {
          id: current.id,
          updatedAt: current.updatedAt,
          deletedAt: null
        },
        data: {
          businessName: parsed.data.businessName,
          slug: parsed.data.slug,
          businessType: parsed.data.businessType,
          tagline: parsed.data.tagline,
          description: parsed.data.description,
          contactName: parsed.data.contactName,
          phone: parsed.data.phone,
          email: parsed.data.email,
          website: parsed.data.website,
          internalNotes: parsed.data.internalNotes
        }
      });

      if (updated.count !== 1) {
        return {
          success: false,
          message: 'Another admin updated this supplier. Reload and try again.'
        };
      }

      if (current.slug !== parsed.data.slug) {
        await transaction.supplierSlugHistory.create({
          data: { supplierId: current.id, slug: current.slug }
        });
      }

      const currentCategoryIds = current.categories.map(
        (item) => item.categoryId
      );
      const currentCityIds = current.serviceAreas.map((item) => item.cityId);
      const categoriesAdded = parsed.data.categoryIds.filter(
        (id) => !currentCategoryIds.includes(id)
      );
      const categoriesRemoved = currentCategoryIds.filter(
        (id) => !parsed.data.categoryIds.includes(id)
      );
      const serviceAreasAdded = parsed.data.cityIds.filter(
        (id) => !currentCityIds.includes(id)
      );
      const serviceAreasRemoved = currentCityIds.filter(
        (id) => !parsed.data.cityIds.includes(id)
      );

      await transaction.supplierCategory.deleteMany({
        where: { supplierId: current.id }
      });
      await transaction.supplierCategory.createMany({
        data: parsed.data.categoryIds.map((categoryId) => ({
          supplierId: current.id,
          categoryId,
          isPrimary: categoryId === parsed.data.primaryCategoryId,
          isConfirmed: true
        }))
      });
      await transaction.supplierServiceArea.deleteMany({
        where: { supplierId: current.id }
      });
      await transaction.supplierServiceArea.createMany({
        data: parsed.data.cityIds.map((cityId) => ({
          supplierId: current.id,
          cityId,
          isConfirmed: true
        }))
      });
      await transaction.supplierReviewEvent.create({
        data: {
          supplierId: current.id,
          actorUserId: actor.id,
          type: 'PROFILE_UPDATED',
          reason: parsed.data.reason,
          details: {
            categoriesAdded,
            categoriesRemoved,
            serviceAreasAdded,
            serviceAreasRemoved
          }
        }
      });

      await writeAdminAuditEvent(transaction, {
        actorUserId: actor.id,
        action: 'SUPPLIER_PROFILE_UPDATED',
        entityType: 'SUPPLIER',
        entityId: current.id,
        details: {
          categoriesAdded: categoriesAdded.length,
          categoriesRemoved: categoriesRemoved.length,
          serviceAreasAdded: serviceAreasAdded.length,
          serviceAreasRemoved: serviceAreasRemoved.length
        }
      });

      return { success: true, supplierId: current.id };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        message: 'That supplier slug is already in use.'
      };
    }
    throw error;
  }
}

export async function reviewAdminSupplier(
  formData: FormData
): Promise<SupplierMutationResult> {
  const actor = await requireAdmin();
  const parsed = reviewSchema.safeParse({
    supplierId: formData.get('supplierId'),
    toStatus: formData.get('toStatus'),
    isVerified: formData.get('isVerified'),
    isIndexable: formData.get('isIndexable'),
    verificationMethod: formData.get('verificationMethod'),
    reason: formData.get('reason')
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Check the review fields.'
    };
  }

  if (
    parsed.data.isVerified &&
    (!parsed.data.verificationMethod ||
      parsed.data.verificationMethod.length < 5)
  ) {
    return {
      success: false,
      message: 'Enter at least 5 characters describing the verification method.'
    };
  }

  return prisma.$transaction(async (transaction) => {
    const current = await transaction.supplier.findFirst({
      where: { id: parsed.data.supplierId, deletedAt: null },
      select: {
        id: true,
        status: true,
        isVerified: true,
        isIndexable: true,
        verificationMethod: true,
        verifiedAt: true,
        verifiedByUserId: true,
        isActive: true,
        categories: {
          where: { isConfirmed: true },
          select: { categoryId: true }
        },
        serviceAreas: {
          where: { isConfirmed: true, isActive: true },
          select: { cityId: true }
        }
      }
    });

    if (!current) {
      return { success: false, message: 'Supplier not found.' };
    }

    const statusChanged = parsed.data.toStatus !== current.status;
    const verificationMethod = parsed.data.isVerified
      ? parsed.data.verificationMethod || current.verificationMethod
      : null;
    const verificationChanged =
      parsed.data.isVerified !== current.isVerified ||
      verificationMethod !== current.verificationMethod;
    const indexabilityChanged = parsed.data.isIndexable !== current.isIndexable;

    if (
      statusChanged &&
      !getAllowedSupplierTransitions(current.status).includes(
        parsed.data.toStatus
      )
    ) {
      return {
        success: false,
        message:
          'That status change is not allowed. Reload the supplier and try again.'
      };
    }

    if (
      parsed.data.toStatus === 'APPROVED' &&
      (!parsed.data.isVerified ||
        !current.isActive ||
        current.categories.length === 0 ||
        current.serviceAreas.length === 0)
    ) {
      return {
        success: false,
        message:
          'Approval requires active status, verified business details, and confirmed services and service areas.'
      };
    }

    if (!statusChanged && !verificationChanged && !indexabilityChanged) {
      return {
        success: false,
        message: 'There are no review changes to save.'
      };
    }

    const updated = await transaction.supplier.updateMany({
      where: {
        id: current.id,
        status: current.status,
        isVerified: current.isVerified,
        verificationMethod: current.verificationMethod,
        isIndexable: current.isIndexable,
        deletedAt: null
      },
      data: {
        status: parsed.data.toStatus,
        isVerified: parsed.data.isVerified,
        isIndexable:
          parsed.data.toStatus === 'APPROVED'
            ? parsed.data.isIndexable
            : false,
        verificationMethod,
        verifiedAt: parsed.data.isVerified
          ? (current.verifiedAt ?? new Date())
          : null,
        verifiedByUserId: parsed.data.isVerified
          ? (current.verifiedByUserId ?? actor.id)
          : null
      }
    });

    if (updated.count !== 1) {
      return {
        success: false,
        message: 'Another admin updated this supplier. Reload and try again.'
      };
    }

    if (statusChanged) {
      await transaction.supplierReviewEvent.create({
        data: {
          supplierId: current.id,
          actorUserId: actor.id,
          type: 'STATUS_CHANGED',
          fromStatus: current.status,
          toStatus: parsed.data.toStatus,
          fromVerified: current.isVerified,
          toVerified: parsed.data.isVerified,
          reason: parsed.data.reason
        }
      });
    }

    if (verificationChanged) {
      await transaction.supplierReviewEvent.create({
        data: {
          supplierId: current.id,
          actorUserId: actor.id,
          type: 'VERIFICATION_CHANGED',
          fromStatus: current.status,
          toStatus: parsed.data.toStatus,
          fromVerified: current.isVerified,
          toVerified: parsed.data.isVerified,
          reason: parsed.data.reason,
          details: {
            fromMethod: current.verificationMethod,
            toMethod: verificationMethod
          }
        }
      });
    }

    await writeAdminAuditEvent(transaction, {
      actorUserId: actor.id,
      action: 'SUPPLIER_REVIEWED',
      entityType: 'SUPPLIER',
      entityId: current.id,
      details: {
        fromStatus: current.status,
        toStatus: parsed.data.toStatus,
        fromVerified: current.isVerified,
        toVerified: parsed.data.isVerified,
        indexable: parsed.data.isIndexable
      }
    });

    return { success: true, supplierId: current.id };
  });
}

function readProfileForm(formData: FormData) {
  return {
    businessName: formData.get('businessName'),
    slug: formData.get('slug'),
    businessType: formData.get('businessType'),
    tagline: formData.get('tagline'),
    description: formData.get('description'),
    contactName: formData.get('contactName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    website: formData.get('website'),
    categoryIds: formData.getAll('categoryIds').map(formValue),
    primaryCategoryId: formData.get('primaryCategoryId'),
    cityIds: formData.getAll('cityIds').map(formValue),
    internalNotes: formData.get('internalNotes')
  };
}

function formValue(value: FormDataEntryValue) {
  return typeof value === 'string' ? value : null;
}

function hasSelectedPrimaryCategory(data: {
  categoryIds: string[];
  primaryCategoryId: string;
}) {
  return data.categoryIds.includes(data.primaryCategoryId);
}

function emptyToNull(value: string) {
  return value || null;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
