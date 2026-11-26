import 'server-only';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/server/authorization';

export async function listAdminAuditEvents() {
  await requireAdmin();

  const [events, total] = await prisma.$transaction([
    prisma.adminAuditEvent.findMany({
      take: 100,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        details: true,
        createdAt: true,
        actor: { select: { name: true } }
      }
    }),
    prisma.adminAuditEvent.count()
  ]);

  return { events, total };
}
