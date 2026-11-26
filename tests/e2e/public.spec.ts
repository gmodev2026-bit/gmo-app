import { expect, test } from '@playwright/test';

test('homepage renders the primary enquiry journey', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/GrowMeOnline/i);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.getByRole('status')).toContainText(
    'Pilot requests are temporarily closed'
  );

  const requestLink = page.getByRole('link', {
    name: 'Check pilot request availability'
  });
  const signInLink = page.getByRole('link', { name: 'Sign in' });
  await expect(page.getByRole('link', { name: 'For suppliers' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Create a client account' }).first()
  ).toHaveAttribute('href', '/signup');
  const requestBox = await requestLink.boundingBox();
  const signInBox = await signInLink.boundingBox();
  if (!requestBox || !signInBox) {
    throw new Error('Expected request and sign-in actions to be visible.');
  }
  expect(signInBox.x).toBeGreaterThan(requestBox.x);
});

test('suppliers can find the verified registration path', async ({ page }) => {
  await page.goto('/supplier/join');

  await expect(
    page.getByRole('heading', { name: 'Create your supplier profile' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Create your supplier account' })
  ).toBeVisible();
  await expect(
    page.getByText(
      /profile stays private until it has been reviewed and approved/i
    )
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create Account' })
  ).toBeVisible();
});

test('client registration explains verification and collects account details', async ({
  page
}) => {
  await page.goto('/signup');

  await expect(
    page.getByRole('heading', { name: 'Create your account' })
  ).toBeVisible();
  await expect(
    page.getByText(/manage your client profile and enquiries/i)
  ).toBeVisible();
  await expect(page.getByLabel('First Name')).toBeVisible();
  await expect(page.getByLabel('Last Name')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create Account' })
  ).toBeVisible();
});

test('pilot request form remains closed by default', async ({ page }) => {
  await page.goto('/request');
  await expect(
    page.getByRole('heading', { name: 'Enquiry intake is temporarily closed.' })
  ).toBeVisible();
});

test('supplier directory renders safely', async ({ page }) => {
  await page.goto('/suppliers');
  await expect(
    page.getByRole('heading', { name: 'Find local service providers' })
  ).toBeVisible();
  await expect(page.getByText(/0 eligible suppliers/)).toBeVisible();
});

test('protected supplier preview redirects anonymous users', async ({
  page
}) => {
  await page.goto('/dashboard/supplier/preview');
  await expect(page).toHaveURL(/\/login/);
});
