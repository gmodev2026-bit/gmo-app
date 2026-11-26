import 'server-only';

import { randomUUID } from 'node:crypto';
import prisma from '@/lib/prisma';

export type FunnelAttribution = {
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export async function recordFunnelEvent(input: {
  type:
    | 'LANDING_VIEWED'
    | 'ENQUIRY_FORM_OPENED'
    | 'ENQUIRY_SUBMITTED'
    | 'ENQUIRY_SUBMISSION_FAILED';
  sessionKey: string;
  attribution?: FunnelAttribution;
  categoryId?: string;
  cityId?: string;
}) {
  try {
    await prisma.funnelEvent.create({
      data: {
        type: input.type,
        sessionKey: input.sessionKey,
        source: input.attribution?.source ?? 'WEBSITE',
        utmSource: normalizeAttribution(input.attribution?.utmSource),
        utmMedium: normalizeAttribution(input.attribution?.utmMedium),
        utmCampaign: normalizeAttribution(input.attribution?.utmCampaign),
        categoryId: input.categoryId,
        cityId: input.cityId
      }
    });
  } catch (error) {
    console.error('Failed to record a privacy-safe funnel event:', error);
  }
}

export function createAnalyticsSessionKey() {
  return randomUUID();
}

function normalizeAttribution(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 100);
}
