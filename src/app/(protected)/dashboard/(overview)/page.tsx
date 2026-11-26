import { DashboardGate } from '@/components/dashboard/auth-gate';
import { Card } from '@/components/ui/card';
import { isAuthenticated } from '@/server/user';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <DashboardGate>
      <div className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-6 md:p-10'>
        <div className='flex flex-col gap-2'>
          <WelcomeTitle />
          <p className='text-muted-foreground'>
            Manage your client profile, review enquiries, or set up a supplier
            profile.
          </p>
        </div>

        <div className='grid gap-4 md:grid-cols-3'>
          <DashboardLink
            href='/dashboard/client'
            title='Complete your client profile'
            description='Add your contact details and preferred way to be reached.'
          />
          <DashboardLink
            href='/dashboard/enquiries'
            title='Review your enquiries'
            description='See the status of enquiries linked to your account.'
          />
          <DashboardLink
            href='/dashboard/supplier'
            title='Supplier profile'
            description='Create or manage a profile if you provide services.'
          />
        </div>
      </div>
    </DashboardGate>
  );
}

function DashboardLink({
  href,
  title,
  description
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Card className='p-6'>
      <Link
        href={href}
        className='focus-visible:ring-ring block rounded-sm outline-none focus-visible:ring-2'
      >
        <h2 className='font-semibold'>{title}</h2>
        <p className='text-muted-foreground mt-2 text-sm'>{description}</p>
        <span className='text-primary mt-4 inline-block text-sm font-medium'>
          Open
        </span>
      </Link>
    </Card>
  );
}

async function WelcomeTitle() {
  const session = await isAuthenticated();

  return (
    <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
      Welcome back, {session?.user.name}!
    </h1>
  );
}
