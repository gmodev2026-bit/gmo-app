'use server';

import 'server-only';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { isAuthenticated } from '@/server/user';
import { unauthorized } from 'next/navigation';

const clientProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^(\+?[0-9\s()-]+)?$/),
  preferredContact: z.enum(['PHONE', 'WHATSAPP'])
});

export async function getOrCreateAuthenticatedClient() {
  const session = await isAuthenticated();
  if (!session) unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      emailVerified: true,
      banned: true,
      client: true
    }
  });

  if (!user || !user.emailVerified || user.banned) return null;

  let client = user.client;
  if (!client) {
    client = await prisma.client.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {}
    });
  }

  await linkVerifiedGuestEnquiries(client.id, user.id);
  return client;
}

async function linkVerifiedGuestEnquiries(clientId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true }
  });
  if (!user?.emailVerified) return;

  await prisma.enquiry.updateMany({
    where: {
      clientId: null,
      customerEmail: {
        equals: user.email,
        mode: 'insensitive'
      }
    },
    data: { clientId }
  });
}

export async function asyncOptionalAuthenticatedClient() {
  const session = await isAuthenticated();
  if (!session) return null;
  return getOrCreateAuthenticatedClient();
}

export async function getAuthenticatedClientProfile() {
  const client = await getOrCreateAuthenticatedClient();
  if (!client) return null;

  const session = await isAuthenticated();
  if (!session) unauthorized();

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      client: true
    }
  });
}

export async function updateClientProfile(formData: FormData) {
  const session = await isAuthenticated();
  if (!session) unauthorized();

  const parsed = clientProfileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') ?? '',
    preferredContact: formData.get('preferredContact')
  });

  if (!parsed.success) {
    return {
      status: 'error' as const,
      message: 'Please review the highlighted fields.'
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, emailVerified: true, banned: true }
  });

  if (!user || !user.emailVerified || user.banned) {
    return {
      status: 'error' as const,
      message: 'Verify your email before updating your profile.'
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name }
    }),
    prisma.client.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        phone: parsed.data.phone || null,
        preferredContact: parsed.data.preferredContact
      },
      update: {
        phone: parsed.data.phone || null,
        preferredContact: parsed.data.preferredContact
      }
    })
  ]);

  return { status: 'success' as const, message: 'Profile updated.' };
}

export async function requestClientDeletion(formData: FormData) {
  const session = await isAuthenticated();
  if (!session) unauthorized();

  const reason =
    typeof formData.get('reason') === 'string'
      ? formData.get('reason')!.toString().trim()
      : '';

  const client = await getOrCreateAuthenticatedClient();
  if (!client) {
    return {
      status: 'error' as const,
      message: 'Verify your email before requesting privacy action.'
    };
  }

  await prisma.client.update({
    where: { id: client.id },
    data: {
      deletionRequestedAt: new Date(),
      deletionReason: reason || null
    }
  });

  return {
    status: 'success' as const,
    message:
      'Deletion request recorded. GMO staff must complete identity and retention checks before account removal.'
  };
}

export async function getAuthenticatedClientEnquiries() {
  const client = await getOrCreateAuthenticatedClient();
  if (!client) return null;

  return prisma.enquiry.findMany({
    where: { clientId: client.id },
    select: {
      publicReference: true,
      status: true,
      createdAt: true,
      category: { select: { name: true } },
      city: { select: { name: true } },
      leadAssignments: {
        where: { status: { in: ['CONFIRMED', 'DISPATCHED'] } },
        select: {
          supplier: {
            select: {
              businessName: true,
              phone: true,
              email: true,
              website: true
            }
          }
        },
        take: 3
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getAuthenticatedClientEnquiry(publicReference: string) {
  const client = await getOrCreateAuthenticatedClient();
  if (!client) return null;

  return prisma.enquiry.findFirst({
    where: { publicReference, clientId: client.id },
    select: {
      publicReference: true,
      status: true,
      jobDescription: true,
      preferredContact: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      city: { select: { name: true } },
      leadAssignments: {
        where: { status: { in: ['CONFIRMED', 'DISPATCHED'] } },
        select: {
          supplier: {
            select: {
              businessName: true,
              phone: true,
              email: true,
              website: true
            }
          }
        }
      }
    }
  });
}
