# GrowMeOnline technology stack

**Updated:** 26 November 2026

This document records the checked-in runtime foundation. Update it when dependency, hosting, database or provider decisions change.

## Application

- Next.js 16.4.6, App Router and Cache Components
- React 19.3.1
- TypeScript 7.0.2
- Tailwind CSS 4.3.5
- Base UI through shadcn components
- Node.js 26 or newer; Bun 1.4.4

## Data and authentication

- PostgreSQL
- Prisma 7.10.1 with `@prisma/adapter-pg`
- Better Auth 1.7.26
- Better Auth email/password and Google providers
- Better Auth admin plugin
- Prisma client output: `src/generated/prisma/client`

## Email and configuration

- Resend for verification and password-reset email
- `EMAIL_SENDER_ADDRESS` must be an address on a domain verified in the Resend account. A sender using a consumer mailbox domain is normally rejected by Resend.
- Resend API errors are surfaced in server logs; signup users can request a verification resend from the post-registration screen.
- Environment values are loaded from `.env.local` and `.env`
- Public site origin: `NEXT_PUBLIC_BASE_URL` or `BETTER_AUTH_URL`
- Railway healthcheck and migration startup are configured in `railway.toml`

## Media storage

- Bunny Storage has been selected for development/testing supplier media.
- Supplier media uses Bunny's regional HTTP Storage API from server-only code; the storage password is never sent to the browser. S3 compatibility and a Pull Zone are not required for this server-proxied delivery path.
- Local Bunny configuration is stored in the ignored `.env`; never copy its secret values into source control or documentation.
- Browser compression and server-side Sharp decoding/re-encoding produce bounded WebP images. Uploads require an email-verified supplier owner, are private while pending, and require admin approval before public delivery.
- Public images are served through an authorization-aware application route. Pending media is available only to its owner and admins; verification documents are excluded from this flow.
- `BUNNY_MEDIA_UPLOADS_ENABLED` must be explicitly set to `true`; it is disabled by default in environments without that setting. Keep production uploads disabled until privacy, media rights, retention, and deletion policies are approved.
- A Bunny Pull Zone/CDN can be considered later to reduce application bandwidth. Orphan reconciliation and a documented retention/deletion policy remain open.

## Quality commands

- `npm test`: sixteen focused unit tests
- `npm run lint`: Oxlint
- `npm exec tsc -- --noEmit`: TypeScript type-check
- `npm run build`: Prisma generation plus the Next.js production build
- `npm run db:pilot-readiness`: controlled-pilot supplier coverage report

## Environment boundary

Development and tests must use an explicitly approved database. The configured hosted Neon database is for testing only; do not run destructive migrations or reset commands against live or real-customer data. New migrations must be reviewed and deployed only to an approved target.
