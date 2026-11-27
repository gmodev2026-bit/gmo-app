'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { SupplierMediaManager } from '@/components/dashboard/supplier-media-manager';
import {
  saveSupplierDraftAction,
  submitSupplierProfileAction
} from './actions';
import { SupplierContactVisibilityForm } from './supplier-contact-visibility-form';

type OnboardingSupplier = {
  id: string;
  businessName: string;
  slug: string;
  businessType: 'SERVICE_PROVIDER' | 'PRODUCT_SELLER' | 'HYBRID';
  tagline: string | null;
  description: string | null;
  contactName: string | null;
  phone: string;
  email: string | null;
  website: string | null;
  isContactNamePublic: boolean;
  isPhonePublic: boolean;
  isEmailPublic: boolean;
  isWebsitePublic: boolean;
  status:
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'CHANGES_REQUESTED'
    | 'APPROVED'
    | 'SUSPENDED';
  isVerified: boolean;
  isActive: boolean;
  isIndexable: boolean;
  categories: Array<{
    categoryId: string;
    isPrimary: boolean;
  }>;
  serviceAreas: Array<{ cityId: string }>;
  offerings: Array<{ name: string }>;
  reviewHistory: Array<{ reason: string }>;
  mediaAssets: Array<{
    id: string;
    purpose: 'LOGO' | 'COVER' | 'GALLERY' | 'VERIFICATION_DOCUMENT';
    status: 'PENDING' | 'READY' | 'REMOVED' | 'FAILED';
    altText: string | null;
    width: number | null;
    height: number | null;
    byteSize: number;
    createdAt: Date;
  }>;
};

type ActionState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

const idleState: ActionState = { status: 'idle' };

export function SupplierOnboardingForm({
  supplier,
  categories,
  cities
}: {
  supplier: OnboardingSupplier | null;
  categories: Array<{ id: string; name: string }>;
  cities: Array<{ id: string; name: string; province: { name: string } }>;
}) {
  const [saveState, saveAction, saving] = useActionState(
    saveSupplierDraftAction,
    idleState
  );
  const [submitState, submitAction, submitting] = useActionState(
    submitSupplierProfileAction,
    idleState
  );

  const selectedCategoryIds =
    supplier?.categories.map((item) => item.categoryId) ?? [];
  const primaryCategoryId =
    supplier?.categories.find((item) => item.isPrimary)?.categoryId ?? '';
  const selectedCityIds =
    supplier?.serviceAreas.map((item) => item.cityId) ?? [];
  const locked =
    supplier?.status === 'PENDING_APPROVAL' || supplier?.status === 'APPROVED';
  const isPublic =
    supplier?.status === 'APPROVED' &&
    supplier.isVerified &&
    supplier.isActive &&
    supplier.isIndexable;

  return (
    <div className='space-y-6'>
      {supplier && (
        <div className='flex flex-wrap gap-2 text-xs'>
          <span className='bg-muted rounded-full px-3 py-1'>
            {supplier.status.replaceAll('_', ' ').toLowerCase()}
          </span>
          <span className='bg-muted rounded-full px-3 py-1'>
            {supplier.isVerified ? 'Verified' : 'Not verified'}
          </span>
        </div>
      )}
      {supplier?.status === 'CHANGES_REQUESTED' &&
        supplier.reviewHistory[0] && (
          <section
            aria-labelledby='supplier-changes-requested'
            className='rounded-xl border border-amber-500/30 bg-amber-500/5 p-4'
          >
            <h2
              id='supplier-changes-requested'
              className='font-semibold'
            >
              Changes requested
            </h2>
            <p className='text-muted-foreground mt-2 text-sm'>
              {supplier.reviewHistory[0].reason}
            </p>
          </section>
        )}
      {supplier &&
        (isPublic ? (
          <Link
            href={`/b/${encodeURIComponent(supplier.slug)}`}
            className='text-primary inline-flex w-fit text-sm font-semibold hover:underline'
          >
            View your public business page
          </Link>
        ) : (
          <p className='text-muted-foreground text-sm'>
            Your public business page will be available after approval,
            verification, activation, and indexability review.
          </p>
        ))}

      <form action={saveAction} className='grid gap-5'>
        <fieldset disabled={locked} className='grid gap-5'>
          <div className='grid gap-5 md:grid-cols-2'>
            <Field label='Business name' htmlFor='businessName'>
              <Input
                id='businessName'
                name='businessName'
                defaultValue={supplier?.businessName ?? ''}
                required
                minLength={2}
                maxLength={120}
              />
            </Field>
            <Field label='Public slug' htmlFor='slug'>
              <Input
                id='slug'
                name='slug'
                defaultValue={supplier?.slug ?? ''}
                required
                pattern='[a-z0-9]+(?:-[a-z0-9]+)*'
                maxLength={100}
              />
            </Field>
          </div>
          <div className='grid gap-5 md:grid-cols-2'>
            <Field label='Business type' htmlFor='businessType'>
              <select
                id='businessType'
                name='businessType'
                defaultValue={supplier?.businessType ?? 'SERVICE_PROVIDER'}
                className={selectClass}
              >
                <option value='SERVICE_PROVIDER'>Service provider</option>
                <option value='PRODUCT_SELLER'>Product seller</option>
                <option value='HYBRID'>Hybrid</option>
              </select>
            </Field>
            <Field label='Contact name' htmlFor='contactName'>
              <Input
                id='contactName'
                name='contactName'
                defaultValue={supplier?.contactName ?? ''}
                maxLength={120}
              />
            </Field>
          </div>
          <Field label='Tagline' htmlFor='tagline'>
            <Input
              id='tagline'
              name='tagline'
              defaultValue={supplier?.tagline ?? ''}
              maxLength={160}
            />
          </Field>
          <Field label='Description' htmlFor='description'>
            <textarea
              id='description'
              name='description'
              defaultValue={supplier?.description ?? ''}
              maxLength={4000}
              rows={5}
              className={textareaClass}
            />
          </Field>
          <Field label='Offerings (one per line)' htmlFor='offerings'>
            <textarea
              id='offerings'
              name='offerings'
              defaultValue={
                supplier?.offerings
                  .map((offering) => offering.name)
                  .join('\n') ?? ''
              }
              maxLength={2000}
              rows={5}
              className={textareaClass}
              placeholder={'Emergency repairs\nInstallations\nMaintenance'}
            />
          </Field>
          <div className='grid gap-5 md:grid-cols-3'>
            <Field label='Phone' htmlFor='phone'>
              <Input
                id='phone'
                name='phone'
                defaultValue={supplier?.phone ?? ''}
                required
                minLength={7}
                maxLength={30}
              />
            </Field>
            <Field label='Email' htmlFor='email'>
              <Input
                id='email'
                name='email'
                type='email'
                defaultValue={supplier?.email ?? ''}
                maxLength={254}
              />
            </Field>
            <Field label='Website' htmlFor='website'>
              <Input
                id='website'
                name='website'
                type='url'
                defaultValue={supplier?.website ?? ''}
                maxLength={2048}
              />
            </Field>
          </div>
          <Field
            label='Primary and additional categories'
            htmlFor='primaryCategoryId'
          >
            <select
              id='primaryCategoryId'
              name='primaryCategoryId'
              defaultValue={primaryCategoryId}
              required
              className={selectClass}
            >
              <option value='' disabled>
                Select primary category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className='mt-3 grid gap-2 sm:grid-cols-2'>
              {categories.map((category) => (
                <label
                  key={category.id}
                  className='flex items-center gap-2 text-sm'
                >
                  <input
                    type='checkbox'
                    name='categoryIds'
                    value={category.id}
                    defaultChecked={selectedCategoryIds.includes(category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </Field>
          <fieldset>
            <legend className='mb-3 text-sm font-medium'>Service areas</legend>
            <div className='grid gap-2 sm:grid-cols-2'>
              {cities.map((city) => (
                <label
                  key={city.id}
                  className='flex items-center gap-2 text-sm'
                >
                  <input
                    type='checkbox'
                    name='cityIds'
                    value={city.id}
                    defaultChecked={selectedCityIds.includes(city.id)}
                  />
                  {city.name}, {city.province.name}
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>
        {!locked && (
          <Button type='submit' disabled={saving}>
            {saving ? 'Saving…' : 'Save draft'}
          </Button>
        )}
      </form>

      {saveState.message && (
        <p
          aria-live='polite'
          className={
            saveState.status === 'error'
              ? 'text-destructive text-sm'
              : 'text-primary text-sm'
          }
        >
          {saveState.message}
        </p>
      )}

      {supplier && supplier.status !== 'APPROVED' && (
        <form action={submitAction}>
          <Button
            type='submit'
            variant='outline'
            disabled={submitting || supplier.status === 'PENDING_APPROVAL'}
          >
            {submitting
              ? 'Submitting…'
              : supplier.status === 'PENDING_APPROVAL'
                ? 'Pending admin review'
                : 'Submit for review'}
          </Button>
        </form>
      )}

      {supplier ? (
        <SupplierContactVisibilityForm
          preferences={{
            isContactNamePublic: supplier.isContactNamePublic,
            isPhonePublic: supplier.isPhonePublic,
            isEmailPublic: supplier.isEmailPublic,
            isWebsitePublic: supplier.isWebsitePublic
          }}
          status={supplier.status}
        />
      ) : (
        <section className='border-border rounded-2xl border p-5'>
          <h2 className='font-semibold'>Public contact details</h2>
          <p className='text-muted-foreground mt-2 text-sm'>
            Save your supplier profile first. Contact name, phone, email, and
            website are private unless you opt in to show each field publicly.
          </p>
        </section>
      )}

      {submitState.message && (
        <p
          aria-live='polite'
          className={
            submitState.status === 'error'
              ? 'text-destructive text-sm'
              : 'text-primary text-sm'
          }
        >
          {submitState.message}
        </p>
      )}

      {supplier ? (
        <SupplierMediaManager
          supplierName={supplier.businessName}
          status={supplier.status}
          mediaAssets={supplier.mediaAssets}
        />
      ) : (
        <section className='border-border rounded-2xl border p-5'>
          <h2 className='font-semibold'>Business images</h2>
          <p className='text-muted-foreground mt-2 text-sm'>
            Save your supplier profile as a draft before adding images.
          </p>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className='grid gap-2 text-sm font-medium'>
      {label}
      {children}
    </label>
  );
}

const selectClass =
  'border-input bg-background h-11 rounded-md border px-3 text-sm';
const textareaClass =
  'border-input bg-background w-full rounded-md border px-3 py-2 text-sm';
