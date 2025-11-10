
'use client';
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/stat-card';
import { formatRupiah } from '@/lib/utils';
import type { GlobalData, Asset, StorableGlobalData } from '@/lib/definitions';
import { PlusCircle, DollarSign, Building } from 'lucide-react';
import { AssetForm } from './asset-form';

interface AssetsProps {
  data: GlobalData;
  onDataChange: (data: StorableGlobalData) => void;
}

export function Assets({ data, onDataChange }: AssetsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const processedAssets = useMemo(() => (data.assetsData || []).map(asset => {
    const purchaseValue = asset.Nilai_Perolehan || 0;
    const depreciationAnnual = asset.Penyusutan_Tahun || 0;
    if (depreciationAnnual === 0) return { ...asset, bookValue: purchaseValue };

    const acquisitionDate = new Date(asset.Tgl_Perolehan);
    const today = new Date();
    const yearsHeld = (today.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const accumulatedDepreciation = depreciationAnnual * yearsHeld;
    const bookValue = Math.max(0, purchaseValue - accumulatedDepreciation);
    return { ...asset, bookValue };
  }), [data.assetsData]);
  
  const stats = useMemo(() => {
    let totalCurrentAssets = 0;
    let totalFixedAssets = 0;
    processedAssets.forEach(asset => {
        if (asset.Kategori.toLowerCase() === 'fixed') {
            totalFixedAssets += asset.bookValue;
        } else {
            totalCurrentAssets += asset.bookValue;
        }
    });
    return { totalCurrentAssets, totalFixedAssets, totalAllAssets: totalCurrentAssets + totalFixedAssets };
  }, [processedAssets]);
  
  const handleFormSubmit = (newData: StorableGlobalData) => {
    onDataChange(newData);
    setIsDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Aset</h2>
          <p className="text-muted-foreground">Kelola semua aset perusahaan dan hitung penyusutan.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Aset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Aset Baru</DialogTitle>
              <DialogDescription>Isi formulir di bawah ini untuk menambahkan aset baru ke dalam sistem.</DialogDescription>
            </DialogHeader>
            <AssetForm onFormSubmit={handleFormSubmit} currentData={data} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Aset</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Nama Aset</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Tgl Perolehan</TableHead>
                            <TableHead>Nilai Perolehan</TableHead>
                            <TableHead>Penyusutan/Tahun</TableHead>
                            <TableHead>Nilai Buku</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {processedAssets.length > 0 ? (
                            processedAssets.map((asset) => (
                            <TableRow key={asset.id}>
                                <TableCell className="font-medium">{asset.Nama_Aset}</TableCell>
                                <TableCell>{asset.Kategori}</TableCell>
                                <TableCell>{new Date(asset.Tgl_Perolehan).toLocaleDateString('id-ID')}</TableCell>
                                <TableCell className="text-right">{formatRupiah(asset.Nilai_Perolehan)}</TableCell>
                                <TableCell className="text-right">{formatRupiah(asset.Penyusutan_Tahun)}</TableCell>
                                <TableCell className="font-semibold text-right">{formatRupiah(asset.bookValue)}</TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">Belum ada data aset.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
            <StatCard title="Total Aset Lancar" value={formatRupiah(stats.totalCurrentAssets)} icon={<DollarSign />} colorClass="text-green-500" />
            <StatCard title="Total Aset Tetap (Nilai Buku)" value={formatRupiah(stats.totalFixedAssets)} icon={<Building />} colorClass="text-orange-500" />
            <StatCard title="Total Semua Aset" value={formatRupiah(stats.totalAllAssets)} icon={<DollarSign />} colorClass="text-blue-500" />
        </div>
      </div>

    </div>
  );
}
