'use client';

import { NavMain } from '@/components/dashboard/layout/nav-main';
import { NavSecondary } from '@/components/dashboard/layout/nav-secondary';
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
import {
  CreditCard,
  LayoutDashboard,
  FolderOpen,
  HelpCircle,
  Lock,
  Meh,
  Settings,
  UserRound,
  Users,
  ClipboardList
} from 'lucide-react';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard
    },
    {
      title: 'Supplier profile',
      url: '/dashboard/supplier',
      icon: Users
    },
    {
      title: 'My profile',
      url: '/dashboard/client',
      icon: UserRound
    },
    {
      title: 'My enquiries',
      url: '/dashboard/enquiries',
      icon: ClipboardList
    },
    {
      title: 'Projects',
      url: '#',
      icon: FolderOpen
    },
    {
      title: 'Billing',
      url: '#',
      icon: CreditCard
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings
    },
    {
      title: 'Get Help',
      url: '#',
      icon: HelpCircle
    }
  ],
  navSecondary: [
    {
      title: 'Unauthorized',
      url: '/admin',
      icon: Lock
    },
    {
      title: 'Not Found',
      url: '/non-existent-page',
      icon: Meh
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
                <span className='text-base font-semibold'>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>{userSlot}</SidebarFooter>
    </Sidebar>
  );
}
