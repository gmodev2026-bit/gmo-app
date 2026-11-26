import 'server-only';

import { unauthorized } from 'next/navigation';
import prisma from '@/lib/prisma';
import { isAuthenticated } from '@/server/user';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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

  const existing = await prisma.supplier.findUnique({
    where: { ownerUserId },
    select: { id: true, status: true, slug: true }
  });

  if (existing && existing.status === 'PENDING_APPROVAL') {
    return {
      status: 'error' as const,
      message: 'This profile is awaiting review and cannot be edited.'
    };
  }
  if (existing && existing.status === 'APPROVED') {
    return {
      status: 'error' as const,
      message: 'Approved profile edits require an admin review workflow.'
    };
  }

  const values = parsed.data;
  try {
    await prisma.$transaction(async (transaction) => {
      const supplier = await transaction.supplier.upsert({
        where: { ownerUserId },
        create: {
          ownerUserId,
          businessName: values.businessName,
          slug: values.slug,
          businessType: values.businessType,
          tagline: values.tagline || null,
          description: values.description || null,
          contactName: values.contactName || null,
          phone: values.phone,
          email: values.email || null,
          website: values.website || null,
          status: 'DRAFT'
        },
        update: {
          businessName: values.businessName,
          slug: values.slug,
          businessType: values.businessType,
          tagline: values.tagline || null,
          description: values.description || null,
          contactName: values.contactName || null,
          phone: values.phone,
          email: values.email || null,
          website: values.website || null
        },
        select: { id: true }
      });

      if (existing?.slug && existing.slug !== values.slug) {
        await transaction.supplierSlugHistory.create({
          data: { supplierId: supplier.id, slug: existing.slug }
        });
      }

      await transaction.supplierCategory.deleteMany({
        where: { supplierId: supplier.id }
      });
      await transaction.supplierServiceArea.deleteMany({
        where: { supplierId: supplier.id }
      });
      await transaction.supplierCategory.createMany({
        data: values.categoryIds.map((categoryId) => ({
          supplierId: supplier.id,
          categoryId,
          isPrimary: categoryId === values.primaryCategoryId,
          isConfirmed: false
        }))
      });
      await transaction.supplierServiceArea.createMany({
        data: values.cityIds.map((cityId) => ({
          supplierId: supplier.id,
          cityId,
          isConfirmed: false,
          isActive: true
        }))
      });
      await transaction.supplierOffering.deleteMany({
        where: { supplierId: supplier.id }
      });
      const offeringNames = values.offerings
        .split('\n')
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
        .slice(0, 20);
      if (offeringNames.length > 0) {
        await transaction.supplierOffering.createMany({
          data: offeringNames.map((name, index) => ({
            supplierId: supplier.id,
            name: name.slice(0, 160),
            sortOrder: index,
            isActive: true
          }))
        });
      }
    });

    revalidatePath('/dashboard/supplier');
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

  const supplier = await prisma.supplier.findUnique({
    where: { ownerUserId },
    select: {
      id: true,
      status: true,
      businessName: true,
      phone: true,
      slug: true,
      categories: { select: { categoryId: true } },
      serviceAreas: { select: { cityId: true } }
    }
  });

  if (!supplier)
    return {
      status: 'error' as const,
      message: 'Save a draft before submitting.'
    };
  if (supplier.status === 'PENDING_APPROVAL')
    return {
      status: 'success' as const,
      message: 'Profile is already pending review.'
    };
  if (supplier.status === 'APPROVED')
    return {
      status: 'error' as const,
      message: 'This profile is already approved.'
    };
  if (!supplier.categories.length || !supplier.serviceAreas.length) {
    return {
      status: 'error' as const,
      message: 'Select at least one category and service area.'
    };
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.supplier.update({
      where: { id: supplier.id },
      data: { status: 'PENDING_APPROVAL' }
    });
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
  });

  revalidatePath('/dashboard/supplier');
  revalidatePath('/admin/suppliers');
  return {
    status: 'success' as const,
    message: 'Profile submitted for review.'
  };
}
