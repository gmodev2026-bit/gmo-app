import { PageSkeleton } from '@/components/shared/page-skeleton';
import { requireAdmin } from '@/server/authorization';
import { Suspense } from 'react';

// Pages render independently of their layout, so the layout cannot protect
// them: every admin page must wrap its content in <AdminGate>.
export function AdminGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RequireAdmin>{children}</RequireAdmin>
    </Suspense>
  );
}

async function RequireAdmin({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
