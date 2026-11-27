import {
  BlogPostCategory,
  BlogPostStatus,
  type Prisma
} from '../src/generated/prisma/client';

const supplierCta = {
  type: 'cta',
  heading: 'Ready to grow your business?',
  text: 'Create your business profile and connect with customers looking for what you offer.',
  links: [
    { label: 'List My Business', href: '/supplier/join' },
    { label: 'Find a Supplier', href: '/suppliers' }
  ]
};

export const BLOG_POST_SEEDS = [
  {
    slug: 'get-more-enquiries-local-service-provider',
    title: 'How to get more enquiries as a local service provider',
    excerpt:
      'Turn a clear business profile, useful photographs, and thoughtful replies into better conversations with local customers.',
    category: BlogPostCategory.FOR_SUPPLIERS,
    author: 'GrowMeOnline Team',
    readTimeMinutes: 2,
    coverImage: '/blog-enquiries.jpg',
    coverImageAlt:
      'A business owner preparing to respond to customer enquiries',
    seoTitle:
      'How to get more enquiries as a local service provider | GrowMeOnline Blog',
    seoDescription:
      'Turn a clear business profile, useful photographs, and thoughtful replies into better conversations with local customers.',
    status: BlogPostStatus.PUBLISHED,
    publishedAt: new Date('2026-11-15T09:00:00.000Z'),
    content: {
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Start with the customer’s question'
        },
        {
          type: 'paragraph',
          text: 'When someone needs a plumber, caterer, cleaner, or shuttle service, they are usually trying to solve a specific problem. Your first job is to make it easy for them to recognise that you can help. A clear description of your services is more useful than a promise to be the best business in South Africa.'
        },
        {
          type: 'paragraph',
          text: 'Explain what you do, where you work, and which types of jobs suit your business. If you provide airport transfers around Pretoria, say that plainly. If you supply celebration cakes, describe the occasions and styles you actually offer. Specific information helps customers send relevant enquiries instead of vague requests.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Make your profile easy to understand'
        },
        {
          type: 'paragraph',
          text: 'Before sharing your profile, check these essentials:'
        },
        {
          type: 'list',
          ordered: false,
          items: [
            'Use the business name customers already know.',
            'Describe your main services in everyday language.',
            'Keep your city, province, and business hours accurate.',
            'Upload clear photographs of real work or products, with permission.',
            'Answer common questions without inventing prices or guarantees.'
          ]
        },
        {
          type: 'paragraph',
          text: 'A customer should not have to guess whether you can handle their request. Where details depend on the job, explain what information you need before quoting.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Share a useful destination'
        },
        {
          type: 'paragraph',
          text: 'Share your GrowMeOnline profile with existing customers and on your own social pages. Add a short sentence about the service rather than posting a bare link. For example, explain that customers can view your recent work and submit an enquiry through the platform.'
        },
        {
          type: 'paragraph',
          text: 'Ask satisfied customers if they are comfortable recommending your business. Avoid buying reviews or claiming recommendations you cannot support. Consistent, honest communication builds trust over time.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Reply with a clear next step'
        },
        {
          type: 'paragraph',
          text: 'When an enquiry is released to your business, read the request carefully. Acknowledge the customer’s needs, ask only for missing details, and explain what happens next. If you cannot take the job, a polite answer is still better than silence.'
        },
        {
          type: 'paragraph',
          text: 'Keep notes on which questions customers repeatedly ask. Those questions can become improvements to your description or photographs, helping the next customer make an informed decision.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Keep improving'
        },
        {
          type: 'paragraph',
          text: 'More enquiries are not guaranteed by a profile alone. Start with accurate details, useful examples, and dependable replies. Review your profile regularly, and focus on helping suitable customers take one confident step towards working with you.'
        },
        supplierCta
      ]
    }
  },
  {
    slug: 'business-profile-that-stands-out',
    title: 'What makes a business profile stand out',
    excerpt:
      'A practical checklist for turning your business profile into a clear, credible introduction—not a collection of empty promises.',
    category: BlogPostCategory.FOR_SUPPLIERS,
    author: 'GrowMeOnline Team',
    readTimeMinutes: 2,
    coverImage: '/blog-profile.jpg',
    coverImageAlt: 'A well-presented local business profile',
    seoTitle: 'What makes a business profile stand out | GrowMeOnline Blog',
    seoDescription:
      'A practical checklist for turning your business profile into a clear, credible introduction—not a collection of empty promises.',
    status: BlogPostStatus.PUBLISHED,
    publishedAt: new Date('2026-11-12T09:00:00.000Z'),
    content: {
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Clarity beats clever wording'
        },
        {
          type: 'paragraph',
          text: 'A strong business profile answers three questions quickly: what does this business offer, where does it operate, and why should a customer enquire? You do not need a long sales pitch to answer them. Start with a straightforward introduction that sounds like your business and reflects the work you actually do.'
        },
        {
          type: 'paragraph',
          text: 'Describe your main offering first. Then explain who you serve and the practical details customers need before contacting you. An accounting practice, a cake maker, and a garden maintenance team will need different details, but all benefit from clear language.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Show the work, not just the logo'
        },
        {
          type: 'paragraph',
          text: 'Your logo can help people recognise your business, but photographs often explain your offering more effectively. Choose sharp, well-lit images that show real products, completed work, or the vehicles and equipment involved in your service.'
        },
        {
          type: 'paragraph',
          text: 'Only upload images you own or have permission to use. Do not present a category photograph as proof of a project you completed. Where possible, include several examples rather than repeatedly uploading the same image.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Build a practical description'
        },
        {
          type: 'paragraph',
          text: 'Use this checklist when reviewing your profile:'
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Introduce your core business in one clear paragraph.',
            'List the products or services customers can request.',
            'Explain your working areas without overstating your reach.',
            'Keep opening hours and contact details up to date.',
            'Remove claims you cannot demonstrate or explain.',
            'Include useful answers to recurring customer questions.'
          ]
        },
        {
          type: 'paragraph',
          text: 'If an offering depends on availability, customisation, or an assessment, make that clear. Customers appreciate knowing what information they should include in an enquiry.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Write for people first'
        },
        {
          type: 'paragraph',
          text: 'Avoid repeating the same town and service name in every sentence. Search engines are not the only readers: a real customer needs to understand your business. Natural descriptions, useful headings, and accurate product names are better than a paragraph packed with keywords.'
        },
        {
          type: 'paragraph',
          text: 'Read the profile aloud. If a sentence feels confusing or exaggerated, simplify it. Ask someone unfamiliar with the business to explain what you offer after reading the page.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Treat your profile as a living introduction'
        },
        {
          type: 'paragraph',
          text: 'A profile is not finished forever after the first upload. Update it when your services, photographs, hours, or working areas change. Small, accurate improvements help customers judge whether you are a good match and make their first enquiry more useful.'
        },
        supplierCta
      ]
    }
  },
  {
    slug: 'how-business-verification-works',
    title: 'How GrowMeOnline reviews business profiles—and why it matters',
    excerpt:
      'Understand profile review, what a verified listing means, and why customers should still discuss their requirements before hiring.',
    category: BlogPostCategory.PLATFORM_UPDATES,
    author: 'GrowMeOnline Team',
    readTimeMinutes: 2,
    coverImage: '/blog-verification.jpg',
    coverImageAlt: 'A supplier profile being reviewed for verification',
    seoTitle:
      'How GrowMeOnline reviews business profiles—and why it matters | GrowMeOnline Blog',
    seoDescription:
      'Understand profile review, what a verified listing means, and why customers should still discuss their requirements before hiring.',
    status: BlogPostStatus.PUBLISHED,
    publishedAt: new Date('2026-11-09T09:00:00.000Z'),
    content: {
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Why business profiles are reviewed'
        },
        {
          type: 'paragraph',
          text: 'Customers need enough information to decide whether a supplier is relevant to their request. GrowMeOnline reviews submitted business profiles before they appear as approved public listings. This gives the platform a chance to check the information supplied and identify details that need clarification.'
        },
        {
          type: 'paragraph',
          text: 'Review is part of building a useful marketplace. It is not a guarantee that every future job will meet a customer’s expectations, and it should not replace a customer’s own assessment of a supplier.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'From draft to public listing'
        },
        {
          type: 'paragraph',
          text: 'A supplier creates an account and completes a business profile. While the profile is a draft, the business can work on its description, offerings, location, and photographs. When the required information is ready, the supplier can submit the profile for review.'
        },
        {
          type: 'paragraph',
          text: 'An administrator reviews the submission. An approved profile can appear publicly. If changes are needed, the supplier can receive feedback, update the details, and submit again. Suppliers should follow the current guidance shown in their account rather than assume a fixed review time.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Prepare information that helps reviewers'
        },
        {
          type: 'paragraph',
          text: 'Before submitting, check the following:'
        },
        {
          type: 'list',
          ordered: false,
          items: [
            'The business name is accurate and consistent.',
            'The description explains genuine services or products.',
            'The selected category fits the business’s main work.',
            'Location and contact information are current.',
            'Photographs are relevant and used with permission.',
            'Statements about experience or qualifications are truthful.'
          ]
        },
        {
          type: 'paragraph',
          text: 'Do not include invented accreditations, unsupported awards, or guarantees. If a claim needs explanation, describe it plainly and be prepared to clarify it.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'What customers should understand'
        },
        {
          type: 'paragraph',
          text: 'A verified or approved listing indicates that the profile has passed the platform’s review process. It does not mean GrowMeOnline guarantees workmanship, insurance, professional registration, or a particular outcome.'
        },
        {
          type: 'paragraph',
          text: 'For work that requires a licence, specialist registration, or safety certificate, ask the supplier for the relevant evidence and check it with the appropriate organisation. Discuss scope, timing, payment terms, and any written quotation directly before committing.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Trust is an ongoing responsibility'
        },
        {
          type: 'paragraph',
          text: 'Suppliers help maintain trust by keeping their profiles accurate and responding professionally. Customers help by providing clear requests and asking sensible questions. Profile review is a useful starting point, while an informed conversation remains an important part of choosing the right business for a particular job.'
        },
        supplierCta
      ]
    }
  },
  {
    slug: 'choose-a-trustworthy-supplier',
    title: 'How to choose a trustworthy supplier',
    excerpt:
      'Compare relevant experience, ask better questions, and agree the important details before booking a local business.',
    category: BlogPostCategory.FOR_CUSTOMERS,
    author: 'GrowMeOnline Team',
    readTimeMinutes: 2,
    coverImage: '/blog-trust.jpg',
    coverImageAlt: 'A customer comparing local service providers',
    seoTitle: 'How to choose a trustworthy supplier | GrowMeOnline Blog',
    seoDescription:
      'Compare relevant experience, ask better questions, and agree the important details before booking a local business.',
    status: BlogPostStatus.PUBLISHED,
    publishedAt: new Date('2026-11-06T09:00:00.000Z'),
    content: {
      blocks: [
        {
          type: 'heading',
          level: 2,
          text: 'Begin with your actual requirements'
        },
        {
          type: 'paragraph',
          text: 'Finding a trustworthy supplier starts with knowing what you need. Write a short description of the job or product, where it is needed, and your preferred timing. If you have a budget range, decide whether sharing it would help a supplier propose a suitable option.'
        },
        {
          type: 'paragraph',
          text: 'For a shuttle booking, the number of passengers and pickup points matter. For catering, the guest count and dietary requirements matter. Clear requirements make it easier to compare suppliers on the same basis instead of collecting quotations for different things.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Look for a relevant match'
        },
        {
          type: 'paragraph',
          text: 'Read each business profile carefully. Look for services that fit your request, a suitable working area, and photographs or descriptions that explain the offering. An attractive image is helpful, but it should not be your only reason for choosing a business.'
        },
        {
          type: 'paragraph',
          text: 'An approved GrowMeOnline profile is a useful starting point. Still ask for evidence of any qualification, registration, or insurance that is important to the work. Verification of a listing is not a guarantee of a future result.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Ask questions before committing'
        },
        {
          type: 'paragraph',
          text: 'A few practical questions can prevent misunderstandings:'
        },
        {
          type: 'list',
          ordered: false,
          items: [
            'What is included in the quotation, and what is excluded?',
            'Is the requested date or delivery window available?',
            'Who will carry out the work or deliver the product?',
            'Are materials, travel, or additional charges included?',
            'What deposit and payment terms apply?',
            'What happens if the scope or timing changes?'
          ]
        },
        {
          type: 'paragraph',
          text: 'Keep written answers where possible. For larger jobs, ask for a written scope and quotation that you can refer to later.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Compare more than the headline price'
        },
        {
          type: 'paragraph',
          text: 'The cheapest option may exclude something another supplier includes. Compare the proposed work, materials, timing, and communication—not just the total. If a price seems unexpectedly low, ask how it was calculated rather than assuming it is a bargain.'
        },
        {
          type: 'paragraph',
          text: 'Be cautious about pressure to pay immediately, unexplained account changes, or a refusal to clarify basic terms. Independently confirm payment details before sending money, particularly when instructions change during a conversation.'
        },
        {
          type: 'heading',
          level: 2,
          text: 'Take a confident next step'
        },
        {
          type: 'paragraph',
          text: 'Use the supplier’s enquiry form to introduce your request with enough detail for a meaningful reply. An enquiry starts a conversation; it is not a confirmed booking. Once you have compared suitable options and agreed the important terms, choose the business that best fits your requirements.'
        },
        {
          type: 'cta',
          heading: 'Find a supplier for your next project',
          text: 'Explore local business profiles and compare the services they offer.',
          links: [{ label: 'Find a Supplier', href: '/suppliers' }]
        }
      ]
    }
  }
] satisfies Prisma.BlogPostCreateInput[];
