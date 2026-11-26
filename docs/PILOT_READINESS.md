# Controlled Pilot Readiness

## Launch gate

Public enquiry intake is closed unless this environment variable is set explicitly:

```env
GMO_PILOT_INTAKE_ENABLED=true
```

The default is closed. Enabling the flag is necessary but not sufficient: the server also rejects category/city combinations with fewer than five approved, verified and active suppliers with confirmed category and city coverage.

## Operator checklist

- Supplier recruitment: at least five eligible suppliers for each open subcategory/city combination.
- Review capacity: staff assigned for Monday-Friday 08:00-17:00 SAST.
- Response workflow: availability confirmation and one follow-up are assigned before dispatch.
- Supplier-specific requests: contact and dispatch only to the selected supplier. If they are unavailable or ineligible, hold the request and ask the customer before offering alternatives.
- Contact verification: staff manually verifies the customer's selected contact channel, records the customer's explicit approval to share relevant request details, and completes both records before supplier dispatch.
- Duplicate screening: requests with the same normalized contact, category, and city within 24 hours are flagged as candidates for manual comparison; they are not automatically rejected.
- Submission rate limit: at most five valid submissions per normalized phone number in a rolling hour. The limiter stores a keyed phone fingerprint, not the phone itself, and expires old attempt rows during subsequent valid submissions. IP-based limits remain deferred until a trusted hosting proxy is configured.
- Dispatch notifications: each confirmed supplier assignment writes a pending outbox event in the same transaction. Admins can inspect event counts and recent records at `/admin/outbox`; simulation events are marked separately. This only queues an internal event; no email or WhatsApp messages are sent until a provider, delivery worker and consent requirements are approved.
- Audit trail: admin supplier, enquiry, availability, dispatch and follow-up changes are recorded atomically and can be reviewed at `/admin/audit`. The audit view omits customer contact details and free-text notes.
- Gated supplier portal: an admin may link an existing email-verified regular user account to an existing supplier record. `/dashboard/supplier` is read-only and contains no customer leads or messaging. Public supplier applications and profile editing are not enabled.
- Privacy: notices, consent wording, retention and Information Officer obligations have received appropriate South African review.
- Operations: enquiry triage, follow-up, dispatch and outcome ownership are documented.
- Acquisition: organic/referral/social source identifiers are available; no paid campaign is assumed.
- Database: migrations are applied to the intended test or production database and backups/restores are verified.
- Secrets: deployment secrets are separate, rotated and never copied into source control.
- Deployment: hosting and production provisioning are owner-approved.

Do not set the launch flag only to test the public form. Use `GMO_PILOT_INTAKE_ENABLED=false` for local and test work and use the simulation command for controlled workflow validation.

Recruitment and launch coverage can be checked without changing data:

```bash
npm run db:pilot-readiness
```

The report excludes suppliers whose slug starts with `simulation-` and reports the exact number still missing for each category/city combination. The admin dashboard displays the same six coverage counts and links to the supplier register; meeting the count does not enable public intake by itself.

Admins can review the automatic coverage and intake-configuration gates alongside owner/operator launch checks at `/admin/readiness`. The owner/operator items are intentionally informational; the application does not assume legal approval, staffing, backup readiness or provider approval.

To test the five-supplier gate without persistent synthetic data:

```bash
npm run db:pilot-supply-test
```

This transaction creates only test-only records, verifies Plumbing/Johannesburg reaches five eligible suppliers, deliberately rolls back, and verifies no records from that run remain. It does not remove other test data. Synthetic records do not satisfy live recruitment or the public pilot gate.

To add persistent demo records for admin UI testing, first seed the pilot catalog, then explicitly opt in:

```bash
npm run db:seed
$env:GMO_SEED_DEMO_DATA = "true"
npm run db:seed-demo
```

The demo seed creates one clearly labeled fake supplier per pilot category in Johannesburg. It is idempotent and refuses to overwrite a record that does not match its synthetic marker. These suppliers use `.invalid` email addresses, remain draft/unverified/inactive, and do not count toward public listings or pilot coverage. Never use the demo seed in production or treat these records as recruited businesses.

Remove browser-created test-only supplier records with:

```bash
npm run db:cleanup-test-suppliers
```

This deletes only suppliers whose slug starts with `test-only-ui-` or `test-only-`. It does not remove real or simulation suppliers.
