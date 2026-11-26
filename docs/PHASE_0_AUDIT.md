# Phase 0 - GrowMeOnline Audit

**Date:** 2026-11-25  
**Status:** Greenfield build confirmed; pilot defaults selected for validation  
**Master specification:** GrowMeOnline Full-Stack Architect Skill v2.5

## 1. Existing-system findings

### Public reference

The public GrowMeOnline website at https://growmeonline.co.za is a market and content reference only. This repository will not migrate or integrate with its source, database or Supabase media.

Useful public requirements established during the reference review:

- Supplier and customer value propositions.
- Category and province/city browsing.
- Public supplier profile URLs.
- Supplier registration and login.
- The five-free-qualified-leads policy.
- No commission and no per-lead fee.
- Privacy, terms and supplier support journeys.

Those public patterns do not make the existing implementation a source of truth for this repository. New routes, data models and workflows must follow the checked-in architect specification and approved pilot decisions.

### Repository

The current repository is a Next.js 16 Better Auth Prisma starter, not an implementation of the GrowMeOnline public marketplace.

Confirmed:

- Next.js 16 App Router.
- React 19.
- Prisma 7 with PostgreSQL.
- Better Auth with email/password, Google, sessions and admin plugin support.
- A PostgreSQL-backed `User`, `Session`, `Account` and `Verification` model.
- Admin and dashboard route shells.
- Server-side admin role checks.
- Resend email support.
- Tailwind CSS 4 and Base UI component conventions.
- Cache Components enabled.
- Railway health-check configuration.
- Neon-backed `DATABASE_URL` is configured in the local environment.

Not present:

- GrowMeOnline supplier, category or geographic entities.
- Enquiry entities or enquiry workflow.
- Lead assignments or quota ledger.
- Supplier approval and verification state.
- Deterministic matching.
- Dispatch or follow-up operations.
- Public marketplace pages branded for GrowMeOnline.
- Category-specific enquiry templates.
- Audit logging for marketplace actions.
- Payment, subscription or webhook models.
- Automated or integration tests (none at the time of this audit; focused unit tests have since been added for core pilot rules, while database integration and browser end-to-end testing remain deferred).

## 2. Technical readiness

Verified during Phase 0:

- `npm run build` passes.
- Prisma 7.10.1 generates successfully.
- `npm run lint` passes.
- The application has a working database health route.
- Next.js Cache Components, auth route protection and Prisma integration are functional.

The starter is suitable as a technical foundation for the greenfield application.

## 3. Extend-versus-rebuild assessment

### What can be reused

- Authentication infrastructure.
- User and session data model.
- Admin role infrastructure.
- Next.js App Router structure.
- Protected layout and gate patterns.
- Prisma/PostgreSQL infrastructure.
- Deployment and database health patterns.
- Base UI, Tailwind and existing layout components.

### What must be built

- All GrowMeOnline marketplace entities and migrations.
- Public supplier/category/location journeys.
- Anonymous canonical enquiry submission.
- Admin triage and dispatch operations.
- Supplier verification and eligibility.
- Availability confirmation and lead activity.
- Free-quota and dispatch invariants.
- Audit logs and follow-up outcomes.
- New GMO public routes, content and SEO metadata.

### Decision

**Confirmed decision: build GrowMeOnline from scratch using this starter as a technical foundation.**

Reason:

- There is no source, database or deployment handoff to preserve or extend.
- The starter provides authentication, admin roles, PostgreSQL, Next.js and deployment foundations.
- Replacing the starter templates avoids assuming that its SaaS content or dashboard architecture represents GMO requirements.
- The new system will start with a deliberately small, canonical marketplace data model.

No data, credentials or media from the public reference site will be migrated without a separate, explicitly approved migration project.

## 4. Selected pilot defaults

These are recommended operating defaults for the first controlled pilot. They are intentionally narrow and should be treated as configurable, not as permanent product policy.

### Market and coverage

- **Geography:** Gauteng, initially Johannesburg and Pretoria service areas.
- **Initial service group:** non-emergency home repairs and maintenance, with plumbing, electrical and handyman subcategories.
- **Supply gate:** do not publicly launch a subcategory in a city until at least five approved, verified suppliers have confirmed that they cover that service area. Recruit toward ten eligible suppliers per subcategory/city before increasing paid acquisition.
- **Customer promise:** GMO reviews requests during staffed hours and aims to review them within one business day. Do not promise emergency, same-hour or guaranteed-job outcomes.
- **Development and deployment:** keep development, test data, application services and databases local. Do not deploy the site or provision production services during development. Make hosting and deployment decisions only after development is complete and the product owner reviews the result.

This makes one metro-area pilot easier to operate and measure than a national launch. Gauteng is the largest provincial market in the Statistics South Africa 2025 mid-year population estimates. The selected home-repair categories are a testable product hypothesis, not a proven demand claim; assess category-level demand and supplier coverage during pilot recruitment.

### Operations and dispatch

- **Staffed hours:** Monday-Friday, 08:00-17:00 SAST, excluding South African public holidays.
- **Supplier response:** request availability for each enquiry; allow four staffed business hours for a response, make one manual follow-up, and mark no response by the next business day.
- **General enquiry distribution:** dispatch to no more than three suppliers, only after each confirms availability and an admin confirms the assignment.
- **Supplier-specific enquiry:** initially target only that supplier. If they are ineligible or unavailable, hold the request and ask the customer before offering alternatives.
- **Contact verification:** staff manually verify the customer's selected contact channel before sharing contact details with suppliers; record the method, actor and result. Do not add automated OTP until the manual pilot shows a need.
- **Follow-up:** staff record customer and supplier contact attempts and outcomes in the platform. Keep marketing consent separate from service-related communications.
- **Acquisition:** begin with direct supplier recruitment, organic/local SEO, referrals and social experiments. Defer paid campaigns until supply coverage and a basic conversion baseline exist.

### Pilot entitlement and measurement

- Treat the five-free-qualified-assignment allowance as **lifetime per verified business**, not per user account. Repeated accounts must not reset the allowance.
- A committed assignment consumes quota once, in the same transaction as dispatch. Rejected, spam and unassigned requests do not consume quota.
- Payment checkout is deferred, but the quota rule is not. After the five free assignments, do not dispatch further leads until the supplier has an approved active paid entitlement. Do not grant unlimited free assignments as an undocumented pilot exception.
- Run the initial pilot for six weeks with weekly operational reviews. Track the funnel and staff time; set expansion thresholds after observing a baseline rather than inventing conversion targets in advance.

### Privacy, contact and policy

- Obtain appropriate South African privacy/legal review before launch for the privacy notice, enquiry disclosure, retention schedule, communication channels and operational roles.
- Ask only for information needed to qualify and route a request. Do not use enquiry information for supplier marketing or dormant-lead reactivation.
- Do not launch WhatsApp automation, promotional messaging or supplier-owned lead reactivation in this pilot.
- Register/confirm the organization’s Information Officer obligations and complete a privacy impact assessment with appropriate advice before live personal-data processing.

These choices are supported by the current master specification, public market references and the cited Statistics South Africa and Information Regulator materials below. Competitor patterns are reference only and do not establish local demand or GMO policy.

## 5. Remaining owner decisions

The following items still need approval or discovery; defaults above cover only the initial pilot workflow:

### Commercial and lead operations

- Monthly versus annual billing terms, tax, renewal, cancellation and refund policy.
- Lead-dispute evidence and resolution window.

### Supplier operations

- Supplier verification evidence and badge rules.
- Which supplier profile changes require re-review.
- Staff roles for supplier approval, enquiry qualification, dispatch and quota correction.
- Whether suppliers may pause availability.
- Exact Gauteng city boundaries, suburbs and category readiness.

### Customer and privacy operations

- Notice and consent wording.
- Enquiry, customer contact, audit, media and payment retention periods.
- Customer access to enquiry history.
- POPIA/legal review approval.

### Acquisition and measurement

- Campaign attribution method.
- Baseline and expansion thresholds.
- Staff cost and time tracking method.
- Supplier response and customer outcome definitions.

## 6. Security and launch blockers

- The local `.env` contains live service credentials. Rotate the database password, Better Auth secret, Google OAuth secret and Resend key before any shared build, deployment or data import. Keep secrets out of source control and any project documentation. This audit intentionally does not copy their values.
- The current `.env` database URL targets hosted Neon rather than a local database. Migrations, seeds and resets are allowed for testing against an isolated local test database. Do not use the hosted URL for destructive tests unless it is explicitly designated as disposable test infrastructure; never use production or real customer data.
- Do not deploy or provision production services during development. Revisit hosting, production/staging separation, backups, restore procedures and operator access after development is complete and before accepting real enquiries.
- Public reference pages contain statements and pricing presentation that do not exactly match the current master specification. The new site must use the master specification’s R200/month and R1,200/year choices only after billing and legal terms are approved; do not copy public pricing text blindly.

## 7. Phase 0 exit criteria

Phase 0 is not complete until:

1. Greenfield build decision is recorded.
2. Pilot geography, service group and supply gate are approved.
3. Customer promise, operating hours and supplier availability workflow are approved.
4. Supplier verification and admin responsibilities are approved.
5. Five-free-assignment entitlement treatment is approved and recorded.
6. Privacy notice, retention and contact-verification requirements receive appropriate review.
7. Local development uses an isolated local database and safe local-only credentials; no deployment occurs before the product owner decides after development is complete.
8. Initial acquisition and measurement plan is agreed.
9. Expansion thresholds are set after pilot baseline evidence.

## 8. Immediate next slice

The first implementation should not begin with payments, supplier self-service or advanced AI. After the launch blockers above are addressed, implement this vertical pilot slice:

1. Category and location discovery.
2. Canonical anonymous enquiry capture.
3. Customer confirmation.
4. Secure admin triage.
5. Deterministic matching.
6. Per-enquiry supplier availability confirmation.
7. Admin-confirmed dispatch.
8. Supplier response and customer outcome tracking.
9. Audit and follow-up records.

## 9. Research sources

- Statistics South Africa, [Mid-year population estimates 2025 (P0302)](https://www.statssa.gov.za/publications/P0302/P03022025.pdf), accessed 25 November 2026. Used only to support selecting Gauteng as the initial province by population scale; it does not prove demand for the chosen categories.
- Information Regulator South Africa, [POPIA resources and guidance notes](https://inforegulator.org.za/popia/), accessed 25 November 2026. Includes regulator guidance on direct marketing and Information Officer responsibilities. This is not a substitute for legal advice.
- GrowMeOnline public reference site, [homepage](https://growmeonline.co.za/) and [supplier directory](https://growmeonline.co.za/suppliers), accessed 25 November 2026. Used only as product/market reference, not as a source to migrate or copy data.
- GrowMeOnline Full-Stack Architect Skill v2.5 in this repository. Governs business invariants, MVP boundaries and approved subscription baseline.

