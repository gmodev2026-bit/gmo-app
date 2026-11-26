import { DashboardGate } from '@/components/dashboard/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { getAuthenticatedClientProfile } from '@/server/clients';
import { ClientAccountForms } from './client-account-forms';
import { connection } from 'next/server';
import { Suspense } from 'react';

export default function ClientProfilePage() {
  return (
    <DashboardGate>
      <Suspense fallback={<PageSkeleton />}>
        <ClientProfile />
      </Suspense>
    </DashboardGate>
  );
}

async function ClientProfile() {
  await connection();
  const profile = await getAuthenticatedClientProfile();

  if (!profile) {
    return (
      <main className='mx-auto w-full max-w-3xl p-6 md:p-10'>
        <h1 className='text-3xl font-bold tracking-tight'>Verify your email</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          Email verification is required before account profile features are
          enabled.
        </p>
      </main>
    );
  }

  return (
    <main className='mx-auto w-full max-w-3xl p-6 md:p-10'>
      <h1 className='text-3xl font-bold tracking-tight'>My profile</h1>
      <p className='text-muted-foreground mt-2 text-sm'>
        Manage the details used for your signed-in enquiries.
      </p>

      <ClientAccountForms
        name={profile.name}
        email={profile.email}
        phone={profile.client?.phone ?? ''}
        preferredContact={profile.client?.preferredContact ?? 'PHONE'}
        deletionRequestedAt={
          profile.client?.deletionRequestedAt?.toISOString() ?? null
        }
      />
    </main>
  );
}
