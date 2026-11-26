'use server';

import 'server-only';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/server/authorization';
import { writeAdminAuditEvent } from '@/server/admin/audit';

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  description: z.string().trim().max(500).optional(),
  parentId: z.union([z.uuid(), z.literal('')]).optional()
});

const locationSchema = z.object({
  provinceId: z.uuid(),
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100)
});

export async function listAdminCatalog() {
  await requireAdmin();
  const [categories, provinces] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        sortOrder: true,
        parentId: true
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
    }),
    prisma.province.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        cities: {
          select: { id: true, name: true, slug: true, isActive: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })
  ]);
  return { categories, provinces };
}

export async function createAdminCategory(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    parentId: formData.get('parentId') || ''
  });
  if (!parsed.success) {
    return { status: 'error' as const, message: parsed.error.issues[0]?.message ?? 'Check category fields.' };
  }

  const data = parsed.data;
  try {
    const category = await prisma.$transaction(async (transaction) => {
      const created = await transaction.category.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          parentId: data.parentId || null
        }
      });
      await writeAdminAuditEvent(transaction, {
        actorUserId: actor.id,
        action: 'CATALOG_UPDATED',
        entityType: 'CATALOG',
        entityId: created.id,
        details: { operation: 'CREATE_CATEGORY', name: created.name, slug: created.slug }
      });
      return created;
    });
    return { status: 'success' as const, message: `Category "${category.name}" created.` };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { status: 'error' as const, message: 'That category slug is already in use.' };
    }
    throw error;
  }
}

export async function setAdminCategoryActive(categoryId: string, isActive: boolean) {
  const actor = await requireAdmin();
  await prisma.$transaction(async (transaction) => {
    const category = await transaction.category.update({
      where: { id: categoryId },
      data: { isActive }
    });
    await writeAdminAuditEvent(transaction, {
      actorUserId: actor.id,
      action: 'CATALOG_UPDATED',
      entityType: 'CATALOG',
      entityId: category.id,
      details: { operation: 'SET_CATEGORY_ACTIVE', isActive }
    });
  });
  return { status: 'success' as const, message: isActive ? 'Category activated.' : 'Category deactivated safely.' };
}

export async function createAdminCity(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = locationSchema.safeParse({
    provinceId: formData.get('provinceId'),
    name: formData.get('name'),
    slug: formData.get('slug')
  });
  if (!parsed.success) {
    return { status: 'error' as const, message: parsed.error.issues[0]?.message ?? 'Check location fields.' };
  }

  try {
    const city = await prisma.$transaction(async (transaction) => {
      const created = await transaction.city.create({ data: parsed.data });
      await writeAdminAuditEvent(transaction, {
        actorUserId: actor.id,
        action: 'CATALOG_UPDATED',
        entityType: 'CATALOG',
        entityId: created.id,
        details: { operation: 'CREATE_CITY', name: created.name, slug: created.slug }
      });
      return created;
    });
    return { status: 'success' as const, message: `City "${city.name}" created.` };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { status: 'error' as const, message: 'That city slug already exists in this province.' };
    }
    throw error;
  }
}

export async function setAdminCityActive(cityId: string, isActive: boolean) {
  const actor = await requireAdmin();
  await prisma.$transaction(async (transaction) => {
    const city = await transaction.city.update({
      where: { id: cityId },
      data: { isActive }
    });
    await writeAdminAuditEvent(transaction, {
      actorUserId: actor.id,
      action: 'CATALOG_UPDATED',
      entityType: 'CATALOG',
      entityId: city.id,
      details: { operation: 'SET_CITY_ACTIVE', isActive }
    });
  });
  return { status: 'success' as const, message: isActive ? 'Location activated.' : 'Location deactivated safely.' };
}
