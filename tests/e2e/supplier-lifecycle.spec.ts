import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { expect, test, type Page } from '@playwright/test';

config({ path: '.env.local' });
config();

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

const supplierEmail = process.env.GMO_E2E_SUPPLIER_EMAIL;
const supplierPassword = process.env.GMO_E2E_SUPPLIER_PASSWORD;
const adminEmail = process.env.GMO_E2E_ADMIN_EMAIL;
const adminPassword = process.env.GMO_E2E_ADMIN_PASSWORD;
const hasTestCredentials = Boolean(
  supplierEmail && supplierPassword && adminEmail && adminPassword
);

test('supplier owner and admin complete review, resubmission, and privacy flow', async ({
  browser
}) => {
  test.skip(
    !hasTestCredentials,
    'Configure synthetic owner/admin credentials in local environment variables.'
  );

  const ownerContext = await browser.newContext();
  const adminContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const adminPage = await adminContext.newPage();
  const suffix = randomUUID().slice(0, 8);
  const businessName = `Synthetic lifecycle ${suffix}`;
  const phone = '+27115550222';
  const email = `lifecycle-${suffix}@example.test`;
  const website = `https://lifecycle-${suffix}.example.test`;
  let detailHref: string | null = null;
  let adminSignedIn = false;
  let supplierSlug: string | null = null;

  try {
    await signIn(ownerPage, supplierEmail!, supplierPassword!, false);
    await signIn(adminPage, adminEmail!, adminPassword!, true);
    adminSignedIn = true;

    await ownerPage.goto('/dashboard/supplier');
    const slugInput = ownerPage.locator('input[name="slug"]');
    const hasSupplier = (await slugInput.count()) > 0;
    if (hasSupplier) {
      const currentBusinessName = await ownerPage
        .locator('input[name="businessName"]')
        .inputValue();
      const statusBadge = await ownerPage
        .locator('div.flex.flex-wrap.gap-2.text-xs > span')
        .first()
        .innerText();
      const currentStatus = statusBadge
        .toUpperCase()
        .replaceAll(' ', '_');

      if (currentStatus === 'APPROVED' || currentStatus === 'PENDING_APPROVAL') {
        detailHref = await openAdminSupplier(
          adminPage,
          currentBusinessName
        );
        await saveAdminReview(
          adminPage,
          currentStatus === 'APPROVED' ? 'SUSPENDED' : 'CHANGES_REQUESTED',
          currentStatus === 'APPROVED'
            ? 'Reset synthetic acceptance profile before the test.'
            : 'Please update this synthetic profile before resubmission.',
          false,
          false
        );
        await ownerPage.reload();
      }
    }

    const categories = ownerPage.locator('input[name="categoryIds"]');
    const cities = ownerPage.locator('input[name="cityIds"]');
    const categoryCount = await categories.count();
    const cityCount = await cities.count();
    if (categoryCount === 0 || cityCount === 0) {
      throw new Error('Supplier onboarding requires active categories and cities.');
    }

    const primaryCategoryId = await categories.first().getAttribute('value');
    if (!primaryCategoryId) {
      throw new Error('The first active category is missing its identifier.');
    }
    await categories.first().check();
    await ownerPage
      .locator('select[name="primaryCategoryId"]')
      .selectOption(primaryCategoryId);
    await cities.first().check();

    await ownerPage.locator('input[name="businessName"]').fill(businessName);
    await ownerPage
      .locator('input[name="slug"]')
      .fill(`e2e-supplier-${suffix}`);
    await ownerPage.locator('input[name="contactName"]').fill('Test Contact');
    await ownerPage.locator('input[name="phone"]').fill(phone);
    await ownerPage.locator('input[name="email"]').fill(email);
    await ownerPage.locator('input[name="website"]').fill(website);
    await ownerPage
      .locator('textarea[name="description"]')
      .fill('Synthetic supplier profile used for lifecycle acceptance.');
    await ownerPage.getByRole('button', { name: 'Save draft' }).click();
    await expect(ownerPage.getByText('Draft saved.')).toBeVisible();
    supplierSlug = await ownerPage.locator('input[name="slug"]').inputValue();

    const preferencesForm = ownerPage
      .locator('form')
      .filter({ has: ownerPage.getByRole('button', { name: 'Save contact preferences' }) });
    for (const field of [
      'isContactNamePublic',
      'isPhonePublic',
      'isEmailPublic',
      'isWebsitePublic'
    ]) {
      const checkbox = preferencesForm.locator(`input[name="${field}"]`);
      if (await checkbox.isChecked()) await checkbox.uncheck();
    }
    await preferencesForm
      .getByRole('button', { name: 'Save contact preferences' })
      .click();

    await ownerPage.getByRole('button', { name: 'Submit for review' }).click();
    await expect(
      ownerPage.getByText('Profile submitted for review.')
    ).toBeVisible();

    detailHref = await openAdminSupplier(adminPage, businessName);
    const changesReason =
      'Please update this synthetic profile before resubmission.';
    await saveAdminReview(
      adminPage,
      'CHANGES_REQUESTED',
      changesReason,
      false,
      false
    );

    await ownerPage.goto('/dashboard/supplier');
    await expect(ownerPage.getByText(changesReason)).toBeVisible();
    await ownerPage
      .locator('textarea[name="description"]')
      .fill('Synthetic changes applied after admin feedback.');
    await ownerPage.getByRole('button', { name: 'Save draft' }).click();
    await expect(ownerPage.getByText('Draft saved.')).toBeVisible();
    await ownerPage.getByRole('button', { name: 'Submit for review' }).click();
    await expect(
      ownerPage.getByText('Profile submitted for review.')
    ).toBeVisible();

    await adminPage.goto(detailHref);
    const adminCategories = adminPage.locator('input[name="categoryIds"]');
    const adminCities = adminPage.locator('input[name="cityIds"]');
    if ((await adminCategories.count()) === 0 || (await adminCities.count()) === 0) {
      throw new Error('Admin review requires active categories and cities.');
    }
    const adminCategoryId = await adminCategories.first().getAttribute('value');
    if (!adminCategoryId) {
      throw new Error('The first active admin category is missing its identifier.');
    }
    await adminCategories.first().check();
    await adminPage
      .locator('select[name="primaryCategoryId"]')
      .selectOption(adminCategoryId);
    await adminCities.first().check();
    await adminPage
      .locator('#reason')
      .fill('Confirm synthetic acceptance services and coverage.');
    await adminPage
      .getByRole('button', { name: 'Save supplier details' })
      .click();
    await expect(adminPage.getByText('Supplier details saved.')).toBeVisible();

    await saveAdminReview(
      adminPage,
      'APPROVED',
      'Approve synthetic lifecycle acceptance fixture.',
      true,
      true
    );

    await ownerPage.goto(`/b/${supplierSlug}`);
    await expect(ownerPage.getByRole('heading', { name: businessName })).toBeVisible();
    let profileHtml = await ownerPage.content();
    for (const privateValue of ['Test Contact', phone, email, website]) {
      expect(profileHtml).not.toContain(privateValue);
    }

    await ownerPage.goto('/suppliers');
    profileHtml = await ownerPage.content();
    for (const privateValue of ['Test Contact', phone, email, website]) {
      expect(profileHtml).not.toContain(privateValue);
    }

    await ownerPage.goto('/sitemap.xml');
    profileHtml = await ownerPage.content();
    expect(profileHtml).toContain(`/b/${supplierSlug}`);
    for (const privateValue of ['Test Contact', phone, email, website]) {
      expect(profileHtml).not.toContain(privateValue);
    }

    await ownerPage.goto('/dashboard/supplier');
    const approvedPreferences = ownerPage
      .locator('form')
      .filter({ has: ownerPage.getByRole('button', { name: 'Save contact preferences' }) });
    await approvedPreferences.locator('input[name="isPhonePublic"]').check();
    await approvedPreferences.locator('input[name="isWebsitePublic"]').check();
    await approvedPreferences
      .getByRole('button', { name: 'Save contact preferences' })
      .click();
    await expect(
      ownerPage.getByText('Public contact preferences saved.')
    ).toBeVisible();

    await ownerPage.goto(`/b/${supplierSlug}`);
    await expect(
      ownerPage.locator('a[href^="tel:"]')
    ).toHaveAttribute('href', `tel:${phone}`);
    await expect(
      ownerPage.getByRole('link', { name: 'Visit supplier website' })
    ).toHaveAttribute('href', website);
    profileHtml = await ownerPage.content();
    expect(profileHtml).not.toContain('Test Contact');
    expect(profileHtml).not.toContain(email);
  } finally {
    if (supplierSlug) {
      await ownerPage.goto('/dashboard/supplier');
      const preferencesForm = ownerPage
        .locator('form')
        .filter({ has: ownerPage.getByRole('button', { name: 'Save contact preferences' }) });
      if ((await preferencesForm.count()) > 0) {
        for (const field of [
          'isContactNamePublic',
          'isPhonePublic',
          'isEmailPublic',
          'isWebsitePublic'
        ]) {
          const checkbox = preferencesForm.locator(`input[name="${field}"]`);
          if (await checkbox.isChecked()) await checkbox.uncheck();
        }
        await preferencesForm
          .getByRole('button', { name: 'Save contact preferences' })
          .click();
      }
    }

    if (adminSignedIn && detailHref) {
      await adminPage.goto(detailHref);
      const status = await adminPage.locator('#supplier-status').inputValue();
      if (status === 'APPROVED') {
        await saveAdminReview(
          adminPage,
          'SUSPENDED',
          'Suspend synthetic lifecycle acceptance fixture after the test.',
          false,
          false
        );
      }
    }
    await Promise.all([ownerContext.close(), adminContext.close()]);
  }
});

async function signIn(
  page: Page,
  email: string,
  password: string,
  isAdmin: boolean
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  const expectedUrl = isAdmin ? /\/admin/ : /\/dashboard\/client/;
  const loginError = page.getByRole('alert');
  const outcome = await Promise.race([
    page.waitForURL(expectedUrl, { timeout: 10_000 }).then(() => 'signed-in'),
    loginError
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => 'error')
  ]);
  if (outcome === 'error') {
    const message = (await loginError.innerText()).toLowerCase();
    if (message.includes('verif')) {
      throw new Error('The configured synthetic account is not email-verified.');
    }
    if (message.includes('invalid') || message.includes('password')) {
      throw new Error('The configured synthetic account credentials were rejected.');
    }
    throw new Error('Sign-in showed an application error for the synthetic account.');
  }
}

async function openAdminSupplier(page: Page, businessName: string) {
  await page.goto('/admin/suppliers');
  const row = page.getByRole('row').filter({ hasText: businessName });
  await expect(row).toBeVisible();
  const href = await row.getByRole('link', { name: 'Manage' }).getAttribute('href');
  if (!href) throw new Error('Supplier detail link is missing.');
  await page.goto(href);
  return href;
}

async function saveAdminReview(
  page: Page,
  status: string,
  reason: string,
  verified: boolean,
  indexable: boolean
) {
  await page.locator('#supplier-status').selectOption(status);
  await page.locator('#supplier-verification').selectOption(String(verified));
  await page.locator('#supplier-indexability').selectOption(String(indexable));
  await page
    .locator('#verification-method')
    .fill(verified ? 'Synthetic fixture acceptance; no real supplier claim.' : '');
  await page.locator('#supplier-review-reason').fill(reason);
  await page.getByRole('button', { name: 'Save review' }).click();
  await expect(page.getByText('Supplier review saved.')).toBeVisible();
}
