import 'server-only';

import { cache } from 'react';
import { BlogPostCategory, BlogPostStatus } from '@/generated/prisma/client';
import { parseBlogContent } from '@/features/blog/content';
import type { BlogPostSummary, PublishedBlogPost } from '@/features/blog/types';
import prisma from '@/lib/prisma';

const publishedWhere = {
  status: BlogPostStatus.PUBLISHED,
  publishedAt: { not: null }
};

export const listPublishedBlogPosts = cache(
  async (
    category?: BlogPostCategory,
    take = 50
  ): Promise<BlogPostSummary[]> =>
    prisma.blogPost.findMany({
      where: {
        ...publishedWhere,
        ...(category ? { category } : {})
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        author: true,
        readTimeMinutes: true,
        coverImage: true,
        coverImageAlt: true,
        publishedAt: true
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
      take
    })
);

export const getPublishedBlogPost = cache(
  async (slug: string): Promise<PublishedBlogPost | null> => {
  const post = await prisma.blogPost.findFirst({
    where: { ...publishedWhere, slug },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      author: true,
      readTimeMinutes: true,
      coverImage: true,
      coverImageAlt: true,
      content: true,
      seoTitle: true,
      seoDescription: true,
      publishedAt: true,
      updatedAt: true
    }
  });

    return post ? { ...post, content: parseBlogContent(post.content) } : null;
  }
);

export const listRelatedBlogPosts = cache(async (postId: string) =>
  prisma.blogPost.findMany({
    where: {
      ...publishedWhere,
      id: { not: postId }
    },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      author: true,
      readTimeMinutes: true,
      coverImage: true,
      coverImageAlt: true,
      publishedAt: true
    },
    orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
    take: 3
  })
);

export const listPublishedBlogPostSitemapEntries = cache(() =>
  prisma.blogPost.findMany({
    where: publishedWhere,
    select: { slug: true, publishedAt: true, updatedAt: true },
    orderBy: [{ publishedAt: 'desc' }, { slug: 'asc' }]
  })
);
