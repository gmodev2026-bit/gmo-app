import { z } from 'zod';

const BlogLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().regex(/^\/(?!\/)/)
});

const BlogBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('heading'),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().min(1)
  }),
  z.object({
    type: z.literal('paragraph'),
    text: z.string().min(1)
  }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(z.string().min(1)).min(1)
  }),
  z.object({
    type: z.literal('cta'),
    heading: z.string().min(1),
    text: z.string().min(1),
    links: z.array(BlogLinkSchema).min(1)
  })
]);

export const BlogContentSchema = z.object({
  blocks: z.array(BlogBlockSchema).min(1)
});

export type BlogContent = z.infer<typeof BlogContentSchema>;

export function parseBlogContent(content: unknown): BlogContent {
  return BlogContentSchema.parse(content);
}
