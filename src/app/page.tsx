'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import MainLayout from '@/components/main-layout';
import type { GlobalData } from '@/lib/definitions';
import { Loader2 } from 'lucide-react';

const getInitialData = (): GlobalData => ({
  warehouseData: [],
  roastingBatches: [],
  roastedInventory: [],
  storeInventory: [],
  salesInvoices: [],
  purchaseInvoices: [],
  transactions: [],
  assetsData: [],
  settings: {
    modal_awal: 0,
    company_name: 'BlackHorse Roastery',
    stock_low_limit: 10,
    bankAccounts: [],
  },
  nextIds: {
    purchaseInvoice: 'FP-001',
    roastingBatch: 'RB-001',
    salesInvoice: 'INV-001',
  },
  currentBalance: 0,
  accountBalances: { 'cash': 0 },
});

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const data = getInitialData();

  return (
    <SidebarProvider>
      <MainLayout initialData={data} />
    </SidebarProvider>
  );
}
