import 'server-only';

import {
  Prisma,
  type AdminAuditAction,
  type AdminAuditEntityType
} from '@/generated/prisma/client';

type AdminAuditEventInput = {
  actorUserId: string;
  action: AdminAuditAction;
  entityType: AdminAuditEntityType;
  entityId: string;
  details?: Prisma.InputJsonValue;
};

export async function writeAdminAuditEvent(
  transaction: Prisma.TransactionClient,
  input: AdminAuditEventInput
) {
  return transaction.adminAuditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      ...(input.details ? { details: input.details } : {})
    }
  });
}
