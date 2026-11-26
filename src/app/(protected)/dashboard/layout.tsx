import { AppSidebar } from '@/components/dashboard/layout/app-sidebar';
import { NavUser, NavUserSkeleton } from '@/components/dashboard/layout/nav-user';
import { SiteHeader } from '@/components/dashboard/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { isAuthenticated } from '@/server/user';
import { userType } from '@/types/user';
import { Suspense } from 'react';

export default function DashboardLayout({
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
