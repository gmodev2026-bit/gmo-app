import Link from 'next/link';
import type { BlogContent } from '@/features/blog/content';

export function BlogContentView({ content }: { content: BlogContent }) {
  return (
    <div className='mt-9'>
      {content.blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case 'heading': {
            const Heading = block.level === 2 ? 'h2' : 'h3';
            return (
              <Heading
                key={key}
                className='mt-10 text-xl leading-tight font-bold tracking-tight text-[#090f24] first:mt-0 sm:text-2xl'
              >
                {block.text}
              </Heading>
            );
          }
          case 'paragraph':
            return (
              <p
                key={key}
                className='mt-4 text-base leading-8 text-[#435469] first:mt-0'
              >
                {block.text}
              </p>
            );
          case 'list': {
            const List = block.ordered ? 'ol' : 'ul';
            return (
              <List
                key={key}
                className={`mt-4 space-y-2 pl-6 text-base leading-7 text-[#435469] ${
                  block.ordered ? 'list-decimal' : 'list-disc'
                }`}
              >
                {block.items.map((item) => (
                  <li key={item} className='pl-1'>
                    {item}
                  </li>
                ))}
              </List>
            );
          }
          case 'cta':
            return (
              <section
                key={key}
                className='mt-12 rounded-2xl bg-[#eaf2f1] p-6 sm:p-8'
              >
                <h2 className='text-xl font-bold tracking-tight text-[#090f24]'>
                  {block.heading}
                </h2>
                <p className='mt-2 max-w-2xl text-sm leading-6 text-[#435469]'>
                  {block.text}
                </p>
                <div className='mt-5 flex flex-wrap gap-3'>
                  {block.links.map((link, linkIndex) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={
                        linkIndex === 0
                          ? 'inline-flex h-10 items-center rounded-xl bg-[#135858] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0f4b4b]'
                          : 'inline-flex h-10 items-center rounded-xl border border-[#cbd9d8] bg-white px-5 text-sm font-semibold text-[#135858] transition-colors hover:bg-[#f8fafc]'
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </section>
            );
        }
      })}
    </div>
  );
}
