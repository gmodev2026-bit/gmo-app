import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseSchema } from '../src/lib/database-schema';
import {
  PILOT_CATEGORIES,
  PILOT_CITIES,
  PILOT_PROVINCE
} from '../src/features/enquiries/pilot-catalog';

config({ path: '.env.local' });
config();

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: process.env.DATABASE_URL },
    { schema: getDatabaseSchema() }
  )
});

async function main() {
  const runId = randomUUID();
  const slugSuffix = runId.slice(0, 8);

  const province = await prisma.province.upsert({
    where: { code: PILOT_PROVINCE.code },
    update: { isActive: true },
    create: {
      id: PILOT_PROVINCE.id,
      name: PILOT_PROVINCE.name,
      code: PILOT_PROVINCE.code,
      isActive: true
    }
  });

  const city = await prisma.city.upsert({
    where: {
      provinceId_slug: {
        provinceId: province.id,
        slug: PILOT_CITIES[0].slug
      }
    },
    update: { isActive: true },
    create: {
      id: PILOT_CITIES[0].id,
      name: PILOT_CITIES[0].name,
      slug: PILOT_CITIES[0].slug,
      provinceId: province.id,
      isActive: true
    }
  });

  const category = await prisma.category.upsert({
    where: { slug: PILOT_CATEGORIES[0].slug },
    update: { isActive: true },
    create: {
      id: PILOT_CATEGORIES[0].id,
      name: PILOT_CATEGORIES[0].name,
      slug: PILOT_CATEGORIES[0].slug,
      parentId: null,
      isActive: true,
      sortOrder: PILOT_CATEGORIES[0].sortOrder
    }
  });

  const actor = await prisma.user.upsert({
    where: { email: 'pilot-simulation@growmeonline.local' },
    update: { role: 'admin', name: 'Pilot Simulation Admin' },
    create: {
      id: '90000000-0000-4000-8000-000000000001',
      name: 'Pilot Simulation Admin',
      email: 'pilot-simulation@growmeonline.local',
      emailVerified: true,
      role: 'admin'
    }
  });

  const report = await prisma.$transaction(
    async (transaction) => {
      const suppliers = [];
      for (let index = 1; index <= 3; index += 1) {
        const supplier = await transaction.supplier.create({
          data: {
            businessName: `[SIMULATION ${slugSuffix}] Plumbing ${index}`,
            slug: `simulation-${slugSuffix}-plumbing-${index}`,
            businessType: 'SERVICE_PROVIDER',
            phone: `+270000000${index}`,
            status: 'APPROVED',
            isVerified: true,
            verificationMethod: 'Controlled pilot simulation',
            verifiedAt: new Date(),
            verifiedByUserId: actor.id,
            isActive: true,
            categories: {
              create: {
                categoryId: category.id,
                isPrimary: true,
                isConfirmed: true
              }
            },
            serviceAreas: {
              create: {
                cityId: city.id,
                isConfirmed: true,
                isActive: true
              }
            }
          },
          select: { id: true, businessName: true }
        });
        suppliers.push(supplier);
      }

      const publicReference = `GMO-SIM-${slugSuffix.toUpperCase()}`;
      const enquiry = await transaction.enquiry.create({
        data: {
          publicReference,
          submissionKey: runId,
          status: 'PENDING_REVIEW',
          categoryId: category.id,
          cityId: city.id,
          customerName: '[SIMULATION CUSTOMER]',
          customerPhone: '+27000000999',
          customerEmail: null,
          preferredContact: 'PHONE',
          jobDescription:
            '[SIMULATION] Controlled pilot plumbing repair request.',
          privacyNoticeVersion: 'gmo-request-v1-simulation',
          privacyNoticeAcceptedAt: new Date(),
          source: 'SIMULATION'
        },
        select: { id: true, publicReference: true, status: true }
      });

      await transaction.enquiryStatusHistory.create({
        data: {
          enquiryId: enquiry.id,
          actorUserId: actor.id,
          fromStatus: 'PENDING_REVIEW',
          toStatus: 'QUALIFIED',
          reason: '[SIMULATION] Request is suitable for controlled validation.'
        }
      });
      await transaction.enquiry.update({
        where: { id: enquiry.id },
        data: { status: 'QUALIFIED' }
      });

      await transaction.enquiryStatusHistory.create({
        data: {
          enquiryId: enquiry.id,
          actorUserId: actor.id,
          fromStatus: 'QUALIFIED',
          toStatus: 'MATCHING',
          reason: '[SIMULATION] Deterministic eligibility check completed.'
        }
      });
      await transaction.enquiry.update({
        where: { id: enquiry.id },
        data: { status: 'MATCHING' }
      });

      const assignments = [];
      for (const supplier of suppliers) {
        const assignment = await transaction.leadAssignment.create({
          data: {
            enquiryId: enquiry.id,
            supplierId: supplier.id,
            status: 'PENDING_AVAILABILITY'
          },
          select: { id: true, supplierId: true }
        });

        await transaction.supplierAvailabilityResponse.create({
          data: {
            leadAssignmentId: assignment.id,
            supplierId: supplier.id,
            enquiryId: enquiry.id,
            response: 'AVAILABLE',
            note: '[SIMULATION] Availability confirmed for the controlled test.',
            actorUserId: actor.id
          }
        });

        await transaction.leadAssignment.update({
          where: { id: assignment.id },
          data: { status: 'CONFIRMED' }
        });
        assignments.push(assignment);
      }

      for (const assignment of assignments) {
        await transaction.leadAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'DISPATCHED',
            dispatchedAt: new Date(),
            dispatchedByUserId: actor.id
          }
        });

        await transaction.quotaLedgerEntry.create({
          data: {
            supplierId: assignment.supplierId,
            enquiryId: enquiry.id,
            leadAssignmentId: assignment.id,
            type: 'FREE_ASSIGNMENT_CONSUMED',
            actorUserId: actor.id,
            reason: '[SIMULATION] Controlled pilot dispatch consumed quota.'
          }
        });

        await transaction.outboxEvent.create({
          data: {
            idempotencyKey: `supplier-dispatch:${assignment.id}:v1`,
            type: 'SUPPLIER_DISPATCH_CONFIRMED',
            enquiryId: enquiry.id,
            leadAssignmentId: assignment.id,
            payload: {
              schemaVersion: 1,
              supplierId: assignment.supplierId
            },
            isSimulation: true
          }
        });
      }

      await transaction.enquiryStatusHistory.create({
        data: {
          enquiryId: enquiry.id,
          actorUserId: actor.id,
          fromStatus: 'MATCHING',
          toStatus: 'DISPATCHED',
          reason:
            '[SIMULATION] Three confirmed-available suppliers received dispatch.'
        }
      });
      await transaction.enquiry.update({
        where: { id: enquiry.id },
        data: { status: 'DISPATCHED' }
      });

      const followUp = await transaction.leadActivity.create({
        data: {
          enquiryId: enquiry.id,
          type: 'FOLLOW_UP_SCHEDULED',
          channel: 'PHONE',
          status: 'OPEN',
          summary:
            '[SIMULATION] Confirm customer contact and recorded introduction outcome.',
          actorUserId: actor.id,
          scheduledAt: new Date()
        },
        select: { id: true }
      });

      await transaction.leadActivity.update({
        where: { id: followUp.id },
        data: {
          status: 'COMPLETED',
          outcome: 'APPOINTMENT_PROPOSED',
          completedAt: new Date()
        }
      });
      await transaction.leadActivity.create({
        data: {
          enquiryId: enquiry.id,
          type: 'FOLLOW_UP_COMPLETED',
          channel: 'PHONE',
          status: 'COMPLETED',
          outcome: 'APPOINTMENT_PROPOSED',
          summary:
            '[SIMULATION] Supplier introduction outcome: appointment proposed.',
          actorUserId: actor.id,
          occurredAt: new Date(),
          completedAt: new Date()
        }
      });

      await transaction.enquiryStatusHistory.create({
        data: {
          enquiryId: enquiry.id,
          actorUserId: actor.id,
          fromStatus: 'DISPATCHED',
          toStatus: 'CLOSED',
          reason:
            '[SIMULATION] Controlled workflow completed and outcome recorded.'
        }
      });
      await transaction.enquiry.update({
        where: { id: enquiry.id },
        data: { status: 'CLOSED' }
      });

      await transaction.funnelEvent.createMany({
        data: [
          {
            type: 'LANDING_VIEWED',
            sessionKey: runId,
            source: 'SIMULATION'
          },
          {
            type: 'ENQUIRY_FORM_OPENED',
            sessionKey: runId,
            source: 'SIMULATION'
          },
          {
            type: 'ENQUIRY_SUBMITTED',
            sessionKey: runId,
            source: 'SIMULATION',
            categoryId: category.id,
            cityId: city.id
          }
        ]
      });

      const [
        assignmentCount,
        availabilityCount,
        quotaCount,
        historyCount,
        outboxEventCount
      ] =
        await Promise.all([
          transaction.leadAssignment.count({
            where: { enquiryId: enquiry.id, status: 'DISPATCHED' }
          }),
          transaction.supplierAvailabilityResponse.count({
            where: { enquiryId: enquiry.id, response: 'AVAILABLE' }
          }),
          transaction.quotaLedgerEntry.count({
            where: { enquiryId: enquiry.id }
          }),
          transaction.enquiryStatusHistory.count({
            where: { enquiryId: enquiry.id }
          }),
          transaction.outboxEvent.count({
            where: { enquiryId: enquiry.id }
          })
        ]);

      return {
        publicReference,
        enquiryId: enquiry.id,
        supplierCount: suppliers.length,
        assignmentCount,
        availabilityCount,
        quotaCount,
        historyCount,
        outboxEventCount
      };
    },
    {
      maxWait: 10_000,
      timeout: 30_000
    }
  );

  const checks = [
    report.supplierCount === 3,
    report.assignmentCount === 3,
    report.availabilityCount === 3,
    report.quotaCount === 3,
    report.historyCount === 4,
    report.outboxEventCount === 3
  ];

  if (checks.some((passed) => !passed)) {
    throw new Error(
      `Pilot simulation invariant failure: ${JSON.stringify(report)}`
    );
  }

  console.log('GrowMeOnline controlled pilot simulation passed');
  console.log(JSON.stringify(report, null, 2));
  console.log('Verified: 3 eligible suppliers, 3 availability confirmations, 3 dispatches, 3 quota entries, 4 audit transitions, and 3 simulation-only outbox events (not sent).');
}

main()
  .catch((error: unknown) => {
    console.error('Pilot simulation failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
