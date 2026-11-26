import 'server-only';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/server/authorization';

export async function getPilotMetrics() {
  await requireAdmin();

  const [
    received,
    qualified,
    rejected,
    spam,
    dispatchedAssignments,
    openFollowUps,
    assignments,
    statusChanges,
    quoteCount,
    wonCount,
    lostCount,
    categoryCounts,
    cityCounts,
    recentActivities,
    landingViews,
    formOpened,
    funnelSubmitted,
    funnelFailed,
    simulationEnquiries
  ] = await prisma.$transaction([
    prisma.enquiry.count({ where: { source: { not: 'SIMULATION' } } }),
    prisma.enquiry.count({
      where: { status: 'QUALIFIED', source: { not: 'SIMULATION' } }
    }),
    prisma.enquiry.count({
      where: { status: 'REJECTED', source: { not: 'SIMULATION' } }
    }),
    prisma.enquiry.count({
      where: { status: 'REJECTED_SPAM', source: { not: 'SIMULATION' } }
    }),
    prisma.leadAssignment.count({
      where: {
        status: 'DISPATCHED',
        enquiry: { source: { not: 'SIMULATION' } }
      }
    }),
    prisma.leadActivity.count({
      where: {
        status: 'OPEN',
        scheduledAt: { not: null },
        enquiry: { source: { not: 'SIMULATION' } }
      }
    }),
    prisma.leadAssignment.findMany({
      where: { enquiry: { source: { not: 'SIMULATION' } } },
      select: {
        availabilityResponses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { response: true }
        }
      }
    }),
    prisma.enquiryStatusHistory.findMany({
      where: {
        fromStatus: 'PENDING_REVIEW',
        enquiry: { source: { not: 'SIMULATION' } }
      },
      select: { createdAt: true, enquiry: { select: { createdAt: true } } }
    }),
    prisma.leadActivity.count({
      where: {
        outcome: 'QUOTE_RECEIVED',
        status: 'COMPLETED',
        enquiry: { source: { not: 'SIMULATION' } }
      }
    }),
    prisma.leadActivity.count({
      where: {
        outcome: 'JOB_REPORTED_WON',
        status: 'COMPLETED',
        enquiry: { source: { not: 'SIMULATION' } }
      }
    }),
    prisma.leadActivity.count({
      where: {
        outcome: 'JOB_REPORTED_LOST',
        status: 'COMPLETED',
        enquiry: { source: { not: 'SIMULATION' } }
      }
    }),
    prisma.enquiry.groupBy({
      by: ['categoryId'],
      where: { source: { not: 'SIMULATION' } },
      _count: { _all: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: 5
    }),
    prisma.enquiry.groupBy({
      by: ['cityId'],
      where: { source: { not: 'SIMULATION' } },
      _count: { _all: true },
      orderBy: { _count: { cityId: 'desc' } },
      take: 5
    }),
    prisma.leadActivity.findMany({
      where: { enquiry: { source: { not: 'SIMULATION' } } },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        channel: true,
        status: true,
        outcome: true,
        summary: true,
        createdAt: true,
        actor: { select: { name: true } },
        enquiry: {
          select: { publicReference: true }
        }
      }
    }),
    prisma.funnelEvent.count({
      where: { type: 'LANDING_VIEWED', source: { not: 'SIMULATION' } }
    }),
    prisma.funnelEvent.count({
      where: { type: 'ENQUIRY_FORM_OPENED', source: { not: 'SIMULATION' } }
    }),
    prisma.funnelEvent.count({
      where: { type: 'ENQUIRY_SUBMITTED', source: { not: 'SIMULATION' } }
    }),
    prisma.funnelEvent.count({
      where: { type: 'ENQUIRY_SUBMISSION_FAILED', source: { not: 'SIMULATION' } }
    }),
    prisma.enquiry.count({ where: { source: 'SIMULATION' } })
  ], {
    maxWait: 20_000,
    timeout: 30_000
  });

  const [categoryNames, cityNames] = await Promise.all([
    prisma.category.findMany({
      where: { id: { in: categoryCounts.map((item) => item.categoryId) } },
      select: { id: true, name: true }
    }),
    prisma.city.findMany({
      where: { id: { in: cityCounts.map((item) => item.cityId) } },
      select: { id: true, name: true }
    })
  ]);

  const categoryNameMap = new Map(
    categoryNames.map((category) => [category.id, category.name])
  );
  const cityNameMap = new Map(cityNames.map((city) => [city.id, city.name]));

  const assignmentResponses = assignments
    .map((assignment) => assignment.availabilityResponses[0]?.response)
    .filter((response): response is 'AVAILABLE' | 'UNAVAILABLE' | 'NO_RESPONSE' | 'NEEDS_CLARIFICATION' => Boolean(response));
  const responded = assignmentResponses.length;
  const available = assignmentResponses.filter(
    (response) => response === 'AVAILABLE'
  ).length;
  const unavailable = assignmentResponses.filter(
    (response) => response === 'UNAVAILABLE'
  ).length;
  const noResponse = assignmentResponses.filter(
    (response) => response === 'NO_RESPONSE'
  ).length;
  const needsClarification = assignmentResponses.filter(
    (response) => response === 'NEEDS_CLARIFICATION'
  ).length;

  const firstReviewDurations = statusChanges
    .map((change) => {
      const duration =
        change.createdAt.getTime() - change.enquiry.createdAt.getTime();
      return duration >= 0 ? duration : null;
    })
    .filter((duration): duration is number => duration !== null);
  const averageFirstReviewMinutes =
    firstReviewDurations.length === 0
      ? null
      : Math.round(
          firstReviewDurations.reduce((total, duration) => total + duration, 0) /
            firstReviewDurations.length /
            60_000
        );

  return {
    funnel: {
      received,
      qualified,
      rejected,
      spam,
      simulationEnquiries,
      dispatchedAssignments,
      openFollowUps,
      averageFirstReviewMinutes,
      landingViews,
      formOpened,
      funnelSubmitted,
      funnelFailed,
      abandonmentEstimate: Math.max(0, formOpened - funnelSubmitted),
      landingToSubmissionRate:
        landingViews === 0
          ? null
          : Math.round((funnelSubmitted / landingViews) * 100),
      formToSubmissionRate:
        formOpened === 0
          ? null
          : Math.round((funnelSubmitted / formOpened) * 100)
    },
    supplierResponse: {
      requested: assignments.length,
      responded,
      available,
      unavailable,
      noResponse,
      needsClarification,
      responseRate:
        assignments.length === 0
          ? null
          : Math.round((responded / assignments.length) * 100)
    },
    outcomes: {
      quoteCount,
      wonCount,
      lostCount
    },
    topCategories: categoryCounts.map((item) => ({
      name: categoryNameMap.get(item.categoryId) ?? 'Unknown',
      count: item._count._all
    })),
    topCities: cityCounts.map((item) => ({
      name: cityNameMap.get(item.cityId) ?? 'Unknown',
      count: item._count._all
    })),
    recentActivities
  };
}
