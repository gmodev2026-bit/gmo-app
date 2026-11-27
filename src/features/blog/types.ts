import type { BlogPostCategory } from '@/generated/prisma/client';
import type { BlogContent } from '@/features/blog/content';

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: BlogPostCategory;
  author: string;
  readTimeMinutes: number;
  coverImage: string;
  coverImageAlt: string;
  publishedAt: Date | null;
};

export type PublishedBlogPost = BlogPostSummary & {
  content: BlogContent;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
};
