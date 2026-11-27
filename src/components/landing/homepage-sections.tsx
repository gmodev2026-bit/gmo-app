import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { ArrowRight, BadgeCheck, Check, MapPin, Store } from 'lucide-react';
import { ContactForm } from '@/components/landing/contact-form';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { isPilotIntakeEnabled } from '@/lib/pilot-readiness';
import {
  countPublicSuppliers,
  listPublicSuppliers
} from '@/server/public-suppliers';
import { listPublishedBlogPosts } from '@/server/blog';

const contactEmail = 'info@growmeonline.co.za';
const whatsappUrl =
  'https://wa.me/27818680007?text=Hi%20GrowMeOnline%2C%20I%20have%20a%20question.';

export function HomepageSections() {
  return (
    <>
      <FeaturedSuppliersSection />
      <BothSidesSection />
      <PricingSection />
      <AboutSection />
      <BlogSection />
      <ContactSection />
      <Footer />
    </>
  );
}

function FeaturedSuppliersSection() {
  return (
    <section className='bg-white px-5 py-16 sm:px-8 sm:py-20'>
      <div className='mx-auto max-w-[1368px]'>
        <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
          <div>
            <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
              Featured Suppliers
            </p>
            <h2 className='mt-2 text-3xl font-bold tracking-tight text-[#090f24] sm:text-4xl'>
              Trusted by customers across the country
            </h2>
          </div>
          <Link
            href='/suppliers'
            className='inline-flex items-center gap-2 text-sm font-semibold text-[#135858] hover:underline'
          >
            Browse all suppliers
            <ArrowRight aria-hidden='true' className='size-4' />
          </Link>
        </div>
        <Suspense fallback={<FeaturedSupplierFallback />}>
          <FeaturedSupplierCards />
        </Suspense>
      </div>
    </section>
  );
}

function FeaturedSupplierFallback() {
  return (
    <div
      aria-hidden='true'
      className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'
    >
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className='h-64 animate-pulse rounded-2xl border border-[#e4eaf0] bg-[#f7f9fa]'
        />
      ))}
    </div>
  );
}

async function FeaturedSupplierCards() {
  await connection();
  const { suppliers } = await listPublicSuppliers({ page: 1 });
  const featuredSuppliers = suppliers.slice(0, 4);

  if (featuredSuppliers.length === 0) {
    return (
      <div className='mt-8 rounded-2xl border border-dashed border-[#d7e2e8] bg-[#f8fafb] px-6 py-10 text-center'>
        <p className='font-semibold text-[#090f24]'>
          Your business could be featured here.
        </p>
        <Link
          href='/supplier/join'
          className='mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#135858] hover:underline'
        >
          List your business
          <ArrowRight aria-hidden='true' className='size-4' />
        </Link>
      </div>
    );
  }

  return (
    <div className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {featuredSuppliers.map((supplier) => {
        const initials = supplier.businessName
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => word[0])
          .join('')
          .toUpperCase();
        const category =
          supplier.categories[0]?.category.name ?? 'Local supplier';
        const area =
          supplier.serviceAreas.map((item) => item.city.name).join(', ') ||
          'South Africa';

        return (
          <article
            key={supplier.id}
            className='flex min-h-[250px] flex-col rounded-2xl border border-[#e4eaf0] bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.06)]'
          >
            <div className='flex items-start justify-between gap-3'>
              <span
                aria-hidden='true'
                className='grid size-14 place-items-center rounded-xl bg-[#eaf2f1] text-lg font-bold text-[#135858]'
              >
                {initials || <Store className='size-6' />}
              </span>
              <span className='inline-flex items-center gap-1 rounded-full bg-[#eef8f1] px-2.5 py-1 text-xs font-semibold text-[#187348]'>
                <BadgeCheck aria-hidden='true' className='size-3.5' />
                Verified
              </span>
            </div>
            <h3 className='mt-4 line-clamp-2 text-base font-semibold text-[#090f24]'>
              {supplier.businessName}
            </h3>
            <p className='mt-2 text-sm text-[#62748e]'>{category}</p>
            <p className='mt-2 flex items-center gap-1.5 text-xs text-[#718096]'>
              <MapPin aria-hidden='true' className='size-3.5 shrink-0' />
              {area}
            </p>
            <Link
              href={`/b/${supplier.slug}`}
              className='mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#135858] hover:underline'
            >
              View supplier
              <ArrowRight aria-hidden='true' className='size-4' />
            </Link>
          </article>
        );
      })}
    </div>
  );
}

function BothSidesSection() {
  const pilotIntakeEnabled = isPilotIntakeEnabled();
  const customerBenefits = [
    'Every supplier is verified by our team',
    'Browse by category and location',
    'Send an enquiry in under a minute'
  ];
  const supplierBenefits = [
    'Your first 5 qualified leads are free',
    'A trusted, verified public profile',
    'Manage enquiries from one dashboard'
  ];

  return (
    <section className='bg-[#f7f9fa] px-5 py-16 sm:px-8 sm:py-20'>
      <div className='mx-auto max-w-[1200px]'>
        <div className='mx-auto max-w-[760px] text-center'>
          <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
            Built for both sides of the deal
          </p>
          <h2 className='mt-3 text-3xl leading-tight font-bold tracking-tight text-[#090f24] text-balance sm:text-4xl'>
            Whether you need a supplier or want more customers, start here
          </h2>
          <p className='mt-4 text-base leading-7 text-[#62748e]'>
            GrowMeOnline brings verified local businesses and ready-to-buy
            customers together — no fuss, no middleman.
          </p>
        </div>
        <div className='mt-10 grid gap-5 lg:grid-cols-2'>
          <AudienceCard
            eyebrow='Looking for a supplier?'
            title='Find the right supplier, fast'
            description='Browse verified local suppliers and service providers, compare profiles, and send one enquiry — no cold-calling.'
            benefits={customerBenefits}
            primaryLabel='Browse suppliers'
            primaryHref='/suppliers'
            secondaryLabel='Explore categories'
            secondaryHref='/suppliers'
          />
          <AudienceCard
            eyebrow='Own a business?'
            title='Get found by customers who are ready to buy'
            description='Create a free profile, get verified, and receive qualified customer enquiries in your dashboard.'
            benefits={supplierBenefits}
            primaryLabel='List my business'
            primaryHref='/supplier/join'
            secondaryLabel='See pricing'
            secondaryHref='#pricing'
          />
        </div>
        <div className='mt-8 rounded-2xl border border-[#e1e8ef] bg-white px-5 py-5 text-center sm:px-7'>
          <p className='text-sm font-semibold text-[#090f24]'>
            Looking for plumbing, electrical, or handyman help?
          </p>
          <p className='mt-2 text-sm leading-6 text-[#62748e]'>
            Request non-emergency home repairs in Johannesburg or Pretoria.
            Requests are reviewed during staffed hours; we do not perform the
            work or guarantee a supplier, appointment, or outcome.
          </p>
          <Link
            href='/request'
            className='mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#135858] hover:underline'
          >
            {pilotIntakeEnabled ? 'Make a request' : 'Check availability'}
            <ArrowRight aria-hidden='true' className='size-4' />
          </Link>
        </div>
        <p className='mt-7 text-center text-sm text-[#62748e]'>
          Join verified suppliers already growing with GrowMeOnline.
        </p>
      </div>
    </section>
  );
}

function AudienceCard({
  eyebrow,
  title,
  description,
  benefits,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref
}: {
  eyebrow: string;
  title: string;
  description: string;
  benefits: string[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  return (
    <article className='rounded-3xl border border-[#e1e8ef] bg-white p-6 shadow-[0_2px_6px_rgba(15,23,42,0.05)] sm:p-8'>
      <p className='text-sm font-semibold text-[#62748e]'>{eyebrow}</p>
      <h3 className='mt-2 text-2xl font-bold tracking-tight text-[#090f24]'>
        {title}
      </h3>
      <p className='mt-3 text-sm leading-6 text-[#62748e]'>{description}</p>
      <ul className='mt-5 space-y-3'>
        {benefits.map((benefit) => (
          <li
            key={benefit}
            className='flex items-start gap-2.5 text-sm text-[#090f24]'
          >
            <Check
              aria-hidden='true'
              className='mt-0.5 size-4 shrink-0 text-[#16a66a]'
              strokeWidth={2.5}
            />
            {benefit}
          </li>
        ))}
      </ul>
      <div className='mt-7 flex flex-wrap items-center gap-4'>
        <Link
          href={primaryHref}
          className='inline-flex h-11 items-center justify-center rounded-xl bg-[#135858] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0f4b4b]'
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className='text-sm font-semibold text-[#135858] hover:underline'
        >
          {secondaryLabel}
        </Link>
      </div>
    </article>
  );
}

function PricingSection() {
  const pricingBenefits = [
    'Your first 5 qualified leads are completely free',
    'Only approved, genuine customer enquiries count toward your quota',
    'Rejected or spam enquiries never count against you',
    'Upgrade to an active subscription for unlimited qualified leads'
  ];

  return (
    <section id='pricing' className='bg-white px-5 py-16 sm:px-8 sm:py-20'>
      <div className='mx-auto grid max-w-[1200px] gap-8 rounded-3xl border border-[#dce9e7] bg-[#f5faf9] p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center'>
        <div>
          <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
            Simple Pricing
          </p>
          <h2 className='mt-3 text-3xl font-bold tracking-tight text-[#090f24] sm:text-4xl'>
            Your First 5 Qualified Leads Free
          </h2>
          <p className='mt-4 text-sm leading-6 text-[#62748e]'>
            We only count leads that are worth your time. Enquiries are
            reviewed by our team first, so your free quota is spent on real
            customer opportunities — not spam.
          </p>
          <div className='mt-6 flex flex-wrap gap-3'>
            <Link
              href='/supplier/join'
              className='inline-flex h-11 items-center justify-center rounded-xl bg-[#135858] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0f4b4b]'
            >
              List My Business
            </Link>
            <Link
              href='#contact-form'
              className='inline-flex h-11 items-center justify-center rounded-xl border border-[#dce9e7] bg-white px-5 text-sm font-semibold text-[#090f24] transition-colors hover:bg-[#f8fafc]'
            >
              Ask us a question
            </Link>
          </div>
        </div>
        <ul className='space-y-4'>
          {pricingBenefits.map((benefit) => (
            <li
              key={benefit}
              className='flex items-start gap-3 text-sm leading-6 text-[#263746]'
            >
              <Check
                aria-hidden='true'
                className='mt-1 size-4 shrink-0 text-[#16a66a]'
                strokeWidth={2.5}
              />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id='about' className='bg-white px-5 py-16 sm:px-8 sm:py-20'>
      <div className='mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
        <div>
          <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
            About GrowMeOnline
          </p>
          <h2 className='mt-3 text-3xl leading-tight font-bold tracking-tight text-[#090f24] sm:text-4xl'>
            Connecting customers directly with verified local suppliers
          </h2>
          <p className='mt-5 text-sm leading-7 text-[#62748e] sm:text-base'>
            GrowMeOnline&apos;s mission is simple: make it effortless for
            customers to find businesses they can actually trust. Every
            supplier on GrowMeOnline is reviewed and verified before they go
            live, so you&apos;re never gambling on quality. And because
            enquiries go straight to the supplier, there&apos;s no middleman
            taking a cut of the conversation.
          </p>
          <p className='mt-4 text-sm leading-7 text-[#62748e] sm:text-base'>
            For suppliers, that means a steady stream of real, local enquiries
            and a profile that signals credibility from the first message.
          </p>
          <Link
            href='/supplier/join'
            className='mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#135858] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0f4b4b]'
          >
            List My Business
            <ArrowRight aria-hidden='true' className='size-4' />
          </Link>
        </div>
        <Suspense fallback={<AboutStatsFallback />}>
          <AboutStats />
        </Suspense>
      </div>
    </section>
  );
}

function AboutStatsFallback() {
  return (
    <div
      aria-hidden='true'
      className='grid grid-cols-3 gap-3 sm:gap-4'
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className='h-32 animate-pulse rounded-2xl border border-[#e4eaf0] bg-[#f7f9fa]'
        />
      ))}
    </div>
  );
}

async function AboutStats() {
  await connection();
  const supplierCount = await countPublicSuppliers();

  return (
    <div className='grid grid-cols-3 gap-3 sm:gap-4'>
      <StatCard value={supplierCount.toLocaleString('en-ZA')} label='Verified suppliers' />
      <StatCard value='5' label='Free qualified leads for new suppliers' />
      <StatCard value='0%' label='Commission on jobs' />
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className='flex min-h-32 flex-col justify-center rounded-2xl border border-[#e4eaf0] bg-[#f8fafb] p-4 text-center sm:p-5'>
      <p className='text-3xl font-bold tracking-tight text-[#135858] sm:text-4xl'>
        {value}
      </p>
      <p className='mt-2 text-xs leading-5 text-[#62748e] sm:text-sm'>
        {label}
      </p>
    </div>
  );
}

function BlogSection() {
  return (
    <section id='blog' className='bg-[#f7f9fa] px-5 py-16 sm:px-8 sm:py-20'>
      <div className='mx-auto max-w-[1200px]'>
        <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
          <div>
            <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
              Ideas for your next step
            </p>
            <h2 className='mt-2 text-3xl font-bold tracking-tight text-[#090f24] sm:text-4xl'>
              Latest from the blog
            </h2>
          </div>
          <Link
            href='/blog'
            className='inline-flex items-center gap-2 text-sm font-semibold text-[#135858] hover:underline'
          >
            View all posts
            <ArrowRight aria-hidden='true' className='size-4' />
          </Link>
        </div>
        <Suspense fallback={<BlogCardsFallback />}>
          <LatestBlogPosts />
        </Suspense>
      </div>
    </section>
  );
}

async function LatestBlogPosts() {
  await connection();
  const posts = await listPublishedBlogPosts(undefined, 3);

  if (posts.length === 0) {
    return (
      <p className='mt-8 rounded-2xl border border-dashed border-[#d7e2e8] bg-white px-6 py-10 text-center text-sm text-[#62748e]'>
        New articles will be published here.
      </p>
    );
  }

  return (
    <div className='mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
      {posts.map((post, index) => (
        <BlogPostCard key={post.id} post={post} eager={index === 0} />
      ))}
    </div>
  );
}

function BlogCardsFallback() {
  return (
    <p className='mt-8 text-center text-sm text-[#62748e]' role='status'>
      Loading articles…
    </p>
  );
}

function ContactSection() {
  return (
    <section
      id='contact-form'
      className='scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20'
    >
      <div className='mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[0.8fr_1.2fr]'>
        <div>
          <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
            Get in touch
          </p>
          <h2 className='mt-2 text-3xl font-bold tracking-tight text-[#090f24] sm:text-4xl'>
            Have a question?
          </h2>
          <p className='mt-4 max-w-md text-sm leading-7 text-[#62748e] sm:text-base'>
            Have a question about GrowMeOnline? Send us a message and our team
            will reply by email.
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className='mt-7 inline-flex items-center gap-3 text-sm font-medium text-[#62748e] hover:text-[#135858]'
          >
            <span className='grid size-10 place-items-center rounded-xl bg-[#eaf2f1] text-[#135858]'>
              <span aria-hidden='true'>@</span>
            </span>
            {contactEmail}
          </a>
          <a
            href={whatsappUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='mt-4 flex w-fit items-center gap-3 text-sm font-medium text-[#62748e] hover:text-[#135858]'
          >
            <span className='grid size-10 place-items-center rounded-xl bg-[#eaf2f1] text-[#135858]'>
              <MessageIcon />
            </span>
            Chat with us live
          </a>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}

function MessageIcon() {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      fill='none'
      className='size-5'
    >
      <path
        d='M20 11.6a7.9 7.9 0 0 1-8 7.8 8.3 8.3 0 0 1-3.5-.8L4 20l1.2-4.1A7.6 7.6 0 0 1 4 11.6a8 8 0 0 1 16 0Z'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M9 10.3c.4 1.8 1.5 2.9 3.4 3.6l1-1 1.8.8-.2 1.3c-3.4.7-7.5-3.4-6.8-6.8l1.3-.2.8 1.8-1.3.5Z'
        fill='currentColor'
      />
    </svg>
  );
}

function Footer() {
  return (
    <footer className='border-t border-[#e4eaf0] bg-white px-5 py-12 sm:px-8'>
      <div className='mx-auto max-w-[1200px]'>
        <div className='grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.8fr_1fr]'>
          <div>
            <Link
              href='/'
              aria-label='GrowMeOnline home'
              className='inline-flex items-center gap-2'
            >
              <Image
                src='/growmeonline-logo.png'
                alt=''
                width={36}
                height={36}
              />
              <span className='text-lg font-bold tracking-tight text-[#090f24]'>
                GrowMe<span className='text-[#135858]'>Online</span>
              </span>
            </Link>
            <p className='mt-4 max-w-xs text-sm leading-6 text-[#62748e]'>
              GrowMeOnline connects customers with verified South African
              suppliers, service providers, and product sellers.
            </p>
          </div>
          <div>
            <h2 className='text-sm font-semibold text-[#090f24]'>Quick Links</h2>
            <ul className='mt-4 space-y-3 text-sm text-[#62748e]'>
              <li><Link href='#about' className='hover:text-[#135858]'>About</Link></li>
              <li><Link href='#how-it-works' className='hover:text-[#135858]'>How It Works</Link></li>
              <li><Link href='/suppliers' className='hover:text-[#135858]'>Browse Suppliers</Link></li>
              <li><Link href='#pricing' className='hover:text-[#135858]'>Pricing</Link></li>
              <li><Link href='#blog' className='hover:text-[#135858]'>Blog</Link></li>
              <li><Link href='/supplier/join' className='hover:text-[#135858]'>List My Business</Link></li>
              <li><Link href='#contact-form' className='hover:text-[#135858]'>Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h2 className='text-sm font-semibold text-[#090f24]'>Legal</h2>
            <ul className='mt-4 space-y-3 text-sm text-[#62748e]'>
              <li>
                <a
                  href='https://growmeonline.co.za/terms-and-conditions'
                  className='hover:text-[#135858]'
                >
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a
                  href='https://growmeonline.co.za/privacy-policy'
                  className='hover:text-[#135858]'
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className='text-sm font-semibold text-[#090f24]'>Contact Us</h2>
            <a
              href={`mailto:${contactEmail}`}
              className='mt-4 inline-block text-sm text-[#62748e] hover:text-[#135858]'
            >
              {contactEmail}
            </a>
            <p className='mt-7 text-sm font-semibold text-[#090f24]'>
              Ready to reach more local customers?
            </p>
            <Link
              href='/supplier/join'
              className='mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#135858] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0f4b4b]'
            >
              List My Business
              <ArrowRight aria-hidden='true' className='size-4' />
            </Link>
          </div>
        </div>
        <div className='mt-10 flex flex-col gap-2 border-t border-[#edf0f4] pt-5 text-xs text-[#718096] sm:flex-row sm:items-center sm:justify-between'>
          <p>© 2026 GrowMeOnline. All rights reserved.</p>
          <p>Connecting customers with trusted local suppliers.</p>
          <a
            href={whatsappUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-[#135858]'
          >
            Chat with GrowMeOnline on WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
