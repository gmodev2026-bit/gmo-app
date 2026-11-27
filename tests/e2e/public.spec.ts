import { expect, test } from '@playwright/test';

test('homepage renders the primary enquiry journey', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/GrowMeOnline/i);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Useful tools for both sides of the marketplace'
    })
  ).toBeVisible();
  await expect(
    page.getByRole('link', {
      name: /How to get more enquiries as a local service provider/
    })
  ).toHaveAttribute(
    'href',
    '/blog/get-more-enquiries-local-service-provider'
  );
  const requestLink = page.getByRole('link', {
    name: 'Check availability'
  });
  await expect(requestLink).toHaveAttribute('href', '/request');
  const signInLink = page.getByRole('link', { name: 'Sign in' });
  await expect(signInLink).toHaveAttribute('href', '/login');
  await expect(
    page.getByRole('link', { name: 'Find a Supplier' })
  ).toHaveAttribute('href', '/suppliers');
  await expect(
    page.getByRole('link', { name: 'List My Business' }).first()
  ).toHaveAttribute('href', '/supplier/join');
});

test('blog archive and imported article render locally', async ({ page }) => {
  await page.goto('/blog');

  await expect(
    page.getByRole('heading', { name: 'The GrowMeOnline Blog', level: 1 })
  ).toBeVisible();
  await expect(
    page.getByRole('link', {
      name: /How to get more enquiries as a local service provider/
    })
  ).toHaveAttribute(
    'href',
    '/blog/get-more-enquiries-local-service-provider'
  );

  await page.goto('/blog/get-more-enquiries-local-service-provider');
  await expect(
    page.getByRole('heading', {
      name: 'How to get more enquiries as a local service provider',
      level: 1
    })
  ).toBeVisible();
  await expect(page).toHaveTitle(
    /How to get more enquiries as a local service provider/
  );
  await expect(
    page.getByRole('heading', {
      name: 'Start with the customer’s question',
      level: 2
    })
  ).toBeVisible();
  await expect(
    page.getByText(/More enquiries are not guaranteed by a profile alone/)
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'List My Business' })
  ).toHaveAttribute('href', '/supplier/join');

  await page.goto('/blog?category=FOR_CUSTOMERS');
  await expect(
    page.getByRole('heading', { name: 'How to choose a trustworthy supplier' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'How to get more enquiries as a local service provider'
    })
  ).toHaveCount(0);

  const sitemapResponse = await page.request.get('/sitemap.xml');
  expect(sitemapResponse.ok()).toBeTruthy();
  await expect(sitemapResponse.text()).resolves.toContain(
    '/blog/get-more-enquiries-local-service-provider'
  );
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

test('anonymous visitors cannot retrieve unknown supplier media', async ({
  request
}) => {
  const response = await request.get(
    '/api/media/00000000-0000-4000-8000-000000000000'
  );
  expect(response.status()).toBe(404);
});
