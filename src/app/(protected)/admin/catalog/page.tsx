import { Suspense } from 'react';
import { connection } from 'next/server';
import { AdminGate } from '@/components/admin/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitCategoryAction, submitCityAction } from './actions';
import {
  listAdminCatalog,
  setAdminCategoryActive,
  setAdminCityActive
} from '@/server/admin/catalog';

export default function CatalogPage() {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <Catalog />
      </Suspense>
    </AdminGate>
  );
}

async function Catalog() {
  await connection();
  const { categories, provinces } = await listAdminCatalog();

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <header>
        <h1 className='text-2xl font-semibold tracking-tight'>Catalog and locations</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Manage canonical categories and city records without deleting historical assignments.
        </p>
      </header>

      <div className='grid gap-6 xl:grid-cols-2'>
        <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
          <h2 className='text-lg font-semibold'>Add category</h2>
          <form action={submitCategoryAction} className='mt-5 grid gap-4'>
            <label htmlFor='category-name' className='grid gap-2 text-sm font-medium'>
              Name
              <Input id='category-name' name='name' required minLength={2} maxLength={100} />
            </label>
            <label htmlFor='category-slug' className='grid gap-2 text-sm font-medium'>
              Slug
              <Input id='category-slug' name='slug' required pattern='[a-z0-9]+(?:-[a-z0-9]+)*' maxLength={100} />
            </label>
            <label htmlFor='category-parent' className='grid gap-2 text-sm font-medium'>
              Parent category
              <select id='category-parent' name='parentId' className={selectClass}>
                <option value=''>Top-level category</option>
                {categories.filter((item) => item.parentId === null).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label htmlFor='category-description' className='grid gap-2 text-sm font-medium'>
              Description
              <textarea id='category-description' name='description' maxLength={500} rows={3} className={textareaClass} />
            </label>
            <Button type='submit'>Create category</Button>
          </form>
        </section>

        <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
          <h2 className='text-lg font-semibold'>Add city</h2>
          <form action={submitCityAction} className='mt-5 grid gap-4'>
            <label htmlFor='city-province' className='grid gap-2 text-sm font-medium'>
              Province
              <select id='city-province' name='provinceId' required className={selectClass}>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>{province.name}</option>
                ))}
              </select>
            </label>
            <label htmlFor='city-name' className='grid gap-2 text-sm font-medium'>
              City name
              <Input id='city-name' name='name' required minLength={2} maxLength={100} />
            </label>
            <label htmlFor='city-slug' className='grid gap-2 text-sm font-medium'>
              Slug
              <Input id='city-slug' name='slug' required pattern='[a-z0-9]+(?:-[a-z0-9]+)*' maxLength={100} />
            </label>
            <Button type='submit'>Create city</Button>
          </form>
        </section>
      </div>

      <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
        <h2 className='text-lg font-semibold'>Categories</h2>
        <div className='mt-4 overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead><tr><th className='py-2'>Name</th><th>Slug</th><th>Status</th><th><span className='sr-only'>Action</span></th></tr></thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className='border-border border-t'>
                  <td className='py-3'>{category.name}</td>
                  <td className='font-mono text-xs'>{category.slug}</td>
                  <td>{category.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <form action={async () => { 'use server'; await setAdminCategoryActive(category.id, !category.isActive); }}>
                      <Button type='submit' variant='outline' size='sm'>
                        {category.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
        <h2 className='text-lg font-semibold'>Locations</h2>
        <div className='mt-4 space-y-5'>
          {provinces.map((province) => (
            <div key={province.id}>
              <h3 className='font-medium'>{province.name} <span className='text-muted-foreground text-xs'>{province.code}</span></h3>
              <div className='mt-2 divide-border divide-y'>
                {province.cities.map((city) => (
                  <div key={city.id} className='flex items-center justify-between gap-4 py-2 text-sm'>
                    <span>{city.name} <span className='text-muted-foreground font-mono text-xs'>/{city.slug}</span></span>
                    <form action={async () => { 'use server'; await setAdminCityActive(city.id, !city.isActive); }}>
                      <Button type='submit' variant='outline' size='sm'>
                        {city.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const selectClass = 'border-input bg-background h-11 w-full rounded-xl border px-3 text-sm';
const textareaClass = 'border-input bg-background w-full rounded-xl border px-3 py-2 text-sm';
