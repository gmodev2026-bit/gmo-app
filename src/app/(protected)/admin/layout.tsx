import { AppSidebar } from '@/components/admin/layout/app-sidebar';
import { NavUser, NavUserSkeleton } from '@/components/admin/layout/nav-user';
import { SiteHeader } from '@/components/admin/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { isAuthenticated } from '@/server/user';
import { userType } from '@/types/user';
import { Suspense } from 'react';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar
        variant='inset'
        userSlot={
          <Suspense fallback={<NavUserSkeleton />}>
            <SidebarWithUser />
          </Suspense>
        }
      />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

async function SidebarWithUser() {
  const session = await isAuthenticated();

  return session ? <NavUser user={session.user as userType} /> : null;
}
