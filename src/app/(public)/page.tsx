import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { randomUUID } from 'node:crypto';
import { ArrowRight, Check } from 'lucide-react';
import { recordFunnelEvent } from '@/server/funnel-events';
import { HomepageAuthActions } from '@/components/landing/homepage-auth-actions';
import { isPilotIntakeEnabled } from '@/lib/pilot-readiness';

const services = [
  {
    name: 'Plumbing',
    description: 'Repairs and maintenance for your home.'
  },
  {
    name: 'Electrical',
    description: 'Help with common electrical work.'
  },
  {
    name: 'Handyman',
    description: 'Small repairs and jobs around the home.'
  }
];

type SearchParams = Promise<{
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}>;

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  const pilotIntakeEnabled = isPilotIntakeEnabled();

  return (
    <main className='bg-background min-h-screen overflow-hidden'>
      <Suspense fallback={null}>
        <LandingViewTracker searchParams={searchParams} />
      </Suspense>
      <header className='border-border border-b'>
        <nav
          aria-label='Main navigation'
          className='mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8'
        >
          <Link href='/' className='text-xl font-bold tracking-tight'>
            GrowMe<span className='text-primary'>Online</span>
          </Link>
          <div className='flex items-center gap-2'>
            <Link
              href='#how-it-works'
              className='text-muted-foreground hover:text-foreground hidden text-sm font-medium sm:inline'
            >
              How it works
            </Link>
            <Link
              href='/supplier/join'
              className='text-muted-foreground hover:text-foreground hidden text-sm font-medium md:inline'
            >
              For suppliers
            </Link>
            <Link
              href='/request'
              aria-label={
                pilotIntakeEnabled
                  ? 'Request a provider'
                  : 'Check pilot request availability'
              }
              className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors sm:px-5'
            >
              <span className='sm:hidden'>
                {pilotIntakeEnabled ? 'Request' : 'Pilot status'}
              </span>
              <span className='hidden sm:inline'>
                {pilotIntakeEnabled
                  ? 'Request a provider'
                  : 'Check pilot availability'}
              </span>
              <ArrowRight aria-hidden='true' className='size-4' />
            </Link>
            <HomepageAuthActions />
          </div>
        </nav>
      </header>

      <section className='relative px-5 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -top-32 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-[#ABC945]/15 blur-3xl'
        />
        <div className='relative mx-auto max-w-5xl text-center'>
          <p className='border-border bg-card/80 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold'>
            <span className='size-2 rounded-full bg-[#ABC945]' />
            Starting in Johannesburg and Pretoria
          </p>
          <h1 className='mx-auto mt-7 max-w-4xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl'>
            Find a local pro for your{' '}
            <span className='text-primary'>next home project.</span>
          </h1>
          <p className='text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-8 text-pretty'>
            Tell us what you need. Our team reviews your request and, with your
            agreement, introduces you to suitable local providers.
          </p>
          {!pilotIntakeEnabled && (
            <p
              role='status'
              className='border-border bg-card text-muted-foreground mx-auto mt-5 max-w-xl rounded-xl border px-4 py-3 text-sm'
            >
              Pilot requests are temporarily closed while we confirm local
              provider coverage and review capacity.
            </p>
          )}
          <div className='mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Link
              href='/request'
              className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 font-semibold transition-colors sm:w-auto'
            >
              {pilotIntakeEnabled
                ? 'Tell us what you need'
                : 'Check pilot availability'}
              <ArrowRight aria-hidden='true' className='size-4' />
            </Link>
            <a
              href='#services'
              className='border-border hover:bg-muted inline-flex h-12 w-full items-center justify-center rounded-full border px-7 font-semibold transition-colors sm:w-auto'
            >
              Explore services
            </a>
          </div>
          <p className='text-muted-foreground mt-4 text-xs'>
            Non-emergency home repairs and maintenance only during this pilot.
          </p>
          <p className='text-muted-foreground mt-5 text-sm'>
            Want to manage your profile and account-linked enquiries?{' '}
            <Link
              href='/signup'
              className='text-primary font-semibold hover:underline'
            >
              Create a client account
            </Link>
          </p>
        </div>
      </section>

      <section
        id='services'
        className='bg-muted/40 border-border border-y px-5 py-16 sm:px-8 sm:py-20'
      >
        <div className='mx-auto max-w-7xl'>
          <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
            <div>
              <p className='text-primary text-sm font-semibold tracking-wide uppercase'>
                Pilot services
              </p>
              <h2 className='mt-2 text-3xl font-semibold tracking-tight'>
                What can we help with?
              </h2>
            </div>
            <p className='text-muted-foreground max-w-lg text-sm leading-6'>
              We’re starting small so we can build reliable supplier coverage in
              each service area.
            </p>
          </div>

          <div className='mt-8 grid gap-4 md:grid-cols-3'>
            {services.map((service) => (
              <Link
                key={service.name}
                href='/request'
                className='border-border bg-card group rounded-2xl border p-6 transition-shadow hover:shadow-md'
              >
                <span className='bg-primary/10 text-primary grid size-11 place-items-center rounded-xl'>
                  <Check aria-hidden='true' className='size-5' />
                </span>
                <h3 className='mt-5 text-xl font-semibold'>{service.name}</h3>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
                  {service.description}
                </p>
                <span className='text-primary mt-5 inline-flex items-center gap-2 text-sm font-semibold'>
                  {pilotIntakeEnabled ? 'Make a request' : 'Check availability'}
                  <ArrowRight
                    aria-hidden='true'
                    className='size-4 transition-transform group-hover:translate-x-1'
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id='how-it-works' className='px-5 py-16 sm:px-8 sm:py-20'>
        <div className='mx-auto max-w-7xl'>
          <div className='max-w-2xl'>
            <p className='text-primary text-sm font-semibold tracking-wide uppercase'>
              Simple, human-reviewed
            </p>
            <h2 className='mt-2 text-3xl font-semibold tracking-tight'>
              From request to introduction
            </h2>
          </div>
          <ol className='mt-8 grid gap-4 md:grid-cols-3'>
            {[
              {
                number: '01',
                title: 'Tell us about the work',
                body: 'Share the service, area and details that help us understand your request.'
              },
              {
                number: '02',
                title: 'We review it',
                body: 'Our team checks that the request is suitable and looks for providers in your area.'
              },
              {
                number: '03',
                title: 'Choose whether to proceed',
                body: 'We confirm provider availability before making an introduction.'
              }
            ].map((step) => (
              <li
                key={step.number}
                className='border-border rounded-2xl border p-6'
              >
                <span className='text-primary font-mono text-sm font-semibold'>
                  {step.number}
                </span>
                <h3 className='mt-4 text-lg font-semibold'>{step.title}</h3>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <p className='text-muted-foreground mt-5 text-xs leading-5'>
            Requests are reviewed during staffed hours. GrowMeOnline does not
            perform the work or guarantee a supplier, appointment or outcome.
          </p>
        </div>
      </section>

      <section className='px-5 pb-16 sm:px-8 sm:pb-20'>
        <div className='bg-primary text-primary-foreground mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl px-6 py-10 sm:flex-row sm:items-center sm:px-10'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>
              {pilotIntakeEnabled
                ? 'Ready to tell us what you need?'
                : 'We’re preparing the pilot'}
            </h2>
            <p className='text-primary-foreground/80 mt-2 max-w-xl text-sm leading-6'>
              {pilotIntakeEnabled
                ? 'Submit a request for non-emergency home repair or maintenance in Johannesburg or Pretoria.'
                : 'Request intake is temporarily closed while we confirm provider coverage and staffed review capacity in Johannesburg and Pretoria.'}
            </p>
          </div>
          <Link
            href='/request'
            className='bg-background text-foreground hover:bg-background/90 inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors'
          >
            {pilotIntakeEnabled ? 'Start a request' : 'Check availability'}
            <ArrowRight aria-hidden='true' className='size-4' />
          </Link>
        </div>
      </section>

      <footer className='border-border border-t px-5 py-7 sm:px-8'>
        <div className='text-muted-foreground mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm sm:flex-row'>
          <p className='text-foreground font-semibold'>GrowMeOnline</p>
          <p>
            Connecting customers with local providers, one request at a time.
          </p>
          <div className='flex flex-wrap gap-4'>
            <Link
              href='/signup'
              className='text-primary font-medium hover:underline'
            >
              Create a client account
            </Link>
            <Link
              href='/supplier/join'
              className='text-primary font-medium hover:underline'
            >
              List your business
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

async function LandingViewTracker({
  searchParams
}: {
  searchParams: Promise<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>;
}) {
  await connection();
  const params = await searchParams;

  await recordFunnelEvent({
    type: 'LANDING_VIEWED',
    sessionKey: randomUUID(),
    attribution: {
      utmSource: params.utm_source,
      utmMedium: params.utm_medium,
      utmCampaign: params.utm_campaign
    }
  });

  return null;
}
