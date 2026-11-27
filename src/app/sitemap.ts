import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';
import { listPublishedBlogPostSitemapEntries } from '@/server/blog';
import { listPublicSupplierSlugs } from '@/server/public-suppliers';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [supplierSlugs, blogPosts] = await Promise.all([
    listPublicSupplierSlugs(),
    listPublishedBlogPostSitemapEntries()
  ]);
  const profileEntries = supplierSlugs.map((slug) => ({
    url: `${SITE_URL}/b/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }));
  const blogEntries = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6
  }));

  return [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/suppliers`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/request`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/signup`, changeFrequency: 'yearly', priority: 0.3 },
    ...blogEntries,
    ...profileEntries
  ];
}
