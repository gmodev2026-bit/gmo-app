# GrowMeOnline implementation status

**Updated:** 26 November 2026  
**Target:** v2.6 connected supplier/client account and business-profile scope  
**Status vocabulary:** `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `IN_REVIEW`, `DONE`

This is a repository snapshot, not a claim of production readiness. See [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) for the ordered work and acceptance criteria.

## Workstream status

| Workstream                     | Status      | Current evidence / remaining work                                                                                                                                                                                                                                                                                                                |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Foundation and audit        | IN_PROGRESS | Phase 0 audit and platform ADR exist; `docs/TECH-STACK.md` now records the checked-in stack and environment boundary. Complete migration/test baseline work remains.                                                                                                                                                                             |
| B. Identity and authentication | IN_PROGRESS | Better Auth supports signup, sign-in/out, email verification and password reset. Signup and verification callbacks now continue to the client profile; account security tests and complete rate-limit coverage remain.                                                                                                                           |
| C. Supplier registration       | IN_PROGRESS | Added a public `/supplier/join` entry point, verified-user owner-scoped draft/save, categories, service areas, offerings, submit and pending-review state. Supplier portal shows the public URL only after approval, verification, activation and indexability; admin review and changes-requested resubmission tests remain.                    |
| D. Client registration/account | IN_PROGRESS | Homepage now links directly to client signup. After email verification, `/dashboard/client` creates the one-to-one `Client` profile idempotently; profile updates, account-scoped enquiry pages, verified-email guest linking and visible privacy-action feedback are implemented. Retention execution remains an approved operational workflow. |
| E. Supplier business page      | IN_PROGRESS | Public `/b/[slug]` pages include offerings and JSON-LD; approved/verified/indexable filtering, sitemap eligibility, and slug history redirects are implemented. The owner portal links to a page only when all publication gates pass; contact controls, media and richer discovery remain.                                                      |
| F. Supplier profile data/media | IN_PROGRESS | Added canonical `SupplierOffering` and `MediaAsset` metadata models and migrations. Real Cloudflare R2/S3 upload authorization and delivery remain disabled pending provider approval.                                                                                                                                                           |
| G. Admin supplier operations   | IN_PROGRESS | Supplier register, review, audit, separate public indexability, private preview and category/location management exist. Private media moderation remains.                                                                                                                                                                                        |
| H. SEO and discovery           | IN_PROGRESS | Public supplier metadata, sitemap, robots, structured data and indexable public filtering exist. Slug history redirects preserve old URLs; category/location doorway and image SEO remain.                                                                                                                                                       |
| I. Account-linked enquiries    | IN_PROGRESS | Guest guided and supplier-targeted enquiries share a canonical model/service. Signed-in enquiries associate with a verified user's `Client`; verified account email automatically claims matching guest enquiries with no phone-only linking.                                                                                                    |
| J. Subscription/entitlement    | BLOCKED     | Five-assignment quota ledger exists. Paid subscription/payment models and checkout are absent; provider and billing terms require owner approval. Do not activate payments.                                                                                                                                                                      |
| Quality and release gates      | IN_PROGRESS | Fourteen unit tests, lint, TypeScript, a rolled-back client/enquiry integration test, six Chromium smoke tests, and the webpack production build pass. Privacy/legal review, backup/restore, and production smoke tests remain.                                                                                                                  |

## Current safeguards and constraints

- Public enquiry intake is closed by default and also requires five eligible suppliers per category/city.
- The last recorded coverage report (26 November 2026) found `0/6` combinations ready. Simulation suppliers are excluded; refresh with `npm run db:pilot-readiness` before any launch decision.
- Supplier-specific requests are restricted to the selected supplier unless customer approval for an alternative is obtained.
- Dispatch writes quota, audit, and outbox records transactionally; outbox events do not send provider messages.
- Public visibility requires an approved, verified, active, non-deleted supplier.
- Development remains local. The authorized Neon database is for testing only, not live customer/supplier records; production deployment and destructive resets require separate approval.
- Do not enable live intake, payment collection, uploads, or automated messaging until the relevant owner decisions and launch gates are complete.

## Verification evidence

| Check                             | Latest recorded result                                                                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                        | Pass: 14 unit tests covering routing, quota boundary, status transitions, and phone normalization.                                                                                              |
| `npm run lint`                    | Pass.                                                                                                                                                                                           |
| `npm run build -- --webpack`      | Pass; Prisma client generated and webpack build generated all 33 routes.                                                                                                                        |
| Prisma migration status           | Database schema is up to date across 21 migrations in the authorized Neon test database.                                                                                                        |
| PostgreSQL integration test       | Pass: client and enquiry isolation verified in a rolled-back transaction.                                                                                                                       |
| Playwright smoke suite            | Pass: 6 Chromium checks covering homepage, supplier/client signup UI, closed pilot intake, directory, and anonymous preview protection.                                                         |
| Supplier onboarding validation    | Prisma validate/generate, TypeScript and Oxlint pass. Supplier self-service save/submit and public indexability are implemented; database/Playwright journeys remain.                           |
| `npm run db:pilot-supply-test`    | Pass: five-supplier gate verified in a transaction; test supplier rows rolled back.                                                                                                             |
| `npm run db:pilot-simulate`       | Pass: 3 simulated suppliers, availability responses, dispatches, quota entries, history transitions, and outbox events verified. Simulation rows persist and are marked; no messages were sent. |
| `npm run db:pilot-readiness`      | Last recorded: `0/6` combinations ready. Re-run before relying on coverage.                                                                                                                     |
| Client registration flow          | Signup and verification callbacks target `/dashboard/client`; profile and deletion actions return visible status. Actual email delivery still depends on valid Resend sender configuration.     |
| Database integration / Playwright | Client/enquiry ownership integration check passes in a rolled-back transaction; the browser suite covers signup UI but does not send a real verification email.                                 |

## Tomorrow's starting plan — 27 November 2026

### Before testing real registration

- Confirm `RESEND_API_KEY` is configured and `EMAIL_SENDER_ADDRESS` is an email address on a Resend-verified domain. Do not use a URL or put secret values in this document.
- Use only approved test accounts and synthetic business data. Do not use production or real customer/supplier information.

### Work in this order

1. **Client registration:** create a test client account, verify the email, confirm the redirect to `/dashboard/client`, and verify one linked `Client` profile and account-scoped enquiry page.
2. **Supplier registration:** use a verified regular test account to save a supplier draft, confirm categories/service areas/offerings persist, then submit it for review.
3. **Admin review:** test request-changes, owner edits/resubmission, and approval/verification/indexability as separate decisions.
4. **Public page acceptance:** after all publication gates pass, open the supplier's `/b/[slug]` URL and verify its canonical metadata, sitemap eligibility, and private preview behavior. Keep the public enquiry CTA honest while pilot intake is closed.
5. **Privacy blocker:** agree and implement field-level contact visibility before exposing supplier phone/email publicly. Add a regression test for the approved public fields.

### Still blocked or later

- Actual supplier photo uploads remain disabled until a storage provider, credentials, delivery policy, and retention rules are approved.
- Public enquiry intake remains closed; the last recorded readiness report was `0/6` service-area combinations. Re-run the readiness command before any pilot decision.
- Keep billing disabled. Finish privacy/legal review, deletion-retention operations, backup/restore, monitoring, and production checks before launch.
- Expand account security and cross-account authorization tests; do not execute deletion requests without the approved identity and retention workflow.
