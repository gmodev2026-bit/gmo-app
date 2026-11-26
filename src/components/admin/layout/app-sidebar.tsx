'use client';

import * as React from 'react';
import {
  BarChart,
  CalendarClock,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Newspaper,
  Settings,
  Users
} from 'lucide-react';

import { NavMain } from '@/components/admin/layout/nav-main';
import { NavSecondary } from '@/components/admin/layout/nav-secondary';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import Link from 'next/link';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: LayoutDashboard
    },
    {
      title: 'Enquiries',
      url: '/admin/enquiries',
      icon: ClipboardList
    },
    {
      title: 'Suppliers',
      url: '/admin/suppliers',
      icon: Users
    },
    {
      title: 'Catalog',
      url: '/admin/catalog',
      icon: Newspaper
    },
    {
      title: 'Follow-ups',
      url: '/admin/follow-ups',
      icon: CalendarClock
    },
    {
      title: 'Outbox',
      url: '/admin/outbox',
      icon: ClipboardList
    },
    {
      title: 'Audit log',
      url: '/admin/audit',
      icon: ClipboardList
    },
    {
      title: 'Pilot readiness',
      url: '/admin/readiness',
      icon: ClipboardList
    },
    {
      title: 'Suscriptions',
      url: '#',
      icon: CreditCard
    },
    {
      title: 'Documents',
      url: '#',
      icon: Newspaper
    }
  ],
  navSecondary: [
    {
      title: 'Analytics',
      url: '#',
      icon: BarChart
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings
    }
  ]
};

export function AppSidebar({
  userSlot,
  ...props
}: React.ComponentProps<typeof Sidebar> & { userSlot: React.ReactNode }) {
  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className='data-[slot=sidebar-menu-button]:p-1.5!'>
              <Link href='/'>
                <span className='text-base font-semibold'>Admin Panel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <React.Suspense
          fallback={
            <p
              className='text-muted-foreground px-4 py-3 text-xs'
              role='status'
            >
              Loading navigation…
            </p>
          }
        >
          <NavMain items={data.navMain} />
        </React.Suspense>
        <NavSecondary items={data.navSecondary} />
      </SidebarContent>
      <SidebarFooter>{userSlot}</SidebarFooter>
    </Sidebar>
  );
}
