# GrowMeOnline implementation plan

**Status:** Active  
**Source of truth:** `GrowMeOnline_Full_Stack_Architect_Skill_v2.6.md`  
**Planning snapshot:** 27 November 2026

This plan turns the v2.6 committed scope into repository-specific workstreams. It covers the existing enquiry pilot plus the connected supplier and client account experience. It does not authorize production deployment, live customer data, payment collection, or unapproved third-party messaging.

## 1. Repository baseline

### Already implemented and reusable

- Next.js App Router, TypeScript, PostgreSQL, Prisma 7, and Better Auth.
- Email/password and Google sign-in, email verification, password reset, and session handling.
- Admin-protected supplier register and supplier review/verification workflow.
- Anonymous category-specific enquiry form, supplier-specific requests, validation, idempotency, phone rate limiting, and duplicate-candidate screening.
- Admin enquiry review, deterministic matching, availability confirmation, dispatch, five-assignment quota ledger, audit history, follow-ups, funnel metrics, and transactional outbox.
- Public supplier directory and `/b/[slug]` pages for eligible suppliers.
- Verified-account supplier onboarding with owner-scoped draft/save/submit, categories, service areas, offerings and private preview.
- A read-only supplier portal and admin linking of an existing account to an existing supplier.
- Canonical client profiles, account-scoped enquiry history, and verified-email guest enquiry linking.
- Core unit tests and scripts for readiness, supply-gate rollback, and synthetic workflow simulation.

### Main v2.6 gaps

- Supplier change-request feedback, guarded resubmission, and owner audit events are implemented; authenticated browser acceptance remains incomplete.
- The development Bunny upload/storage path and media moderation are implemented. Production uploads remain disabled, and end-to-end moderation/cleanup acceptance is still outstanding.
- Public supplier contact visibility is supplier-controlled per field and private by default. Approved media, social-sharing assets and richer discovery still need fuller acceptance.
- No provider-backed subscription/payment implementation; current quota only enforces the free-pilot limit.
- A complete client registration/verification journey still needs a real email-provider smoke test and broader account-security coverage.

The existing models and routes must be reused where appropriate. Do not create duplicate identity, supplier, enquiry, audit, or quota concepts.

## 2. Delivery sequence

Workstreams are ordered by dependency. Independent documentation and policy work may proceed in parallel. Each workstream is complete only when its acceptance checks, tests, and documentation are recorded in `docs/IMPLEMENTATION-STATUS.md`.

### 0. Foundation, inventory, and safe environments

**Status:** In progress

1. Keep the existing Phase 0 audit and platform ADR as the historical decision record.
2. Record current runtime/library versions, scripts, auth, database adapter, and storage/email configuration in `docs/TECH-STACK.md`.
3. Keep local development and explicitly approved test databases separate from production. Do not deploy or run destructive migrations against an unapproved database.
4. Review migrations and schema before adding account, media, profile, or payment entities. Generate migrations through Prisma and review SQL and backfill needs.
5. Add test-runner coverage to the regular quality gate; retain the current `npm test`, lint, and build checks.
6. Rotate exposed or shared environment credentials before any shared environment or production use. Never copy credential values into this plan.

**Exit:** Repository and environments are documented; every new migration has a reviewed purpose and safe test target.

### 1. Canonical identity and client account

**Depends on:** Foundation.

1. Add a one-to-one `Client` profile related to the Better Auth `User`; do not duplicate password, session, or verification storage.
2. Add client account pages for profile, dashboard, enquiry list, and enquiry detail using the repository's existing route conventions.
3. Scope every client read/update to the authenticated user and add server-side authorization tests for cross-account access and role escalation.
4. Add optional `clientId` to the canonical `Enquiry`; preserve guest submission through the same enquiry creation service.
5. Define and implement secure guest-to-account linking based on verified ownership. Never link by an unverified email/phone match.
6. Provide safe customer-facing enquiry status and introduction details without exposing internal notes or other customers' data.

**Exit:** A client can register/sign in, manage their own profile, submit an enquiry, and see only their own eligible enquiry history; guest requests still work.

### 2. Supplier self-service onboarding and ownership

**Depends on:** Foundation and identity.

1. Reuse the current `Supplier` model and owner relation; add only fields needed by the approved profile/onboarding design.
2. Implement supplier onboarding as a mobile-first draft, review, changes-requested, resubmit, and approved lifecycle.
3. Allow only an authenticated, verified account to create or edit its own supplier profile. Derive owner identity from the session, never from a submitted owner ID.
4. Validate business name/slug, categories, service areas, offerings, and links on the server. Keep contact name, phone, email, and website private unless the supplier explicitly opts in per field; all visibility flags default to false.
5. Prevent suppliers from setting approval, verification, featured, or indexability state.
6. Keep verification notes and evidence private; public badge text must describe only checks actually completed.
7. Preserve and adapt existing admin account linking and supplier administration rather than introducing a second ownership path.

**Exit:** Supplier users can save, resume, submit, and update their own profiles; lifecycle changes are auditable; no supplier can self-approve or edit another supplier.

### 3. Admin supplier, catalog, and moderation operations

**Depends on:** Supplier onboarding data model.

1. Extend the existing admin register/detail/review routes to review supplier-submitted drafts and requested changes.
2. Record reasons, actor, timestamps, before/after lifecycle state, and relevant profile changes.
3. Add admin category and location management only for the canonical reference data; protect deactivation and reassignment from breaking historical records.
4. Separate profile completeness, verification, approval, and public indexability.
5. Add an authorized preview of unpublished profiles that is private, non-indexable, and non-cacheable.
6. Keep evidence and internal notes inaccessible to supplier owners and public queries unless a policy explicitly permits disclosure.

**Exit:** Admins can safely review, request changes, approve, suspend, manage catalog/location records, and preview content with an auditable history.

### 4. Supplier offerings and media

**Depends on:** Supplier ownership and profile lifecycle. Public uploads additionally depend on an approved storage provider.

1. Add canonical supplier offerings and media metadata only after checking existing schema and defining ownership/deletion semantics.
2. Bunny Storage is selected for development/testing. The implemented path uses the server-mediated regional HTTP Storage API, so S3 compatibility is not required and the storage password never reaches the browser.
3. Public and private images are delivered through an application route that authorizes public access only for `READY` images on eligible suppliers; owners/admins can privately preview pending images. A Pull Zone/CDN is optional and must not bypass these checks.
4. Require verified-owner authentication, same-origin requests, purpose/ownership checks, rate limits, bounded request sizes, actual file-type validation, server-side image re-encoding, random object keys, and private-by-default delivery.
5. Store media bytes outside PostgreSQL; store metadata and stable object keys in PostgreSQL.
6. Support safe replacement, removal, failed-upload cleanup, and alt text. Private pending-media delivery is restricted to the owner/admin; public delivery requires a ready asset and eligible supplier. Keep verification documents outside this public-image flow until a dedicated private-storage and access policy is implemented; scheduled orphan reconciliation remains outstanding.
7. Keep production uploads disabled by default until provider access, delivery, retention, moderation, and privacy requirements are approved. Local development can opt in with `BUNNY_MEDIA_UPLOADS_ENABLED=true`.

**Exit:** Owners can manage only their own allowed public media; private evidence is never publicly addressable; failed and orphaned uploads are safely handled.

### 5. Public supplier profiles, discovery, and SEO

**Depends on:** Moderated profile fields; media workstream for image features.

1. Extend the existing `/b/[slug]` page rather than creating duplicate public profile routes.
2. Render only approved, verified, active, non-deleted suppliers and approved public fields.
3. Add categories, service areas, offerings, and hours/social links only when configured and truthful. Render contact name, phone, email, and website only when their per-field supplier opt-in is enabled.
4. Add accurate metadata, canonical URLs, Open Graph, truthful JSON-LD, breadcrumbs, responsive images, and sitemap eligibility.
5. Add explicit indexability controls separate from approval; pending, suspended, preview, thin, or non-indexable pages must not leak through metadata, JSON-LD, sitemap, or cache.
6. Preserve old URLs safely when a slug changes; do not generate thin location/category doorway pages.
7. Keep profile enquiries connected to the existing canonical enquiry service and enforce the target-supplier-only rule.

**Exit:** Public pages reflect canonical approved data, are crawlable only when eligible, and never leak private profile or verification data.

### 6. Account-linked enquiry journey

**Depends on:** Client profile and ownership-safe account linking.

1. Associate signed-in enquiries to the authenticated `Client`; retain guest enquiries.
2. Keep one canonical creation service for guided requests and supplier-page requests.
3. Preserve validation, idempotency, rate limiting, duplicate screening, consent capture, coverage gate, and admin review for both account and guest paths.
4. Add account-scoped history and customer-facing status without exposing internal review or supplier-private information.
5. Test direct supplier targeting, cross-account isolation, guest linking, duplicates, and status visibility.

**Exit:** Both guest and registered client paths create the same canonical enquiry and preserve all current review/dispatch invariants.

### 7. Entitlement and commercial foundation

**Depends on:** Supplier ownership and the approved entitlement policy.

1. Keep the five-free-qualified-assignment rule and ledger authoritative; ensure it remains lifetime per approved business under the current recorded decision.
2. Centralize plan names, currency, and amounts; use integer minor currency units for money.
3. Add subscription/payment/webhook models and provider adapter only after reviewing the schema and approved billing terms.
4. Until a provider and billing policy are approved, expose informational plan/entitlement status only. Keep checkout and paid entitlement activation disabled.
5. Never infer payment success from a browser redirect; require authenticated, idempotent provider confirmation and reconciliation before activation.

**Exit:** Free quota and entitlement rules are tested; paid access cannot activate without verified provider state. Checkout remains explicitly blocked until provider, VAT, recurring billing, cancellation, refund, and grace-period decisions are approved.

### 8. Quality, security, and release readiness

**Depends on:** Each feature workstream as it is delivered.

1. Unit-test domain rules and failure cases.
2. Add isolated-database integration tests for migrations, ownership scoping, supplier eligibility, account linking, enquiry creation, quota, audit, and outbox atomicity.
3. Add Playwright journeys for registration, supplier onboarding/review/publication, guest and client enquiries, profile privacy, and sign-out.
4. Test media authorization and public/private access after storage is selected.
5. Run schema validation, migration review, typecheck, lint, test suite, production build, and accessibility/responsive checks.
6. Complete privacy notices, consent, retention, account deletion/access processes, and Information Officer review with the product owner/legal adviser.
7. Verify backups and restore on an approved non-production target; document monitoring and incident/rollback procedures.
8. Perform production smoke tests only after explicit deployment approval and production credentials/configuration are supplied.

**Exit:** Acceptance matrix in Section 40 passes or has explicitly accepted, documented blockers; no production readiness claim is made before provider, legal, backup, monitoring, and deployment gates pass.

## 3. Product-owner decision gates

These are not engineering defaults. Resolve them before activating the dependent behavior:

- Supplier verification evidence, badge wording, review SLA, and which profile edits require re-review.
- Public field/contact visibility, business-hours verification, media rights/moderation, and media retention.
- Public/private media delivery, moderation, retention and deletion policies. Bunny is selected for development; Pull Zone/CDN configuration remains open.
- Guest-to-account ownership proof and client data retention/deletion process.
- Category/location source of truth and who may maintain it.
- Privacy notices, consent wording, lawful communication channels, retention, and South African privacy/legal review.
- Payment provider and actual merchant capability; VAT, renewal, cancellation, failed payment, grace period, and refund terms.
- Email/WhatsApp providers, templates, opt-in and delivery policy.

Do not block independent account/profile work while a provider decision is open. Keep dependent functionality disabled until the decision is recorded.

## 4. Explicit non-goals for this delivery

- Production deployment, live customer data imports, or live enquiry acceptance.
- Autonomous approval, qualification, dispatch, or customer-data disclosure.
- Bulk WhatsApp/marketing, dormant-lead reactivation, revenue share, and advanced CRM.
- Reviews, ranking, or ratings without approved eligibility/moderation policies.
- Paid checkout or paid entitlement activation before provider and commercial approval.

## 5. Completion evidence

Use the v2.6 acceptance matrix in Sections 39-40. Record implementation evidence, migration impact, test commands, blockers, and the next dependency in `docs/IMPLEMENTATION-STATUS.md`. Update this plan only when an accepted product decision changes scope or dependency order.

## 6. Public blog and homepage content

**Status:** Delivered as a seed-managed, read-only blog.

- Store the four existing published articles as structured Prisma records and seed by slug so repeated seed runs are safe.
- Serve published content only through `/blog`, category filters, article detail pages, and the sitemap.
- Keep article rendering structured and validated; include canonical metadata, Article JSON-LD, and local navigation.
- Use the homepage feature section to describe the actual marketplace and link to local published articles.

**Remaining decision:** There is no admin authoring CMS. Before adding one, agree on author roles, draft review, preview, publishing/unpublishing, and media management.
