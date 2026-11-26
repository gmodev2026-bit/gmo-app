'use client';

import { useActionState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { SupplierActionState } from '@/features/suppliers/action-state';
import { createSupplierAction, updateSupplierAction } from './actions';

type SupplierFormOptions = {
  categories: { id: string; name: string }[];
  cities: {
    id: string;
    name: string;
    province: { name: string };
  }[];
};

type SupplierFormValue = {
  id: string;
  businessName: string;
  slug: string;
  businessType: 'SERVICE_PROVIDER' | 'PRODUCT_SELLER' | 'HYBRID';
  tagline: string;
  description: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  internalNotes: string;
  categories: { categoryId: string; isPrimary: boolean }[];
  primaryCategoryId: string;
  cityIds: string[];
};

const initialState: SupplierActionState = { status: 'idle' };

export function SupplierForm({
  supplier,
  categories,
  cities
}: SupplierFormOptions & { supplier?: SupplierFormValue }) {
  const action = supplier ? updateSupplierAction : createSupplierAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className='space-y-6'>
      {supplier && (
        <input type='hidden' name='supplierId' value={supplier.id} />
      )}

      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField label='Business name' htmlFor='businessName'>
          <input
            id='businessName'
            name='businessName'
            required
            minLength={2}
            maxLength={120}
            defaultValue={supplier?.businessName}
            className={inputClassName}
          />
        </FormField>
        <FormField label='Reserved profile slug' htmlFor='slug'>
          <input
            id='slug'
            name='slug'
            required
            pattern='[a-z0-9]+(?:-[a-z0-9]+)*'
            maxLength={100}
            defaultValue={supplier?.slug}
            placeholder='example-home-services'
            className={inputClassName}
          />
        </FormField>
        <FormField label='Business type' htmlFor='businessType'>
          <select
            id='businessType'
            name='businessType'
            required
            defaultValue={supplier?.businessType ?? 'SERVICE_PROVIDER'}
            className={inputClassName}
          >
            <option value='SERVICE_PROVIDER'>Service provider</option>
            <option value='PRODUCT_SELLER'>Product seller</option>
            <option value='HYBRID'>Hybrid</option>
          </select>
        </FormField>
        <FormField label='Contact person' htmlFor='contactName'>
          <input
            id='contactName'
            name='contactName'
            maxLength={120}
            defaultValue={supplier?.contactName}
            className={inputClassName}
          />
        </FormField>
        <FormField label='Business phone' htmlFor='phone'>
          <input
            id='phone'
            name='phone'
            type='tel'
            required
            minLength={7}
            maxLength={30}
            defaultValue={supplier?.phone}
            className={inputClassName}
          />
        </FormField>
        <FormField label='Business email' htmlFor='email'>
          <input
            id='email'
            name='email'
            type='email'
            maxLength={254}
            defaultValue={supplier?.email}
            className={inputClassName}
          />
        </FormField>
        <FormField label='Website' htmlFor='website'>
          <input
            id='website'
            name='website'
            type='url'
            maxLength={2048}
            defaultValue={supplier?.website}
            placeholder='https://example.co.za'
            className={inputClassName}
          />
        </FormField>
        <FormField label='Short tagline' htmlFor='tagline'>
          <input
            id='tagline'
            name='tagline'
            maxLength={160}
            defaultValue={supplier?.tagline}
            className={inputClassName}
          />
        </FormField>
      </div>

      <FormField label='Business description' htmlFor='description'>
        <Textarea
          id='description'
          name='description'
          maxLength={4000}
          rows={4}
          defaultValue={supplier?.description}
        />
      </FormField>

      <fieldset className='space-y-3'>
        <legend className='text-sm font-medium'>
          Confirmed services and primary category
        </legend>
        {categories.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            Add active categories before registering a supplier.
          </p>
        ) : (
          <>
            <div className='grid gap-2 sm:grid-cols-2'>
              {categories.map((category) => (
                <label
                  key={category.id}
                  htmlFor={`category-${category.id}`}
                  className='border-border flex items-center gap-3 rounded-xl border p-3 text-sm'
                >
                  <input
                    id={`category-${category.id}`}
                    type='checkbox'
                    name='categoryIds'
                    value={category.id}
                    defaultChecked={supplier?.categories.some(
                      (item) => item.categoryId === category.id
                    )}
                    className='accent-primary size-4'
                  />
                  {category.name}
                </label>
              ))}
            </div>
            <FormField label='Primary category' htmlFor='primaryCategoryId'>
              <select
                id='primaryCategoryId'
                name='primaryCategoryId'
                required
                defaultValue={supplier?.primaryCategoryId ?? ''}
                className={inputClassName}
              >
                <option value='' disabled>
                  Choose a primary category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>
          </>
        )}
      </fieldset>

      <fieldset className='space-y-3'>
        <legend className='text-sm font-medium'>Confirmed service areas</legend>
        {cities.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            Add active cities before registering supplier coverage.
          </p>
        ) : (
          <div className='grid gap-2 sm:grid-cols-2'>
            {cities.map((city) => (
              <label
                key={city.id}
                htmlFor={`city-${city.id}`}
                className='border-border flex items-center gap-3 rounded-xl border p-3 text-sm'
              >
                <input
                  id={`city-${city.id}`}
                  type='checkbox'
                  name='cityIds'
                  value={city.id}
                  defaultChecked={supplier?.cityIds.includes(city.id)}
                  className='accent-primary size-4'
                />
                {city.name}, {city.province.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <FormField label='Internal operational notes' htmlFor='internalNotes'>
        <Textarea
          id='internalNotes'
          name='internalNotes'
          maxLength={4000}
          rows={4}
          defaultValue={supplier?.internalNotes}
          placeholder='Admin-only notes. Do not store identity-document numbers or unnecessary personal data.'
        />
      </FormField>

      {supplier && (
        <FormField label='Reason for this update' htmlFor='reason'>
          <Textarea
            id='reason'
            name='reason'
            required
            minLength={5}
            maxLength={500}
            rows={3}
            placeholder='Record what changed and why.'
          />
        </FormField>
      )}

      {state.message && (
        <p
          aria-live='polite'
          role={state.status === 'error' ? 'alert' : 'status'}
          className={
            state.status === 'error'
              ? 'text-destructive text-sm'
              : 'text-primary text-sm'
          }
        >
          {state.message}
        </p>
      )}

      <Button type='submit' disabled={pending} className='w-full sm:w-auto'>
        {pending
          ? 'Saving supplier…'
          : supplier
            ? 'Save supplier details'
            : 'Create supplier'}
      </Button>
    </form>
  );
}

function FormField({
  label,
  htmlFor,
  children
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className='space-y-2'>
      <label htmlFor={htmlFor} className='text-sm font-medium'>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  'border-input bg-background focus-visible:ring-ring h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2';
