# ADR 001 - Phase 0 Platform Direction

## Status

Accepted for the Phase 0 greenfield build.

## Context

GrowMeOnline requires a new MVP-first marketplace implementation. The public GrowMeOnline website is a product and content reference only. We will not reuse, migrate or integrate with its implementation, source, database or media.

The current repository is a Next.js/Better Auth/Prisma starter whose infrastructure is useful, but whose SaaS-specific content and schemas are not GrowMeOnline domain implementations.

## Decision

Use the current Next.js Better Auth Prisma repository as the technical foundation and replace its starter-domain implementation with the GrowMeOnline modular monolith.

Build the site and canonical marketplace entities from scratch.

Do not migrate data or integrate media/provider state from the public reference site unless a separate approved migration scope is created.

Keep application development and deployment local by default. Database tests may use the explicitly approved Neon `neondb` target described below. Do not deploy the application or provision production services until development is complete and the product owner decides how to proceed.

## Rationale

- The starter supplies the required framework, database adapter, authentication, admin-role and deployment foundations.
- It does not contain GrowMeOnline supplier or enquiry business data.
- New public URLs should be planned explicitly for the greenfield SEO and content strategy.
- Public reference-site behavior should not replace the master specification or approved product decisions.
- Rebuilding the starter templates and adding the GMO domain is lower risk than assuming or extending an unknown implementation.

## Consequences

- Existing landing-page, dashboard and starter identity code must be removed or separated from GMO routes.
- GrowMeOnline canonical models must be added to Prisma.
- Supplier, category and enquiry data will be created or onboarded through the new application.
- Public supplier slugs and sitemap URLs should be planned as part of the new information architecture.
- At the time of this decision, supplier and customer self-service flows were deferred until the secure MVP vertical slice was complete. This prioritization was superseded by the v2.6 implementation scope update below.
- Migrations and seeds are permitted against the isolated local database or the explicitly approved Neon test target. Neither database should be reset without confirming that its data is disposable.
- Deployment, hosting and production service decisions are deferred until development is complete.

## Reassessment trigger

Reassess only if an explicitly approved future migration project introduces existing supplier or customer data into this system.

## Phase 2 implementation note

The pilot supplier register is managed by admins and is not public. Supplier ownership is optional until supplier accounts are introduced; a business contact record is not an authentication account. The pilot stores verification method, actor, time and admin review notes, but does not upload identity or credential documents until evidence handling and retention rules are approved. Initial coverage is confirmed at city level for the pilot locations; province-wide and suburb-level areas remain future extensions.

## v2.6 implementation scope update

On 2026-11-26, the active v2.6 master specification committed supplier registration, client registration, supplier self-service profiles, admin review, and account-linked enquiries as the current implementation target. This supersedes the earlier self-service deferral in this ADR; it does not authorize production deployment or live data processing. Payment activation, media storage, verification evidence and communication providers remain gated by the decisions and approvals recorded in `docs/IMPLEMENTATION-PLAN.md`.

## Neon database testing decision

On 2026-11-25, the product owner authorized using the existing Neon `neondb` database for schema and integration testing. The application remains local and is not deployed. The Neon database currently contains the Prisma migrations and seeded Gauteng pilot reference data only; it is not approved for live customer or supplier records. Destructive resets and production use still require separate approval.
