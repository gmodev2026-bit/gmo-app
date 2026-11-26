import 'server-only';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/server/authorization';

export async function listAdminOutboxEvents() {
  await requireAdmin();

  const [events, statusCounts, simulationCount] = await prisma.$transaction([
    prisma.outboxEvent.findMany({
      take: 50,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        type: true,
        status: true,
        attempts: true,
        isSimulation: true,
        createdAt: true,
        availableAt: true,
        processedAt: true,
        enquiry: {
          select: {
            id: true,
            publicReference: true
          }
        },
        leadAssignment: {
          select: {
            supplier: {
              select: {
                businessName: true
              }
            }
          }
        }
      }
    }),
    prisma.outboxEvent.groupBy({
      by: ['status'],
      where: { isSimulation: false },
      _count: { _all: true }
    }),
    prisma.outboxEvent.count({ where: { isSimulation: true } })
  ]);

  return { events, statusCounts, simulationCount };
}
