import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { BlogContentView } from '@/components/blog/blog-content';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { BLOG_CATEGORY_LABELS } from '@/features/blog/categories';
import { formatBlogPostDate } from '@/features/blog/format';
import { SITE_URL } from '@/lib/constants';
import {
  getPublishedBlogPost,
  listRelatedBlogPosts
} from '@/server/blog';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);

  if (!post) {
    return {
      title: 'Article not found | GrowMeOnline Blog',
      robots: { index: false, follow: true }
    };
  }

  const title = post.seoTitle ?? `${post.title} | GrowMeOnline Blog`;
  const description = post.seoDescription ?? post.excerpt;
  const canonical = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: [
        {
          url: `${SITE_URL}${post.coverImage}`,
          alt: post.coverImageAlt
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}${post.coverImage}`]
    }
  };
}

export default function BlogPostPage({ params }: PageProps) {
  return (
    <main className='min-h-screen bg-white px-5 py-10 sm:px-8 sm:py-14'>
      <Suspense fallback={<BlogPostFallback />}>
        <BlogArticle params={params} />
      </Suspense>
    </main>
  );
}

async function BlogArticle({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);

  if (!post) notFound();

  const relatedPosts = await listRelatedBlogPosts(post.id);
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { '@type': 'Organization', name: post.author },
    image: [`${SITE_URL}${post.coverImage}`],
    mainEntityOfPage: canonical
  };

  return (
    <div className='mx-auto max-w-[860px]'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c')
        }}
      />
      <nav aria-label='Breadcrumb' className='text-sm text-[#62748e]'>
        <Link href='/blog' className='font-medium text-[#135858] hover:underline'>
          Blog
        </Link>
        <span aria-hidden='true'> / </span>
        <span>{BLOG_CATEGORY_LABELS[post.category]}</span>
      </nav>

      <article className='mt-7'>
        <header>
          <p className='text-sm font-semibold tracking-wide text-[#135858] uppercase'>
            {BLOG_CATEGORY_LABELS[post.category]}
          </p>
          <h1 className='mt-3 text-3xl leading-tight font-bold tracking-tight text-[#090f24] text-balance sm:text-5xl'>
            {post.title}
          </h1>
          <p className='mt-5 max-w-3xl text-lg leading-8 text-[#62748e]'>
            {post.excerpt}
          </p>
          <p className='mt-5 text-sm text-[#718096]'>
            By {post.author}
            <span aria-hidden='true'> · </span>
            {post.publishedAt && (
              <time dateTime={post.publishedAt.toISOString()}>
                {formatBlogPostDate(post.publishedAt)}
              </time>
            )}
            <span aria-hidden='true'> · </span>
            {post.readTimeMinutes} min read
          </p>
        </header>

        <div className='relative mt-8 aspect-[1.9] overflow-hidden rounded-2xl bg-[#eaf2f1]'>
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt}
            fill
            priority
            sizes='(max-width: 900px) 100vw, 860px'
            className='object-cover'
          />
        </div>

        <BlogContentView content={post.content} />
      </article>

      {relatedPosts.length > 0 && (
        <section className='mt-14 border-t border-[#e4eaf0] pt-9'>
          <h2 className='text-2xl font-bold tracking-tight text-[#090f24]'>
            Related articles
          </h2>
          <div className='mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {relatedPosts.map((relatedPost) => (
              <BlogPostCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BlogPostFallback() {
  return (
    <p className='mx-auto max-w-[860px] py-12 text-sm text-[#62748e]' role='status'>
      Loading article…
    </p>
  );
}
