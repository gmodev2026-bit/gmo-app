export const PILOT_PROVINCE = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Gauteng',
  code: 'GP'
} as const;

export const PILOT_CITIES = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    name: 'Johannesburg',
    slug: 'johannesburg'
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    name: 'Pretoria',
    slug: 'pretoria'
  }
] as const;

export const HOME_REPAIRS_CATEGORY = {
  id: '20000000-0000-4000-8000-000000000001',
  name: 'Home repairs and maintenance',
  slug: 'home-repairs'
} as const;

export const PILOT_CATEGORIES = [
  {
    id: '20000000-0000-4000-8000-000000000002',
    name: 'Plumbing',
    slug: 'plumbing',
    sortOrder: 1
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    name: 'Electrical',
    slug: 'electrical',
    sortOrder: 2
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    name: 'Handyman',
    slug: 'handyman',
    sortOrder: 3
  }
] as const;
