
"use client";
import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Download, Upload, Sparkles, Loader2 } from 'lucide-react';
import { writeAllData } from '@/lib/local-storage-helpers';
import type { GlobalData, StorableGlobalData } from '@/lib/definitions';
import { SubmitButton } from '../submit-button';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseApp } from '@/firebase';
import { fetchAllData } from '@/lib/data';

interface SyncProps {
  currentData: GlobalData;
  onDataChange: (data: StorableGlobalData) => void;
}

export function Sync({ currentData, onDataChange }: SyncProps) {
  const [isResetPending, startResetTransition] = useTransition();
  const { toast } = useToast();
  const firebaseApp = useFirebaseApp();

  const [theme, setTheme] = useState('seafood');
  const [suggestion, setSuggestion] = useState('');
  const [isGenkitLoading, setIsGenkitLoading] = useState(false);
  const [genkitError, setGenkitError] = useState('');


  const handleExport = async () => {
    const dataToExport: StorableGlobalData = {
        warehouseData: currentData.warehouseData,
        roastingBatches: currentData.roastingBatches,
        roastedInventory: currentData.roastedInventory,
        storeInventory: currentData.storeInventory,
        salesInvoices: currentData.salesInvoices,
        purchaseInvoices: currentData.purchaseInvoices,
        transactions: currentData.transactions,
        assetsData: currentData.assetsData,
        settings: currentData.settings,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `blackhorse_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast({ title: "Ekspor Berhasil", description: "Data Anda telah diekspor ke file JSON." });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File is not a valid text file.");
            const importedData: StorableGlobalData = JSON.parse(text);
            
            if (importedData.settings && Array.isArray(importedData.transactions)) {
                onDataChange(importedData);
                toast({ title: "Impor Berhasil", description: "Data berhasil dipulihkan." });
            } else {
                throw new Error("Invalid data structure in JSON file.");
            }
        } catch (err: any) {
            toast({ title: "Impor Gagal", description: err.message, variant: "destructive" });
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const handleReset = () => {
    startResetTransition(async () => {
      try {
        const newDb: StorableGlobalData = {
          warehouseData: [],
          roastingBatches: [],
          roastedInventory: [],
          storeInventory: [],
          salesInvoices: [],
          purchaseInvoices: [],
          transactions: [],
          assetsData: [],
          settings: currentData.settings,
        };
        onDataChange(newDb);
        toast({
          title: 'Reset Berhasil',
          description: 'Semua data transaksi berhasil direset!',
        });
      } catch (e: any) {
        toast({
          title: 'Reset Gagal',
          description: e.message || 'Terjadi kesalahan saat mereset data.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleGetSuggestion = async () => {
    setIsGenkitLoading(true);
    setSuggestion('');
    setGenkitError('');
    try {
      const functions = getFunctions(firebaseApp);
      const menuSuggestion = httpsCallable(functions, 'menuSuggestion');
      const response = await menuSuggestion({ data: theme });
      const result = response.data as any; 
      setSuggestion(result.data); 
    } catch (error: any) {
      console.error("Cloud function error:", error);
      setGenkitError(error.message || "Gagal memanggil fungsi. Cek konsol untuk detail.");
    } finally {
      setIsGenkitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sinkronisasi & Alat</h2>
        <p className="text-muted-foreground">Pengelolaan data lokal dan alat pengembang.</p>
      </div>

       <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Impor / Ekspor Data Lokal</CardTitle>
          <CardDescription>Simpan cadangan data Anda atau pulihkan dari file.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button onClick={handleExport}>
                <Download className='mr-2 h-4 w-4' /> Ekspor Data ke JSON
            </Button>
            <Button asChild>
                <label htmlFor="import-file">
                    <Upload className="mr-2 h-4 w-4" /> Impor Data dari JSON
                    <input type="file" id="import-file" accept=".json" className="sr-only" onChange={handleImport} />
                </label>
            </Button>
        </CardContent>
      </Card>
      
       <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Uji Coba Cloud Function (Genkit)</CardTitle>
          <CardDescription>Panggil fungsi `menuSuggestion` yang berjalan di server untuk mendapatkan saran menu dari AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex w-full items-center space-x-2">
              <Input 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Masukkan tema restoran..."
              />
              <Button onClick={handleGetSuggestion} disabled={isGenkitLoading}>
                {isGenkitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className='mr-2 h-4 w-4' />}
                Dapatkan Saran
              </Button>
            </div>
            {isGenkitLoading && (
              <div className="text-sm text-muted-foreground flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghubungi AI di server...
              </div>
            )}
            {suggestion && (
              <div className="p-4 bg-secondary rounded-md">
                <p className="font-semibold">Saran dari AI:</p>
                <p className="text-lg">{suggestion}</p>
              </div>
            )}
            {genkitError && (
              <div className="p-3 bg-destructive/20 text-destructive rounded-md text-sm">
                <p className="font-bold">Terjadi Error:</p>
                <p>{genkitError}</p>
              </div>
            )}
        </CardContent>
      </Card>


      <Card className="max-w-2xl border-destructive">
        <CardHeader>
          <CardTitle className='text-destructive'>Zona Berbahaya</CardTitle>
          <CardDescription>Gunakan alat ini dengan hati-hati. Tindakan tidak dapat dibatalkan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <AlertTriangle className="mr-2 h-4 w-4" /> Reset SEMUA Data Transaksi
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apakah Anda Benar-Benar Yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini akan menghapus SEMUA data transaksi dari penyimpanan lokal (pembelian, penjualan, roasting, dll). Pengaturan akan tetap ada. Tindakan ini TIDAK DAPAT DIBATALKAN.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction asChild>
                    <SubmitButton onClick={handleReset} variant="destructive" pending={isResetPending} pendingText="Mereset...">
                        Ya, Hapus Semua Data
                    </SubmitButton>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
