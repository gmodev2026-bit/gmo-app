# GrowMeOnline implementation status

**Updated:** 27 November 2026
**Target:** v2.6 connected supplier/client account and business-profile scope  
**Status vocabulary:** `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `IN_REVIEW`, `DONE`

This is a repository snapshot, not a claim of production readiness. See [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) for the ordered work and acceptance criteria.

## Workstream status

| Workstream                     | Status      | Current evidence / remaining work                                                                                                                                                                                                                                                                                                                |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Foundation and audit        | IN_PROGRESS | Phase 0 audit and platform ADR exist; `docs/TECH-STACK.md` now records the checked-in stack and environment boundary. Complete migration/test baseline work remains.                                                                                                                                                                             |
| B. Identity and authentication | IN_PROGRESS | Better Auth supports signup, sign-in/out, email verification and password reset. Signup and verification callbacks now continue to the client profile; account security tests and complete rate-limit coverage remain.                                                                                                                           |
| C. Supplier registration       | IN_PROGRESS | Added verified-user owner-scoped drafts, submission, review feedback, and resubmission. Owner edits and submissions now use guarded status transitions and write audit events; the latest changes-requested reason is shown in the portal. The owner/admin lifecycle browser test is implemented but skipped because its local test credentials are not available to the Playwright process. |
| D. Client registration/account | IN_PROGRESS | Homepage now links directly to client signup. After email verification, `/dashboard/client` creates the one-to-one `Client` profile idempotently; profile updates, account-scoped enquiry pages, verified-email guest linking and visible privacy-action feedback are implemented. Retention execution remains an approved operational workflow. |
| E. Supplier business page      | IN_PROGRESS | Public `/b/[slug]` pages include offerings, JSON-LD, and admin-approved media; approved/verified/indexable filtering, sitemap eligibility, and slug history redirects are implemented. Contact name, phone, email, and website now require separate supplier opt-ins and default private; public responses are sanitized before rendering. Full approved-profile browser acceptance remains gated on authenticated synthetic accounts. |
| F. Supplier profile data/media | IN_PROGRESS | Added browser/server WebP compression, authenticated owner uploads to Bunny HTTP Storage, private pending delivery, owner removal, and an admin approval gate. Owner/admin private-media access has unit coverage and anonymous media retrieval has browser coverage. Authenticated preview/moderation and failed-upload cleanup acceptance, orphan reconciliation, and approved retention/deletion policy remain. |
| G. Admin supplier operations   | IN_PROGRESS | Supplier register, review, audit, separate public indexability, private preview and category/location management exist. Admins can preview, approve, remove and audit public supplier images.                                                                                                                                                                |
| H. SEO and discovery           | IN_PROGRESS | Public supplier metadata, sitemap, robots, structured data and indexable public filtering exist. Slug history redirects preserve old URLs; category/location doorway and image SEO remain.                                                                                                                                                       |
| I. Account-linked enquiries    | IN_PROGRESS | Guest guided and supplier-targeted enquiries share a canonical model/service. Signed-in enquiries associate with a verified user's `Client`; verified account email automatically claims matching guest enquiries with no phone-only linking.                                                                                                    |
| J. Subscription/entitlement    | BLOCKED     | Five-assignment quota ledger exists. Paid subscription/payment models and checkout are absent; provider and billing terms require owner approval. Do not activate payments.                                                                                                                                                                      |
| K. Blog and homepage content   | DONE        | Four published articles are seeded into the blog schema and served through local archive, category, detail, metadata, structured-data, and sitemap routes. Homepage feature and latest-article sections are integrated. No admin authoring CMS is included. |
| Quality and release gates      | IN_PROGRESS | Twenty-one unit tests, two rolled-back database integration tests, lint, TypeScript, and the production build pass. The latest targeted homepage/blog Playwright checks pass 2/2; authenticated supplier lifecycle acceptance remains paused. |

## Current safeguards and constraints

- Public enquiry intake is closed by default and also requires five eligible suppliers per category/city.
- The latest coverage report (27 November 2026) found `0/6` combinations ready. Simulation suppliers are excluded; refresh with `npm run db:pilot-readiness` before any launch decision.
- Supplier-specific requests are restricted to the selected supplier unless customer approval for an alternative is obtained.
- Dispatch writes quota, audit, and outbox records transactionally; outbox events do not send provider messages.
- Public visibility requires an approved, verified, active, non-deleted supplier.
- Supplier contact fields are private by default. Each field is returned publicly only after an explicit supplier opt-in; pending review allows revoking, not adding, public fields.
- Development remains local. The authorized Neon database is for testing only, not live customer/supplier records; production deployment and destructive resets require separate approval.
- Do not enable live intake, payment collection, uploads, or automated messaging until the relevant owner decisions and launch gates are complete.

## Verification evidence

| Check                             | Latest recorded result                                                                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                        | Pass: 21 unit tests, including supplier resubmission/edit eligibility, per-field public contact filtering, and private media access.                                                            |
| `npm run lint`                    | Pass.                                                                                                                                                                                           |
| `npm run build`                   | Pass; Prisma client generated and Next.js 16 generated all 35 routes.                                                                                                                          |
| Prisma migration status           | Pass; all 24 migrations are applied to the authorized Neon test database.                                                                                                                      |
| PostgreSQL integration tests      | Pass: client/enquiry isolation and private-by-default contact persistence verified in rolled-back transactions.                                                                                |
| Playwright smoke suite            | Pass: 7 prior Chromium smoke checks; the latest targeted homepage/blog subset also passes 2/2, including article metadata and sitemap URLs. Authenticated supplier lifecycle testing remains paused. |
| Blog content and homepage delivery | Pass: four seeded articles; local archive, category filtering, article rendering, metadata, sitemap, and homepage links verified by targeted Playwright tests. |
| Supplier onboarding validation    | Status guards, draft audit events, changes-request feedback, contact preferences, TypeScript, and Oxlint pass. The authenticated owner/admin browser journey remains pending.                   |
| `npm run db:pilot-supply-test`    | Pass: five-supplier gate verified in a transaction; test supplier rows rolled back.                                                                                                             |
| `npm run db:pilot-simulate`       | Pass: 3 simulated suppliers, availability responses, dispatches, quota entries, history transitions, and outbox events verified. Simulation rows persist and are marked; no messages were sent. |
| `npm run db:pilot-readiness`      | Refreshed: `0/6` combinations ready; five suppliers are still required for each category/city pair.                                                                                            |
| Client registration flow          | Signup and verification callbacks target `/dashboard/client`; profile and deletion actions return visible status. Actual email delivery still depends on valid Resend sender configuration.     |
| Database integration / Playwright | Two database tests pass in rolled-back transactions. Authenticated owner/admin acceptance still requires `GMO_E2E_SUPPLIER_EMAIL`, `GMO_E2E_SUPPLIER_PASSWORD`, `GMO_E2E_ADMIN_EMAIL`, and `GMO_E2E_ADMIN_PASSWORD` in ignored local configuration; no credential values were printed or committed. |

## Remaining acceptance gates — 27 November 2026

### Before authenticated browser testing

- Use only verified synthetic supplier-owner and admin accounts. Put `GMO_E2E_SUPPLIER_EMAIL`, `GMO_E2E_SUPPLIER_PASSWORD`, `GMO_E2E_ADMIN_EMAIL`, and `GMO_E2E_ADMIN_PASSWORD` in ignored `.env.local`; the latest Playwright run loaded none of these values, so the authenticated test was skipped. Never put credentials in chat or source.
- The browser suite should exercise save/submit, admin changes request, owner feedback/edit/resubmit, approval/verification/indexability, and owner isolation.

### Work in this order

1. **Authenticated supplier lifecycle:** run the owner/admin browser journey with the verified synthetic accounts and record the result.
2. **Media lifecycle:** verify owner/admin pending previews, admin approval/removal, owner removal, and failed-upload cleanup end to end; keep production uploads disabled.
3. **Public page acceptance:** check canonical metadata, sitemap eligibility, private preview behavior, and opted-in contact fields on an approved synthetic supplier.
4. **Readiness:** refresh category/city coverage before any pilot decision; keep intake closed until every combination meets the five-supplier gate.
5. **Launch gates:** complete privacy/legal review, backup/restore, monitoring, retention/deletion operations, and production checks.

### Still blocked or later

- Production supplier photo uploads remain disabled by default. Local development uses Bunny's authenticated HTTP Storage API and app-proxied delivery; production activation still depends on privacy, media-rights, retention, and deletion approval. A Pull Zone is optional for future CDN optimization.
- Public enquiry intake remains closed; the last recorded readiness report was `0/6` service-area combinations. Re-run the readiness command before any pilot decision.
- Blog publishing is currently seed-managed; there is no admin create/edit/preview workflow. Add a CMS only after its authoring, review, and publishing requirements are agreed.
- Keep billing disabled. Finish privacy/legal review, deletion-retention operations, backup/restore, monitoring, and production checks before launch.
- Expand account security and cross-account authorization tests; do not execute deletion requests without the approved identity and retention workflow.
