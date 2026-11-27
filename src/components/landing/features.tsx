import Link from 'next/link';
import { BadgeCheck, ShieldCheck, Target, TrendingUp } from 'lucide-react';

const FEATURES = [
  {
    icon: BadgeCheck,
    title: 'Reviewed supplier profiles',
    body: 'Supplier profiles are reviewed before they can appear in the public directory. If changes are needed, suppliers receive feedback.'
  },
  {
    icon: Target,
    title: 'Useful category and area filters',
    body: 'Browse eligible listings by service category and confirmed operating area.'
  },
  {
    icon: ShieldCheck,
    title: 'Contact details stay in suppliers’ hands',
    body: 'Business owners choose which contact fields appear publicly. Contact details remain private by default.'
  },
  {
    icon: TrendingUp,
    title: 'A considered enquiry process',
    body: 'Guided requests and review steps are built into the platform. Public request intake remains closed while pilot coverage is being built.'
  }
];

export function Features() {
  return (
    <section
      id='features'
      className='bg-[#f7f9fa] px-5 py-16 sm:px-8 sm:py-20'
    >
      <div className='mx-auto max-w-[1200px]'>
        <div className='mx-auto max-w-2xl text-center'>
          <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
            Built for trust and clarity
          </p>
          <h2 className='mt-3 text-3xl font-bold tracking-tight text-[#090f24] text-balance sm:text-4xl'>
            Useful tools for both sides of the marketplace
          </h2>
          <p className='mt-4 text-base leading-7 text-[#62748e]'>
            Clear supplier profiles, careful review, and privacy controls help
            customers and businesses take the next step with confidence.
          </p>
        </div>
        <div className='mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className='rounded-2xl border border-[#e4eaf0] bg-white p-5 shadow-[0_2px_5px_rgba(15,23,42,0.06)]'
            >
              <span className='grid size-10 place-items-center rounded-xl bg-[#eaf2f1] text-[#135858]'>
                <Icon aria-hidden='true' className='size-5' strokeWidth={2} />
              </span>
              <h3 className='mt-4 text-sm font-semibold text-[#090f24] sm:text-[15px]'>
                {title}
              </h3>
              <p className='mt-2 text-xs leading-[1.65] text-[#62748e] sm:text-[13px]'>
                {body}
              </p>
            </article>
          ))}
        </div>
        <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Link
            href='/suppliers'
            className='inline-flex h-11 items-center justify-center rounded-xl border border-[#e1e8ef] bg-white px-6 text-sm font-semibold text-[#090f24] transition-colors hover:bg-[#f8fafc]'
          >
            Browse suppliers
          </Link>
          <Link
            href='/supplier/join'
            className='inline-flex h-11 items-center justify-center rounded-xl bg-[#135858] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0f4b4b]'
          >
            List your business
          </Link>
        </div>
      </div>
    </section>
  );
}
