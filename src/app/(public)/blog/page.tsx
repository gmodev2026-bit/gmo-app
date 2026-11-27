import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_LABELS,
  isBlogPostCategory
} from '@/features/blog/categories';
import { listPublishedBlogPosts } from '@/server/blog';

export const metadata: Metadata = {
  title: 'The GrowMeOnline Blog',
  description:
    'Practical advice for growing your business and finding suppliers you can trust.',
  alternates: { canonical: '/blog' }
};

type SearchParams = Promise<{
  category?: string | string[];
}>;

export default function BlogPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className='min-h-screen bg-[#f7f9fa] px-5 py-12 sm:px-8 sm:py-16'>
      <div className='mx-auto max-w-[1200px]'>
        <header className='mx-auto max-w-2xl text-center'>
          <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
            Local knowledge. Shared growth.
          </p>
          <h1 className='mt-3 text-3xl font-bold tracking-tight text-[#090f24] sm:text-4xl'>
            The GrowMeOnline Blog
          </h1>
          <p className='mt-4 text-base leading-7 text-[#62748e]'>
            Practical advice for growing your business and finding suppliers
            you can trust.
          </p>
        </header>

        <Suspense fallback={<BlogArchiveFallback />}>
          <BlogArchive searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function BlogArchive({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  await connection();
  const params = await searchParams;
  const requestedCategory = first(params.category);
  const category = isBlogPostCategory(requestedCategory)
    ? requestedCategory
    : undefined;
  const posts = await listPublishedBlogPosts(category);

  return (
    <>
      <nav
        aria-label='Blog categories'
        className='mt-8 flex flex-wrap justify-center gap-2'
      >
        <CategoryLink href='/blog' active={!category}>
          All
        </CategoryLink>
        {BLOG_CATEGORIES.map((item) => (
          <CategoryLink
            key={item}
            href={`/blog?category=${item}`}
            active={category === item}
          >
            {BLOG_CATEGORY_LABELS[item]}
          </CategoryLink>
        ))}
      </nav>

      <p className='mt-7 text-sm text-[#62748e]' role='status'>
        {posts.length} {posts.length === 1 ? 'article' : 'articles'}
      </p>

      {posts.length === 0 ? (
        <p className='mt-4 rounded-2xl border border-[#e4eaf0] bg-white px-5 py-12 text-center text-sm text-[#62748e]'>
          No articles are available in this category yet.
        </p>
      ) : (
        <div className='mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
          {posts.map((post, index) => (
            <BlogPostCard key={post.id} post={post} eager={index === 0} />
          ))}
        </div>
      )}
    </>
  );
}

function CategoryLink({
  href,
  active,
  children
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'inline-flex h-9 items-center rounded-full bg-[#135858] px-4 text-sm font-semibold text-white'
          : 'inline-flex h-9 items-center rounded-full border border-[#dfe8eb] bg-white px-4 text-sm font-medium text-[#435469] transition-colors hover:border-[#135858] hover:text-[#135858]'
      }
    >
      {children}
    </Link>
  );
}

function BlogArchiveFallback() {
  return (
    <p className='mt-8 text-center text-sm text-[#62748e]' role='status'>
      Loading articles…
    </p>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
