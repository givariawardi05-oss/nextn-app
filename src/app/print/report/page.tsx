'use client';
import React, { useEffect, useState } from 'react';
import { getAllData } from '@/lib/local-storage-helpers';
import type { GlobalData, SalesInvoice, WarehouseItem, RoastedInventoryItem, StoreInventoryItem } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function PrintableReportPage() {
  const [data, setData] = useState<GlobalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const allData = await getAllData();
      // Ensure all data is present
      const fullData: GlobalData = {
        ...allData,
        transactions: allData.transactions || [],
        salesInvoices: allData.salesInvoices || [],
        purchaseInvoices: allData.purchaseInvoices || [],
        roastingBatches: allData.roastingBatches || [],
        currentBalance: 0, // calculated later if needed
        accountBalances: {}, // Add missing property
        nextIds: { purchaseInvoice: '', roastingBatch: '', salesInvoice: ''}
      };
      setData(fullData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading && data) {
        // Automatically trigger print dialog
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, data]);

  if (isLoading || !data) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { settings, salesInvoices, warehouseData, roastedInventory, storeInventory } = data;

  return (
    <div className="bg-white text-black p-8 font-sans max-w-4xl mx-auto print:p-0">
      <header className="flex justify-between items-start mb-8 border-b pb-6">
        <div>
            <div className="flex items-center gap-4 mb-4">
                {settings?.company_logo ? (
                    <Image src={settings.company_logo} alt="Company Logo" width={100} height={100} className="object-contain h-16 w-auto" />
                ) : (
                    <div className="flex size-12 items-center justify-center rounded-lg bg-gray-800 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-7"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z"/><path d="M6 1V4m4-3v3m4-3v3"/></svg>
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{settings?.company_name || 'BlackHorse Roastery'}</h1>
                    <p className="text-sm text-gray-500 whitespace-pre-line">{settings?.company_address || 'Jl. Kopi No. 123, Kota Kopi, Indonesia'}</p>
                </div>
            </div>
        </div>
        <div className="text-right flex-shrink-0">
            <h1 className="text-4xl font-bold text-gray-800 uppercase tracking-wider">Laporan</h1>
            <div className="space-y-1 mt-2 text-sm">
                <p><span className="font-semibold">Tanggal Cetak:</span> {new Date().toLocaleDateString('id-ID')}</p>
            </div>
        </div>
      </header>
      
      <main className="space-y-8">
        <section>
            <h2 className="text-xl font-bold mb-3 border-b pb-2">Detail Penjualan</h2>
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
                {salesInvoices.length > 0 ? salesInvoices.map(inv => (
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
        </section>

        <section>
            <h2 className="text-xl font-bold mb-3 border-b pb-2">Stok Gudang Green Beans</h2>
            <Table>
                <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead className="text-right">Stok (Kg)</TableHead><TableHead className="text-right">Avg. HPP</TableHead></TableRow></TableHeader>
                <TableBody>
                {warehouseData.length > 0 ? warehouseData.map(item => (
                    <TableRow key={item.id}><TableCell>{item.Nama_Green_Beans}</TableCell><TableCell className="text-right">{item.Stock_Kg.toFixed(2)}</TableCell><TableCell className="text-right">{formatRupiah(item.Avg_HPP)}</TableCell></TableRow>
                )) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">Stok gudang kosong.</TableCell></TableRow>)}
                </TableBody>
            </Table>
        </section>

        <section>
            <h2 className="text-xl font-bold mb-3 border-b pb-2">Stok Gudang Roasted</h2>
            <Table>
                <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead className="text-right">Stok (Kg)</TableHead><TableHead className="text-right">HPP/Kg</TableHead></TableRow></TableHeader>
                <TableBody>
                {roastedInventory.length > 0 ? roastedInventory.map(item => (
                    <TableRow key={item.id}><TableCell>{item.Produk_Roasting}</TableCell><TableCell className="text-right">{item.Stock_Kg.toFixed(2)}</TableCell><TableCell className="text-right">{formatRupiah(item.HPP_Per_Kg)}</TableCell></TableRow>
                )) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">Stok roasted kosong.</TableCell></TableRow>)}
                </TableBody>
            </Table>
        </section>

        <section>
            <h2 className="text-xl font-bold mb-3 border-b pb-2">Inventaris Toko</h2>
            <Table>
                <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead>Kategori</TableHead><TableHead className="text-right">Stok (Kg)</TableHead><TableHead className="text-right">Harga Jual</TableHead></TableRow></TableHeader>
                <TableBody>
                {storeInventory.length > 0 ? storeInventory.map(item => (
                    <TableRow key={item.id}>
                        <TableCell>{item.Nama_Produk}</TableCell>
                        <TableCell><Badge variant="outline">{item.Kategori}</Badge></TableCell>
                        <TableCell className="text-right">{item.Stock_Kg.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{formatRupiah(item.Harga_Jual_Kg)}</TableCell>
                    </TableRow>
                )) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">Stok toko kosong.</TableCell></TableRow>)}
                </TableBody>
            </Table>
        </section>
      </main>

       <div className="text-center mt-16 text-xs text-gray-400">
        <p>Laporan ini dibuat secara otomatis oleh sistem BlackHorse Roastery Manager.</p>
      </div>

      <div className="fixed bottom-4 right-4 no-print">
        <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak Ulang
        </Button>
      </div>
    </div>
  );
}
