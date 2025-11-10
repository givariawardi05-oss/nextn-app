
'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah } from '@/lib/utils';
import type { GlobalData, BankAccount } from '@/lib/definitions';
import { Banknote, Landmark } from 'lucide-react';

interface BalanceSheetProps {
  data: GlobalData;
}

export function BalanceSheet({ data }: BalanceSheetProps) {

  const neraca = useMemo(() => {
    // Aset Lancar
    const kas = data.accountBalances?.['cash'] || 0;
    const piutang = data.salesInvoices.filter(inv => inv.Status_Bayar !== 'Paid' && inv.Status_Bayar !== 'Lunas').reduce((sum, inv) => sum + (inv.Total_Invoice || 0), 0);
    const persediaan = data.warehouseData.reduce((sum, item) => sum + (item.Total_Value || 0), 0) +
                       data.roastedInventory.reduce((sum, item) => sum + (item.Total_Value || 0), 0) +
                       data.storeInventory.reduce((sum, item) => sum + (item.Total_Value || 0), 0);

    const bankAccounts = (data.settings.bankAccounts || []);
    const bankDetails = bankAccounts.map((acc: BankAccount) => ({
      name: `${acc.bankName} (${acc.accountName})`,
      balance: data.accountBalances?.[acc.id] || 0
    }));
    const totalBankBalance = bankDetails.reduce((sum, acc) => sum + acc.balance, 0);

    let currentAssetsNonStock = 0;
    data.assetsData.filter(a => a.Kategori.toLowerCase() === 'current').forEach(a => {
        // Exclude bank accounts from this calculation as they are handled separately
        if (!a.Nama_Aset.startsWith('Bank:')) {
            currentAssetsNonStock += a.Nilai_Perolehan;
        }
    });

    const totalAsetLancar = kas + totalBankBalance + piutang + persediaan + currentAssetsNonStock;

    // Aset Tetap
    let fixedAssetsValue = 0;
    const fixedAssetDetails = data.assetsData.filter(a => a.Kategori.toLowerCase() === 'fixed').map(asset => {
        const purchaseValue = asset.Nilai_Perolehan || 0;
        const depreciationAnnual = asset.Penyusutan_Tahun || 0;
        if (depreciationAnnual === 0) {
            fixedAssetsValue += purchaseValue;
            return { name: asset.Nama_Aset, bookValue: purchaseValue };
        };

        const acquisitionDate = new Date(asset.Tgl_Perolehan);
        const today = new Date();
        const yearsHeld = (today.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        const accumulatedDepreciation = depreciationAnnual * yearsHeld;
        const bookValue = Math.max(0, purchaseValue - accumulatedDepreciation);
        fixedAssetsValue += bookValue;
        return { name: asset.Nama_Aset, bookValue };
    });
    
    const totalAset = totalAsetLancar + fixedAssetsValue;
    
    // Kewajiban & Ekuitas
    const hutangDagang = 0; 
    const totalKewajiban = hutangDagang;

    const modalAwal = Number(data.settings.modal_awal) || 0;
    const labaDitahan = totalAset - totalKewajiban - modalAwal;
    const totalEkuitas = modalAwal + labaDitahan;
    const totalKewajibanEkuitas = totalKewajiban + totalEkuitas;

    return {
        kas, piutang, persediaan, bankDetails, totalBankBalance, totalAsetLancar, fixedAssetDetails,
        fixedAssetsValue, totalAset, hutangDagang, totalKewajiban, modalAwal, labaDitahan,
        totalEkuitas, totalKewajibanEkuitas
    };
  }, [data]);

  return (
    <div className="space-y-6">
       <div>
        <h2 className="text-3xl font-bold tracking-tight">Neraca (Laporan Posisi Keuangan)</h2>
        <p className="text-muted-foreground">Aset = Kewajiban + Ekuitas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">Aset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-3">Aset Lancar</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2"><Banknote className="h-4 w-4" /> Kas</span>
                    <span>{formatRupiah(neraca.kas)}</span>
                </div>
                 {neraca.bankDetails.map(acc => (
                    <div key={acc.name} className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><Landmark className="h-4 w-4" /> {acc.name}</span>
                        <span>{formatRupiah(acc.balance)}</span>
                    </div>
                ))}
                <div className="flex justify-between"><span>Piutang Dagang</span><span>{formatRupiah(neraca.piutang)}</span></div>
                <div className="flex justify-between"><span>Total Persediaan</span><span>{formatRupiah(neraca.persediaan)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-2 mt-2"><span>Total Aset Lancar</span><span>{formatRupiah(neraca.totalAsetLancar)}</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Aset Tetap (Nilai Buku)</h4>
              <div className="space-y-2 text-sm">
                {neraca.fixedAssetDetails.map(asset => (
                     <div key={asset.name} className="flex justify-between"><span>{asset.name}</span><span>{formatRupiah(asset.bookValue)}</span></div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-2 mt-2"><span>Total Aset Tetap</span><span>{formatRupiah(neraca.fixedAssetsValue)}</span></div>
              </div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-lg">
                <div className="flex justify-between font-bold text-lg text-green-700 dark:text-green-300">
                    <span>TOTAL ASET</span>
                    <span>{formatRupiah(neraca.totalAset)}</span>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Kewajiban & Ekuitas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Kewajiban</h4>
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Hutang Dagang</span><span>{formatRupiah(neraca.hutangDagang)}</span></div>
                        <div className="flex justify-between font-semibold border-t pt-2 mt-2"><span>Total Kewajiban</span><span>{formatRupiah(neraca.totalKewajiban)}</span></div>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-3">Ekuitas</h4>
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Modal Disetor</span><span>{formatRupiah(neraca.modalAwal)}</span></div>
                        <div className="flex justify-between"><span>Laba Ditahan</span><span>{formatRupiah(neraca.labaDitahan)}</span></div>
                        <div className="flex justify-between font-semibold border-t pt-2 mt-2"><span>Total Ekuitas</span><span>{formatRupiah(neraca.totalEkuitas)}</span></div>
                    </div>
                </div>
                <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">
                    <div className="flex justify-between font-bold text-lg text-red-700 dark:text-red-300">
                        <span>TOTAL KEWAJIBAN & EKUITAS</span>
                        <span>{formatRupiah(neraca.totalKewajibanEkuitas)}</span>
                    </div>
                </div>
                {Math.round(neraca.totalAset) !== Math.round(neraca.totalKewajibanEkuitas) && (
                    <div className="text-center text-destructive text-sm font-bold pt-4">
                        PERINGATAN: Total Aset ({formatRupiah(neraca.totalAset)}) tidak sama dengan Total Kewajiban & Ekuitas ({formatRupiah(neraca.totalKewajibanEkuitas)}). Selisih: {formatRupiah(neraca.totalAset - neraca.totalKewajibanEkuitas)}. Cek data Anda.
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
