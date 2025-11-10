
'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatRupiah, cn } from '@/lib/utils';
import type { GlobalData, SalesInvoice, StoreInventoryItem, StorableGlobalData } from '@/lib/definitions';
import { PlusCircle, Printer } from 'lucide-react';
import { SalesForm } from './sales-form';

interface SalesProps {
  data: GlobalData;
  onDataChange: (data: StorableGlobalData) => void;
}

const statusVariant: { [key: string]: 'destructive' | 'secondary' | 'outline' } = {
    'Draft': 'secondary',
    'Sent': 'outline',
    'Paid': 'outline',
    'Lunas': 'outline',
    'Overdue': 'destructive'
};

const statusColor: { [key: string]: string } = {
    'Paid': 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-400',
    'Lunas': 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-400',
    'Sent': 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
    'Overdue': 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-400',
    'Draft': 'border-gray-400 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function Sales({ data, onDataChange }: SalesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const availableProducts: StoreInventoryItem[] = (data.storeInventory || []).filter(item => item.Stock_Kg > 0);
  
  const handleFormSubmit = (newData: StorableGlobalData) => {
    onDataChange(newData);
    setIsDialogOpen(false);
  }

  const handlePrint = (invoiceId: string) => {
    const url = `/print/invoice/${invoiceId}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoice Penjualan</h2>
          <p className="text-muted-foreground">Buat dan kelola invoice untuk pelanggan.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Buat Invoice Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Invoice Penjualan Baru</DialogTitle>
              <DialogDescription>
                Pilih produk dari inventaris toko. Stok akan otomatis terpotong saat invoice disimpan.
              </DialogDescription>
            </DialogHeader>
            <SalesForm
              nextInvoiceNumber={data.nextIds.salesInvoice}
              availableProducts={availableProducts}
              onFormSubmit={handleFormSubmit}
              currentData={data}
            />
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Riwayat Invoice Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.salesInvoices.length > 0 ? (
              data.salesInvoices.map((inv: SalesInvoice) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.No_Invoice}</TableCell>
                  <TableCell>{inv.Customer}</TableCell>
                  <TableCell>{new Date(inv.Tanggal).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{new Date(inv.Jatuh_Tempo).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="text-right">{formatRupiah(inv.Total_Invoice)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusVariant[inv.Status_Bayar] || 'secondary'} className={cn(statusColor[inv.Status_Bayar])}>
                      {inv.Status_Bayar}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handlePrint(inv.id)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Cetak
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Belum ada invoice penjualan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </div>
  );
}
