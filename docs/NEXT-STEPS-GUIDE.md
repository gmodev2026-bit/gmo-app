# GrowMeOnline next-steps guide

**Updated:** 27 November 2026  
**Authority:** `GrowMeOnline_Full_Stack_Architect_Skill_v2.6.md`  
**Related documents:** [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md), [`IMPLEMENTATION-STATUS.md`](./IMPLEMENTATION-STATUS.md), [`PILOT_READINESS.md`](./PILOT_READINESS.md)

## Recommendation

Finish and verify the v2.6 account, supplier onboarding, public profile, and account-linked enquiry scope before adding more features. Most of the core implementation exists; the highest-priority remaining work is authenticated browser acceptance, media lifecycle acceptance, client/auth security verification, and release gates.

The v2.6 scope override means committed client and supplier self-service work is in scope now. It does **not** make payment activation, bulk messaging, advanced automation, or production deployment part of the immediate task.

## Current snapshot

- Repository status reports implementation work in progress. Preserve the existing modified and untracked files; do not reset, clean, or overwrite them to start this guide.
- The implementation status reports 21 unit tests, two rolled-back integration tests, passing lint/typecheck/build, and homepage/blog Playwright checks. Authenticated supplier-owner/admin browser acceptance is still skipped when its local test credentials are missing.
- The supplier lifecycle browser test exists, but it creates/updates supplier data. Run it only against a dedicated, disposable test database and synthetic accounts.
- Supplier media upload and moderation code exists; end-to-end owner/admin lifecycle and failed-upload cleanup acceptance remain open. Production uploads remain disabled.
- The latest pilot readiness run found **0 of 6** category/city combinations ready. Each combination needs five eligible suppliers; one real supplier may count toward more than one combination if their approved categories and coverage qualify.
- Email-dependent verification needs a successful smoke test with the approved Resend sender configuration.
- Privacy/legal approval, retention/deletion operations, backup/restore, monitoring, and deployment approval remain external readiness gates.

## Step-by-step sequence

### 0. Protect current work and test data

1. Review `git status` and preserve the current in-progress changes. Coordinate before switching branches or replacing files.
2. Use synthetic accounts and a dedicated disposable database for browser tests that create or modify records.
3. Keep credentials in ignored local environment files such as `.env.local`; never paste them into chat, commit them, or include them in test output.
4. Keep public intake closed. Do not use real customer/supplier information in tests.

### 1. Run the existing quality baseline

From the repository root:

```powershell
npm test
npm run test:integration
npm run lint
npm exec tsc -- --noEmit
npm run build
```

Resolve failures before trusting browser results. Review Prisma migration status only against the approved development/test database:

```powershell
npx prisma migrate status
```

Do not use a reset, destructive migration, or seed against a database unless it has been confirmed disposable.

### 2. Complete authenticated supplier onboarding and review acceptance

1. Create or select one email-verified **synthetic supplier-owner** account and one synthetic admin account in the disposable test environment. Confirm the admin role is granted server-side.
2. Add these variable names and their local-only values to ignored `.env.local`:
   - `GMO_E2E_SUPPLIER_EMAIL`
   - `GMO_E2E_SUPPLIER_PASSWORD`
   - `GMO_E2E_ADMIN_EMAIL`
   - `GMO_E2E_ADMIN_PASSWORD`
3. Run the existing lifecycle test:

```powershell
npm run test:e2e -- --grep "supplier owner and admin complete review"
```

4. Confirm the test covers draft save, submit, admin change request, owner feedback/resubmission, approval, and visibility settings. Add a separate second-owner isolation assertion; the current lifecycle test does not prove cross-owner access is denied. Investigate any cleanup or data left by the run before reusing that database.

If the test is skipped, check that the four variables are present in the process environment used by Playwright. Never print their values when troubleshooting.

### 3. Complete media lifecycle acceptance

Use a development-only Bunny Storage configuration and synthetic image files. Keep production uploads disabled.

Verify, as separate owner, admin, and anonymous sessions:

1. A verified owner uploads an allowed image to their own profile.
2. Pending media is visible only to its owner/admin and is absent from public pages.
3. An admin can preview and approve or remove the image; each action is audited.
4. The owner can remove their own image but cannot alter another supplier's asset.
5. Public delivery works only for approved media on an eligible supplier.
6. Invalid, oversized, mismatched, and failed uploads do not become public; failed and orphaned objects have a safe cleanup/reconciliation path.

Add or finish Playwright coverage for the authenticated lifecycle and cleanup cases. Do not enable the upload flag against production storage for testing.

### 4. Finish public supplier-page acceptance

With an approved synthetic supplier, check the page, directory, sitemap, metadata, structured data, and old-slug behavior.

- Confirm draft, pending, suspended, deleted, and non-indexable suppliers do not leak through page HTML, metadata, JSON-LD, sitemap, API responses, preview URLs, or caches.
- Confirm each contact field stays private unless that supplier explicitly opts it in.
- Confirm only ready media is public and the owner preview is authenticated, private, and non-indexable.
- Confirm supplier-page enquiries target only that supplier and still enter normal GMO review.

Record evidence in `docs/IMPLEMENTATION-STATUS.md` against the v2.6 acceptance matrix.

### 5. Verify client registration, email, and account isolation

1. Use the approved test sender and a synthetic mailbox to complete signup, email verification, sign-in/out, and password reset end to end.
2. If email cannot be delivered, record it as provider/configuration blocked; do not claim verification works based only on a successful build.
3. Add/run tests for cross-client enquiry access, role escalation, guest enquiry linking with verified ownership, and unauthorized account/profile changes.
4. Confirm account privacy actions provide safe feedback and follow an approved identity, retention, and deletion process. Do not execute real deletion requests as a test shortcut.

### 6. Close enquiry and dispatch acceptance gaps

Use a dedicated test database with explicitly synthetic records. Do not enable intake in a shared or production environment.

Verify both guest and signed-in enquiry routes, plus supplier-specific enquiries:

- Both paths create the same canonical enquiry and start in `PENDING_REVIEW`.
- Validation, consent, template version, submission idempotency, phone rate limits, and duplicate-candidate behavior are enforced server-side.
- Uncovered categories/locations and closed intake reject safely.
- Admin review, contact verification and sharing approval are required before dispatch.
- Supplier-specific requests cannot dispatch to another supplier without customer approval.
- Dispatch, quota, audit, and outbox changes remain atomic under retries and failures; an outbox record is not proof that a notification was delivered.
- Customer and supplier contact data is visible only to authorized actors and intended recipients.

Add isolated integration or browser tests for gaps not already covered. Keep actual email/WhatsApp delivery disabled until provider, consent, and operational handling are approved.

### 7. Refresh pilot and operational readiness

Run the read-only supplier coverage report:

```powershell
npm run db:pilot-readiness
```

Current result: **0/6 combinations** meet the five-eligible-supplier minimum. Recruit and verify real suppliers, confirm each category and city association, and rerun the report. Synthetic/demo/simulation suppliers do not count.

Before any live intake decision, the owner/operator must also confirm:

- Staffing and follow-up ownership for the agreed operating hours.
- Privacy notice, contact-sharing language, retention, and South African privacy/legal review.
- Supplier verification evidence and badge wording.
- Backup and restore procedure, monitoring, incident response, and separate production secrets.
- Hosting and deployment approval.

Meeting the supplier count alone does not authorize public intake.

### 8. Close out and decide on deployment separately

1. Update `docs/IMPLEMENTATION-STATUS.md` with evidence, test commands, blockers, and the next dependency.
2. Re-run the quality baseline after changes.
3. Review the v2.6 acceptance matrix in the master skill and the MVP criteria in the implementation plan.
4. Make a separate owner decision on whether to deploy a protected preview or production service. This guide does not authorize Vercel/Railway deployment or real data processing.

## Later or blocked work

- **Payment checkout and paid entitlement activation:** blocked on payment-provider capability and approved VAT, renewal, cancellation, refund, failed-payment, and grace-period terms. Keep disabled.
- **Bulk messaging, WhatsApp automation, dormant-lead reactivation, and autonomous AI decisions:** later scope requiring explicit consent, provider, privacy, and human-oversight decisions.
- **Blog authoring CMS:** not included in the current read-only seeded blog scope; agree author roles and publishing workflow before building.
- **Live pilot and public acquisition:** blocked until eligible supplier coverage and all owner/operator launch checks pass.

## Completion rule

Mark a workstream `DONE` only after its acceptance checks have been executed and evidence recorded. Keep implementation complete, test-verified, policy-blocked, environment-blocked, and production-ready as distinct statuses.
