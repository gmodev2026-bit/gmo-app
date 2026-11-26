import 'server-only';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/server/authorization';
import { writeAdminAuditEvent } from '@/server/admin/audit';

const scheduleSchema = z.object({
  enquiryId: z.uuid(),
  leadAssignmentId: z.preprocess(
    (value) => (typeof value === 'string' && value ? value : undefined),
    z.uuid().optional()
  ),
  channel: z.enum([
    'INTERNAL',
    'PHONE',
    'EMAIL',
    'WHATSAPP',
    'SMS',
    'IN_PERSON',
    'OTHER'
  ]),
  scheduledAt: z.string().trim().datetime({ local: true }),
  summary: z.string().trim().min(5).max(500)
});

const resolveSchema = z.object({
  activityId: z.uuid(),
  outcome: z.enum([
    'NO_ANSWER',
    'REACHED',
    'UNAVAILABLE',
    'NEEDS_MORE_INFORMATION',
    'APPOINTMENT_PROPOSED',
    'APPOINTMENT_BOOKED',
    'QUOTE_REQUESTED',
    'QUOTE_RECEIVED',
    'JOB_REPORTED_WON',
    'JOB_REPORTED_LOST',
    'COMPLETED',
    'CANCELLED',
    'FEEDBACK_RECORDED'
  ]),
  summary: z.string().trim().min(5).max(500)
});

export async function listAdminFollowUps() {
  await requireAdmin();

  return prisma.leadActivity.findMany({
    where: { status: 'OPEN', scheduledAt: { not: null } },
    select: {
      id: true,
      type: true,
      channel: true,
      status: true,
      summary: true,
      scheduledAt: true,
      createdAt: true,
      actor: { select: { name: true } },
      enquiry: {
        select: {
          id: true,
          publicReference: true,
          status: true,
          customerName: true,
          category: { select: { name: true } },
          city: { select: { name: true } }
        }
      }
    },
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }]
  });
}

export async function scheduleLeadFollowUp(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = scheduleSchema.safeParse({
    enquiryId: formData.get('enquiryId'),
    leadAssignmentId: formData.get('leadAssignmentId'),
    channel: formData.get('channel'),
    scheduledAt: formData.get('scheduledAt'),
    summary: formData.get('summary')
  });

  if (!parsed.success) {
    return {
      status: 'error' as const,
      message: 'Enter a valid date, channel and follow-up summary.'
    };
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return {
      status: 'error' as const,
      message: 'Enter a valid scheduled date.'
    };
  }

  return prisma.$transaction(async (transaction) => {
    const enquiry = await transaction.enquiry.findUnique({
      where: { id: parsed.data.enquiryId },
      select: { id: true }
    });
    if (!enquiry) {
      return { status: 'not-found' as const };
    }

    if (parsed.data.leadAssignmentId) {
      const assignment = await transaction.leadAssignment.findFirst({
        where: {
          id: parsed.data.leadAssignmentId,
          enquiryId: enquiry.id
        },
        select: { id: true }
      });
      if (!assignment) {
        return { status: 'invalid-assignment' as const };
      }
    }

    const activity = await transaction.leadActivity.create({
      data: {
        enquiryId: enquiry.id,
        leadAssignmentId: parsed.data.leadAssignmentId,
        type: 'FOLLOW_UP_SCHEDULED',
        channel: parsed.data.channel,
        status: 'OPEN',
        summary: parsed.data.summary,
        actorUserId: actor.id,
        scheduledAt,
        occurredAt: scheduledAt
      }
    });

    await writeAdminAuditEvent(transaction, {
      actorUserId: actor.id,
      action: 'FOLLOW_UP_SCHEDULED',
      entityType: 'ENQUIRY',
      entityId: enquiry.id,
      details: {
        activityId: activity.id,
        channel: parsed.data.channel,
        scheduledAt: scheduledAt.toISOString()
      }
    });

    return { status: 'success' as const };
  }).then((result) => {
    if (result.status === 'not-found') {
      return { status: 'error' as const, message: 'Enquiry not found.' };
    }
    if (result.status === 'invalid-assignment') {
      return {
        status: 'error' as const,
        message: 'The selected lead assignment does not belong to this enquiry.'
      };
    }
    return {
      status: 'success' as const,
      message: 'Follow-up scheduled.'
    };
  });
}

export async function resolveLeadFollowUp(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = resolveSchema.safeParse({
    activityId: formData.get('activityId'),
    outcome: formData.get('outcome'),
    summary: formData.get('summary')
  });

  if (!parsed.success) {
    return {
      status: 'error' as const,
      message: 'Choose an outcome and enter a summary.'
    };
  }

  const result = await prisma.$transaction(async (transaction) => {
    const activity = await transaction.leadActivity.findUnique({
      where: { id: parsed.data.activityId },
      select: {
        id: true,
        status: true,
        enquiryId: true,
        leadAssignmentId: true,
        channel: true
      }
    });

    if (!activity) {
      return { status: 'not-found' as const };
    }
    if (activity.status !== 'OPEN') {
      return { status: 'conflict' as const };
    }

    const completedAt = new Date();
    const updated = await transaction.leadActivity.updateMany({
      where: { id: activity.id, status: 'OPEN' },
      data: {
        status: parsed.data.outcome === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
        outcome: parsed.data.outcome,
        completedAt
      }
    });

    if (updated.count !== 1) {
      return { status: 'conflict' as const };
    }

    await transaction.leadActivity.create({
      data: {
        enquiryId: activity.enquiryId,
        leadAssignmentId: activity.leadAssignmentId,
        type: 'FOLLOW_UP_COMPLETED',
        channel: activity.channel,
        status: 'COMPLETED',
        outcome: parsed.data.outcome,
        summary: parsed.data.summary,
        actorUserId: actor.id,
        occurredAt: completedAt,
        completedAt
      }
    });

    await writeAdminAuditEvent(transaction, {
      actorUserId: actor.id,
      action: 'FOLLOW_UP_RESOLVED',
      entityType: 'ENQUIRY',
      entityId: activity.enquiryId,
      details: {
        activityId: activity.id,
        outcome: parsed.data.outcome
      }
    });

    return { status: 'success' as const };
  });

  switch (result.status) {
    case 'not-found':
      return { status: 'error' as const, message: 'Follow-up not found.' };
    case 'conflict':
      return {
        status: 'error' as const,
        message: 'This follow-up was already resolved.'
      };
    case 'success':
      return {
        status: 'success' as const,
        message: 'Follow-up outcome recorded.'
      };
  }
}
