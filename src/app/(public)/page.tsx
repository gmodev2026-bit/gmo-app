import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { randomUUID } from 'node:crypto';
import { Check, ChevronDown } from 'lucide-react';
import { recordFunnelEvent } from '@/server/funnel-events';
import { Features } from '@/components/landing/features';
import { HomepageAuthActions } from '@/components/landing/homepage-auth-actions';
import { HomepageSections } from '@/components/landing/homepage-sections';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const supplierCategoryColumns = [
  [
    { name: 'Accommodation', slug: 'accommodation' },
    { name: 'Agriculture', slug: 'agriculture' },
    { name: 'Animal', slug: 'animal' },
    { name: 'Cleaning services', slug: 'cleaning-services' },
    { name: 'Construction', slug: 'construction' },
    { name: 'Cosmetics', slug: 'cosmetics' },
    { name: 'Digital Marketing', slug: 'digital-marketing' },
    { name: 'Hospitality', slug: 'hospitality' },
    { name: 'Information Technology', slug: 'information-technology' },
    { name: 'Motor Vehicle', slug: 'motor-vehicle' },
    { name: 'Natural Products', slug: 'natural-products' },
    { name: 'Pest Control', slug: 'pest-control' },
    { name: 'Professional Education', slug: 'professional-education' },
    { name: 'Rentals', slug: 'rentals' },
    { name: 'Vehicle Services', slug: 'vehicle-services' }
  ],
  [
    { name: 'Accounting', slug: 'accounting' },
    { name: 'AI Services', slug: 'ai-services' },
    { name: 'Building', slug: 'building' },
    { name: 'Computing', slug: 'computing' },
    { name: 'Consulting', slug: 'consulting' },
    { name: 'Cosmetology', slug: 'cosmetology' },
    { name: 'Education and Training', slug: 'education-and-training' },
    { name: 'Household Services', slug: 'household-services' },
    { name: 'Legal', slug: 'legal' },
    { name: 'Music & Audio', slug: 'music-audio' },
    { name: 'Other', slug: 'other' },
    { name: 'Photography', slug: 'photography' },
    { name: 'Programming & Tech', slug: 'programming-tech' },
    { name: 'Website Design', slug: 'website-design' },
    { name: 'Styling', slug: 'styling' }
  ]
];

const journeys = [
  {
    label: 'Customer Journey',
    title: 'Find a supplier you can trust',
    steps: [
      'Browse verified suppliers by category and location',
      "Send an enquiry straight from a supplier's profile",
      'The GrowMeOnline team reviews and forwards your enquiry',
      'The supplier responds and you get the job done'
    ]
  },
  {
    label: 'Supplier Journey',
    title: 'Turn enquiries into qualified leads',
    steps: [
      'List your business with a free supplier profile',
      'Get verified by the GrowMeOnline team',
      'Receive qualified customer leads in your dashboard',
      'Grow your business with a trusted public profile'
    ]
  }
];

type SearchParams = Promise<{
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}>;

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className='min-h-screen overflow-hidden bg-white text-[#090f24]'>
      <Suspense fallback={null}>
        <LandingViewTracker searchParams={searchParams} />
      </Suspense>
      <header className='border-b border-[#edf0f4] bg-white px-5 sm:px-8'>
        <nav
          aria-label='Main navigation'
          className='mx-auto grid max-w-[1100px] grid-cols-[1fr_auto] items-center py-3 xl:grid-cols-[1fr_auto_1fr]'
        >
          <Link
            href='/'
            aria-label='GrowMeOnline home'
            className='inline-flex items-center gap-2.5 justify-self-start'
          >
            <Image
              src='/growmeonline-logo.png'
              alt=''
              width={38}
              height={38}
              priority
            />
            <span className='text-xl font-bold tracking-tight text-[#090f24]'>
              GrowMe<span className='text-[#135858]'>Online</span>
            </span>
          </Link>
          <div className='hidden items-center gap-5 xl:flex'>
            <Link
              href='/suppliers'
              className='whitespace-nowrap text-sm font-medium text-[#62748e] transition-colors hover:text-[#135858]'
            >
              Suppliers
            </Link>
            <Link
              href='#how-it-works'
              className='whitespace-nowrap text-sm font-medium text-[#62748e] transition-colors hover:text-[#135858]'
            >
              How It Works
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type='button'
                    className='group inline-flex h-10 items-center gap-1 whitespace-nowrap text-sm font-medium text-[#090f24] transition-colors hover:text-[#135858]'
                  >
                    Categories
                    <ChevronDown
                      aria-hidden='true'
                      className='size-3.5 transition-transform group-data-[popup-open]:rotate-180'
                    />
                  </button>
                }
              />
              <DropdownMenuContent
                align='center'
                sideOffset={10}
                className='max-h-[min(72vh,620px)] w-[500px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-[#e5ebf0] bg-white p-3 text-[#090f24] shadow-[0_14px_38px_rgba(15,23,42,0.12)]'
              >
                <div className='grid grid-cols-2 gap-x-3'>
                  {supplierCategoryColumns.map((column, columnIndex) => (
                    <div key={columnIndex} className='grid content-start'>
                      {column.map((category) => (
                        <DropdownMenuItem
                          key={category.slug}
                          render={
                            <Link
                              href={`/suppliers?category=${category.slug}`}
                              className='flex min-h-9 w-full items-center rounded-md px-2 text-sm font-medium text-[#141b2d] transition-colors hover:text-[#135858]'
                            >
                              {category.name}
                            </Link>
                          }
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href='#pricing'
              className='whitespace-nowrap text-sm font-medium text-[#62748e] transition-colors hover:text-[#135858]'
            >
              Pricing
            </Link>
            <Link
              href='#about'
              className='whitespace-nowrap text-sm font-medium text-[#62748e] transition-colors hover:text-[#135858]'
            >
              About Us
            </Link>
            <Link
              href='#blog'
              className='whitespace-nowrap text-sm font-medium text-[#62748e] transition-colors hover:text-[#135858]'
            >
              Blog
            </Link>
            <Link
              href='#contact-form'
              className='whitespace-nowrap text-sm font-medium text-[#62748e] transition-colors hover:text-[#135858]'
            >
              Contact Us
            </Link>
          </div>
          <div className='flex items-center justify-self-end gap-3 sm:gap-4'>
            <HomepageAuthActions />
            <Link
              href='/supplier/join'
              className='inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl bg-[#135858] px-3 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(19,88,88,0.2)] transition-colors hover:bg-[#0f4b4b] sm:px-5 sm:text-sm'
            >
              List My Business
            </Link>
          </div>
        </nav>
      </header>

      <section className='px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-20'>
        <div className='mx-auto grid max-w-[1376px] items-center gap-10 lg:grid-cols-[0.98fr_1.02fr] lg:gap-12'>
          <div>
            <h1 className='max-w-[620px] text-[2.65rem] leading-[1.12] font-bold tracking-[-0.045em] text-balance sm:text-5xl lg:text-[3.55rem]'>
              Find <span className='text-[#135858]'>Trusted Suppliers.</span>
              <br />
              Get <span className='text-[#135858]'>More Customers.</span>
              <br />
              Grow Online.
            </h1>
            <p className='mt-6 max-w-[640px] text-base leading-7 text-[#62748e] sm:text-lg sm:leading-8'>
              Find reliable suppliers with confidence, or showcase your
              business and receive qualified customer enquiries. All on one
              trusted platform.
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <Link
                href='/suppliers'
                className='inline-flex h-[60px] items-center justify-center rounded-2xl bg-[#135858] px-7 text-base font-semibold text-white shadow-[0_12px_22px_rgba(19,88,88,0.2)] transition-colors hover:bg-[#0f4b4b]'
              >
                Find a Supplier
              </Link>
              <Link
                href='/supplier/join'
                className='inline-flex h-[60px] items-center justify-center rounded-2xl border border-[#e2e8f0] bg-white px-7 text-base font-semibold text-[#090f24] transition-colors hover:bg-[#f8fafc]'
              >
                List My Business
              </Link>
            </div>
            <ul className='mt-8 grid max-w-[560px] grid-cols-2 gap-x-6 gap-y-3 text-sm text-[#62748e] sm:text-base'>
              {[
                'Reviewed Supplier Profiles',
                'Category and Area Discovery',
                'South African Businesses',
                'Private Contact Controls'
              ].map((benefit) => (
                <li key={benefit} className='flex items-center gap-2'>
                  <Check
                    aria-hidden='true'
                    className='size-[18px] shrink-0 text-[#16a66a]'
                    strokeWidth={3}
                  />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className='relative mx-auto flex aspect-[1.92] w-full max-w-[700px] rounded-[24px] border border-[#e4eaf0] bg-white p-2 shadow-[0_20px_50px_rgba(19,88,88,0.08)]'>
            <div className='relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-[18px]'>
              <Image
                src='/growmeonline-marketplace-illustration.png'
                alt='GrowMeOnline connecting customers with trusted suppliers across South Africa'
                fill
                priority
                sizes='(max-width: 1024px) 100vw, 52vw'
                className='object-cover'
              />
            </div>
          </div>
        </div>
      </section>

      <Features />

      <section
        id='how-it-works'
        className='bg-white px-5 py-20 sm:px-8 sm:py-24'
      >
        <div className='mx-auto max-w-[1368px]'>
          <div className='mx-auto max-w-[780px] text-center'>
            <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
              How It Works
            </p>
            <h2 className='mt-3 text-3xl leading-tight font-bold tracking-tight text-[#090f24] text-balance sm:text-4xl'>
              Two journeys, one trusted platform
            </h2>
            <p className='mt-4 text-base leading-7 text-[#62748e] sm:text-lg sm:leading-8'>
              Whether you&apos;re looking for a supplier or looking for
              customers, GrowMeOnline keeps it simple from start to finish.
            </p>
          </div>
          <div className='mt-10 grid gap-6 lg:grid-cols-2'>
            {journeys.map((journey) => (
              <article
                key={journey.label}
                className='rounded-3xl border border-[#e1e8ef] bg-white px-6 py-7 shadow-[0_2px_5px_rgba(15,23,42,0.07)] sm:px-9 sm:py-9'
              >
                <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
                  {journey.label}
                </p>
                <h3 className='mt-3 text-xl font-semibold tracking-tight text-[#090f24] sm:text-2xl'>
                  {journey.title}
                </h3>
                <ol className='mt-6 space-y-4 sm:space-y-5'>
                  {journey.steps.map((step, index) => (
                    <li key={step} className='flex items-center gap-4'>
                      <span className='grid size-9 shrink-0 place-items-center rounded-full bg-[#135858] text-sm font-semibold text-white'>
                        {index + 1}
                      </span>
                      <span className='text-sm leading-6 text-[#090f24] sm:text-base'>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
          <div className='mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Link
              href='/suppliers'
              className='inline-flex h-[50px] items-center justify-center gap-2 rounded-2xl border border-[#e1e8ef] bg-white px-7 text-sm font-semibold text-[#090f24] transition-colors hover:bg-[#f8fafc]'
            >
              <Check
                aria-hidden='true'
                className='size-4 text-[#16a66a]'
                strokeWidth={2.5}
              />
              Browse Suppliers
            </Link>
            <Link
              href='/supplier/join'
              className='inline-flex h-[50px] items-center justify-center rounded-2xl bg-[#135858] px-7 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(19,88,88,0.2)] transition-colors hover:bg-[#0f4b4b]'
            >
              List My Business
            </Link>
          </div>
          <p className='mt-5 text-center text-xs leading-5 text-[#718096]'>
            Requests are reviewed during staffed hours. GrowMeOnline does not
            perform the work or guarantee a supplier, appointment or outcome.
          </p>
        </div>
      </section>

      <HomepageSections />
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
