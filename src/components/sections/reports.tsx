'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRupiah } from '@/lib/utils';
import type { GlobalData, Transaction, WarehouseItem, RoastedInventoryItem, StoreInventoryItem } from '@/lib/definitions';
import { Printer } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ReportsProps {
  data: GlobalData;
}

export function Reports({ data }: ReportsProps) {
  
  const handlePrint = () => {
    const url = `/print/report`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan Operasional</h2>
          <p className="text-muted-foreground">Ringkasan detail dari semua aktivitas bisnis.</p>
        </div>
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak Laporan
        </Button>
      </header>

      <Card>
        <CardHeader><CardTitle>Detail Penjualan</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.salesInvoices.length > 0 ? data.salesInvoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.No_Invoice}</TableCell>
                  <TableCell>{inv.Customer}</TableCell>
                  <TableCell>{new Date(inv.Tanggal).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="text-right">{formatRupiah(inv.Total_Invoice)}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Belum ada penjualan.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Stok Gudang Green Beans</CardTitle></CardHeader>
          <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead className="text-right">Stok (Kg)</TableHead></TableRow></TableHeader>
                <TableBody>
                {data.warehouseData.length > 0 ? data.warehouseData.map(item => (
                    <TableRow key={item.id}><TableCell>{item.Nama_Green_Beans}</TableCell><TableCell className="text-right">{item.Stock_Kg.toFixed(2)}</TableCell></TableRow>
                )) : (<TableRow><TableCell colSpan={2} className="h-24 text-center">Stok gudang kosong.</TableCell></TableRow>)}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Stok Gudang Roasted</CardTitle></CardHeader>
          <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead className="text-right">Stok (Kg)</TableHead></TableRow></TableHeader>
                <TableBody>
                {data.roastedInventory.length > 0 ? data.roastedInventory.map(item => (
                    <TableRow key={item.id}><TableCell>{item.Produk_Roasting}</TableCell><TableCell className="text-right">{item.Stock_Kg.toFixed(2)}</TableCell></TableRow>
                )) : (<TableRow><TableCell colSpan={2} className="h-24 text-center">Stok roasted kosong.</TableCell></TableRow>)}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader><CardTitle>Stok Inventaris Toko</CardTitle></CardHeader>
          <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead>Kategori</TableHead><TableHead className="text-right">Stok (Kg)</TableHead></TableRow></TableHeader>
                <TableBody>
                {data.storeInventory.length > 0 ? data.storeInventory.map(item => (
                    <TableRow key={item.id}>
                        <TableCell>{item.Nama_Produk}</TableCell>
                        <TableCell><Badge variant={item.Kategori === 'Blend' ? 'default' : 'secondary'}>{item.Kategori}</Badge></TableCell>
                        <TableCell className="text-right">{item.Stock_Kg.toFixed(2)}</TableCell>
                    </TableRow>
                )) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">Stok toko kosong.</TableCell></TableRow>)}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
