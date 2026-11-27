import { BlogPostCategory } from '@/generated/prisma/client';

export const BLOG_CATEGORY_LABELS: Record<BlogPostCategory, string> = {
  [BlogPostCategory.FOR_CUSTOMERS]: 'For Customers',
  [BlogPostCategory.FOR_SUPPLIERS]: 'For Suppliers',
  [BlogPostCategory.PLATFORM_UPDATES]: 'Platform Updates'
};

export const BLOG_CATEGORIES = [
  BlogPostCategory.FOR_CUSTOMERS,
  BlogPostCategory.FOR_SUPPLIERS,
  BlogPostCategory.PLATFORM_UPDATES
];

export function isBlogPostCategory(
  value: string | undefined
): value is BlogPostCategory {
  return value !== undefined && Object.hasOwn(BLOG_CATEGORY_LABELS, value);
}
