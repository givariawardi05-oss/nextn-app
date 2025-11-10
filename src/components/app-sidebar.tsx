
"use client";

import React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    LayoutDashboard,
    ShoppingCart,
    Warehouse,
    Flame,
    Package,
    Store,
    FileText,
    BookCopy,
    Building2,
    Scale,
    Settings,
    Database,
    Coffee,
    LogOut,
    BarChart3
} from 'lucide-react';
import type { SectionName } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface AppSidebarProps {
  activeSection: SectionName;
  setActiveSection: (section: SectionName) => void;
  logo?: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Penjualan', icon: FileText },
  { id: 'purchases', label: 'Pembelanjaan', icon: ShoppingCart },
  { type: 'separator', id: 'sep1' },
  { id: 'roasting', label: 'Roasting', icon: Flame },
  { id: 'warehouse', label: 'Gudang Green Bean', icon: Warehouse },
  { id: 'roasted-inventory', label: 'Gudang Roasted', icon: Package },
  { id: 'store-inventory', label: 'Inventaris Toko', icon: Store },
  { type: 'separator', id: 'sep2' },
  { id: 'transactions', label: 'Buku Besar', icon: BookCopy },
  { id: 'balance-sheet', label: 'Neraca', icon: Scale },
  { id: 'assets', label: 'Aset', icon: Building2 },
  { id: 'reports', label: 'Laporan', icon: BarChart3 },
];

export function AppSidebar({ activeSection, setActiveSection, logo }: AppSidebarProps) {
  const { setOpen } = useSidebar();
  const auth = useAuth();
  const router = useRouter();
  
  const handleSectionClick = (section: SectionName) => {
    setActiveSection(section);
    if (setOpen) {
      setOpen(false); // Close sidebar on mobile after clicking an item
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary">
                {logo ? (
                    <Image src={logo} alt="Company Logo" width={32} height={32} className="object-contain rounded-sm" />
                ) : (
                    <Coffee className="size-6 text-primary-foreground" />
                )}
            </div>
            <div>
                <h1 className="font-bold text-xl text-sidebar-foreground">BlackHorse</h1>
                <p className="text-sm text-sidebar-foreground/70 -mt-1">Roastery</p>
            </div>
        </div>
      </SidebarHeader>
      <ScrollArea className="flex-1">
        <SidebarMenu>
          {navItems.map((item) => {
              if (item.type === 'separator') {
                  return <SidebarSeparator key={item.id} className="my-1" />;
              }
              const Icon = item.icon;
              if (!Icon) return null; // Safety check in case an item is missing an icon

              return (
                  <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                      onClick={() => handleSectionClick(item.id as SectionName)}
                      isActive={activeSection === item.id}
                      className='justify-start'
                      >
                      <Icon className="size-5" />
                      <span>{item.label}</span>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              );
          })}
        </SidebarMenu>
      </ScrollArea>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenuItem>
            <SidebarMenuButton
                onClick={() => handleSectionClick('settings')}
                isActive={activeSection === 'settings'}
                className='justify-start'
            >
                <Settings className="size-5" />
                <span>Pengaturan</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton
                onClick={handleLogout}
                className='justify-start text-red-400 hover:bg-red-900/50 hover:text-red-300'
            >
                <LogOut className="size-5" />
                <span>Logout</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
}
