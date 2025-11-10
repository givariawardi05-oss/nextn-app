
'use client';
import React, { useEffect, useState } from 'react';
import { getAllData } from '@/lib/local-storage-helpers';
import type { GlobalData, PurchaseInvoice } from '@/lib/definitions';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import Image from 'next/image';

export default function PrintablePurchaseInvoice() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [settings, setSettings] = useState<GlobalData['settings'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const data = await getAllData();
      const foundInvoice = data.purchaseInvoices.find(inv => inv.id === id);
      if (foundInvoice) {
        setInvoice(foundInvoice);
        setSettings(data.settings);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!isLoading && invoice) {
        // Automatically trigger print dialog
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, invoice]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    notFound();
    return null;
  }
  
  const grandTotal = invoice.Total_Faktur;

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
             <div className="text-sm">
                <h2 className="font-semibold text-gray-700">Supplier:</h2>
                <p className="font-medium text-lg">{invoice.Supplier}</p>
            </div>
        </div>
        <div className="text-right flex-shrink-0">
            <h1 className="text-4xl font-bold text-gray-800 uppercase tracking-wider">Faktur Pembelian</h1>
            <div className="space-y-1 mt-2 text-sm">
                <p><span className="font-semibold">No. Faktur:</span> {invoice.No_Faktur}</p>
                <p><span className="font-semibold">Tanggal:</span> {new Date(invoice.Tanggal).toLocaleDateString('id-ID')}</p>
            </div>
        </div>
      </header>
      
      <main className="mb-8">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 font-semibold">Produk</th>
              <th className="p-3 text-right font-semibold">Qty</th>
              <th className="p-3 text-right font-semibold">Harga</th>
              <th className="p-3 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">{item.name}</td>
                <td className="p-3 text-right">{item.qty} kg</td>
                <td className="p-3 text-right">{formatRupiah(item.price)}</td>
                <td className="p-3 text-right">{formatRupiah(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      <footer className="flex justify-end items-start">
        <div className="w-1/2 text-sm">
            <div className="flex justify-between font-bold text-lg bg-gray-100 p-3 rounded-md mt-2">
                <span>TOTAL</span>
                <span>{formatRupiah(grandTotal)}</span>
            </div>
        </div>
      </footer>
       <div className="text-center mt-16 text-xs text-gray-400">
        <p>Dokumen ini dicetak melalui sistem BlackHorse Roastery Manager.</p>
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
