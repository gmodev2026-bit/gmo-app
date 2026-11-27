import Image from 'next/image';
import Link from 'next/link';
import { BLOG_CATEGORY_LABELS } from '@/features/blog/categories';
import { formatBlogPostDate } from '@/features/blog/format';
import type { BlogPostSummary } from '@/features/blog/types';

export function BlogPostCard({
  post,
  eager = false
}: {
  post: BlogPostSummary;
  eager?: boolean;
}) {
  return (
    <article className='overflow-hidden rounded-2xl border border-[#e4eaf0] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]'>
      <Link href={`/blog/${post.slug}`} className='group block'>
        <div className='relative aspect-[1.75] overflow-hidden bg-[#eaf2f1]'>
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt}
            fill
            loading={eager ? 'eager' : 'lazy'}
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            className='object-cover transition-transform duration-300 group-hover:scale-[1.03]'
          />
        </div>
        <div className='p-5'>
          <p className='text-xs font-semibold tracking-wide text-[#135858] uppercase'>
            {BLOG_CATEGORY_LABELS[post.category]}
          </p>
          <h2 className='mt-2 text-lg leading-snug font-semibold text-[#090f24]'>
            {post.title}
          </h2>
          <p className='mt-2 text-sm leading-6 text-[#62748e]'>
            {post.excerpt}
          </p>
          <p className='mt-4 text-xs text-[#718096]'>
            {formatBlogPostDate(post.publishedAt)}{' '}
            <span aria-hidden='true'>·</span> {post.readTimeMinutes} min read
          </p>
        </div>
      </Link>
    </article>
  );
}
