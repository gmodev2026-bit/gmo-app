import 'server-only';

import prisma from '@/lib/prisma';
import { filterPublicSupplierContacts } from '@/features/suppliers/public-contact';

export const PUBLIC_SUPPLIER_WHERE = {
  deletedAt: null,
  isActive: true,
  status: 'APPROVED' as const,
  isIndexable: true,
  isVerified: true,
  AND: [
    { slug: { not: { startsWith: 'simulation-' } } },
    { slug: { not: { startsWith: 'test-only-' } } }
  ]
};

export async function countPublicSuppliers() {
  return prisma.supplier.count({ where: PUBLIC_SUPPLIER_WHERE });
}

export async function listPublicSupplierCategories() {
  return prisma.category.findMany({
    where: {
      isActive: true,
      parentId: { not: null },
      suppliers: {
        some: {
          isConfirmed: true,
          supplier: PUBLIC_SUPPLIER_WHERE
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
  });
}

export async function listPublicSupplierCities(categoryId?: string) {
  return prisma.city.findMany({
    where: {
      isActive: true,
      supplierServiceAreas: {
        some: {
          isConfirmed: true,
          isActive: true,
          supplier: {
            ...PUBLIC_SUPPLIER_WHERE,
            ...(categoryId
              ? {
                  categories: {
                    some: {
                      categoryId,
                      isConfirmed: true
                    }
                  }
                }
              : {})
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      province: { select: { name: true, code: true } }
    },
    orderBy: [{ name: 'asc' }]
  });
}

export async function listPublicSuppliers({
  categorySlug,
  citySlug,
  page = 1
}: {
  categorySlug?: string;
  citySlug?: string;
  page?: number;
}) {
  const whereCategory = categorySlug
    ? { categories: { some: { category: { slug: categorySlug }, isConfirmed: true } } }
    : {};
  const whereCity = citySlug
    ? {
        serviceAreas: {
          some: {
            city: { slug: citySlug },
            isConfirmed: true,
            isActive: true
          }
        }
      }
    : {};

  const where = {
    ...PUBLIC_SUPPLIER_WHERE,
    ...whereCategory,
    ...whereCity
  };

  const pageSize = 12;
  const safePage = Math.max(1, Number.isSafeInteger(page) ? page : 1);
  const [total, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      select: {
        id: true,
        businessName: true,
        slug: true,
        tagline: true,
        categories: {
          where: { isConfirmed: true },
          select: { category: { select: { name: true, slug: true } } },
          orderBy: { isPrimary: 'desc' }
        },
        serviceAreas: {
          where: { isConfirmed: true, isActive: true },
          select: { city: { select: { name: true, slug: true } } },
          orderBy: { city: { name: 'asc' } }
        },
        offerings: {
          where: { isActive: true },
          select: { id: true, name: true, description: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: [{ businessName: 'asc' }, { id: 'asc' }],
      skip: (safePage - 1) * pageSize,
      take: pageSize
    })
  ]);

  return {
    suppliers,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    total
  };
}

export async function getPublicSupplier(slug: string) {
  const supplier = await prisma.supplier.findFirst({
    where: {
      slug,
      ...PUBLIC_SUPPLIER_WHERE
    },
    select: {
      id: true,
      businessName: true,
      slug: true,
      tagline: true,
      description: true,
      contactName: true,
      website: true,
      phone: true,
      email: true,
      isContactNamePublic: true,
      isPhonePublic: true,
      isEmailPublic: true,
      isWebsitePublic: true,
      categories: {
        where: { isConfirmed: true },
        select: {
          isPrimary: true,
          category: { select: { id: true, name: true, slug: true } }
        },
        orderBy: { isPrimary: 'desc' }
      },
      serviceAreas: {
        where: { isConfirmed: true, isActive: true },
        select: {
          city: {
            select: {
              id: true,
              name: true,
              slug: true,
              province: { select: { name: true, code: true } }
            }
          }
        },
        orderBy: { city: { name: 'asc' } }
      },
      offerings: {
        where: { isActive: true },
        select: { id: true, name: true, description: true },
        orderBy: { sortOrder: 'asc' }
      },
      mediaAssets: {
        where: {
          status: 'READY',
          purpose: { in: ['LOGO', 'COVER', 'GALLERY'] }
        },
        select: {
          id: true,
          purpose: true,
          altText: true,
          width: true,
          height: true
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!supplier) return null;

  const {
    isContactNamePublic,
    isPhonePublic,
    isEmailPublic,
    isWebsitePublic,
    ...publicSupplier
  } = supplier;

  return {
    ...publicSupplier,
    ...filterPublicSupplierContacts({
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      website: supplier.website,
      isContactNamePublic,
      isPhonePublic,
      isEmailPublic,
      isWebsitePublic
    })
  };
}

export async function listPublicSupplierSlugs() {
  const suppliers = await prisma.supplier.findMany({
    where: PUBLIC_SUPPLIER_WHERE,
    select: { slug: true },
    orderBy: { slug: 'asc' }
  });

  return suppliers.map((supplier) => supplier.slug);
}

export async function getPublicSupplierForLegacySlug(slug: string) {
  const history = await prisma.supplierSlugHistory.findUnique({
    where: { slug },
    select: {
      supplier: {
        select: {
          slug: true,
          deletedAt: true,
          isActive: true,
          status: true,
          isVerified: true,
          isIndexable: true
        }
      }
    }
  });

  if (
    !history ||
    history.supplier.deletedAt ||
    !history.supplier.isActive ||
    history.supplier.status !== 'APPROVED' ||
    !history.supplier.isVerified ||
    !history.supplier.isIndexable
  ) {
    return null;
  }

  return history.supplier.slug;
}
