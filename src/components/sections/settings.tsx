
"use client";
import React, { useActionState, useEffect, useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/submit-button';
import { saveSettings, createBankAccount } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { GlobalData, BankAccount, StorableGlobalData } from '@/lib/definitions';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Banknote, Landmark, PlusCircle, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatRupiah } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface SettingsProps {
  data: GlobalData;
  onDataChange: (data: StorableGlobalData) => void;
}

const settingsSchema = z.object({
  company_name: z.string().min(1, 'Nama perusahaan wajib diisi'),
  stock_low_limit: z.coerce.number().min(0, 'Batas stok tidak boleh negatif'),
  modal_awal: z.coerce.number().min(0, 'Modal awal tidak boleh negatif'),
  company_address: z.string().optional(),
  invoice_notes: z.string().optional(),
  company_logo: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const bankAccountSchema = z.object({
    accountName: z.string().min(1, "Nama akun wajib diisi"),
    bankName: z.string().min(1, "Nama bank wajib diisi"),
    accountNumber: z.string().optional(),
    balance: z.coerce.number().min(0, "Saldo awal tidak boleh negatif"),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

function BankAccountForm({ onFormSubmit, currentData }: { onFormSubmit: SettingsProps['onDataChange'], currentData: GlobalData }) {
    const [state, formAction, isPending] = useActionState(createBankAccount, null);
    const { toast } = useToast();
    const [isTransitioning, startTransition] = useTransition();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<BankAccountFormValues>({
        resolver: zodResolver(bankAccountSchema),
        defaultValues: { balance: 0 }
    });
    
    useEffect(() => {
        if (!state) return;
        if (state.status === 'success' && state.data) {
            toast({ title: 'Sukses!', description: state.message });
            onFormSubmit(state.data);
            reset();
        } else {
            toast({ title: 'Error!', description: state.message, variant: 'destructive' });
        }
    }, [state, onFormSubmit, reset, toast]);

    const onFormSubmitWithData = (data: BankAccountFormValues) => {
        startTransition(() => {
            const payload = new FormData();
            Object.entries(data).forEach(([key, value]) => payload.append(key, String(value)));
            payload.append('currentData', JSON.stringify(currentData));
            formAction(payload);
        });
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmitWithData)} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="bankName">Nama Bank</Label>
                    <Input id="bankName" {...register('bankName')} placeholder="Contoh: BCA" />
                    {errors.bankName && <p className="text-sm text-destructive mt-1">{errors.bankName.message}</p>}
                </div>
                <div>
                    <Label htmlFor="accountName">Nama Akun/Pemilik</Label>
                    <Input id="accountName" {...register('accountName')} placeholder="Contoh: PT Kopi Sejahtera" />
                    {errors.accountName && <p className="text-sm text-destructive mt-1">{errors.accountName.message}</p>}
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="accountNumber">Nomor Rekening</Label>
                    <Input id="accountNumber" {...register('accountNumber')} />
                </div>
                <div>
                    <Label htmlFor="balance">Saldo Awal (Rp)</Label>
                    <Input id="balance" type="number" {...register('balance')} />
                    {errors.balance && <p className="text-sm text-destructive mt-1">{errors.balance.message}</p>}
                </div>
             </div>
            <div className="pt-4 flex justify-end">
                <SubmitButton pending={isPending || isTransitioning} pendingText="Menyimpan...">Simpan Akun</SubmitButton>
            </div>
        </form>
    );
}


export function Settings({ data, onDataChange }: SettingsProps) {
  const [state, formAction, isPending] = useActionState(saveSettings, null);
  const { toast } = useToast();
  const [isTransitioning, startTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState(data.settings.company_logo || '');
  const [isBankFormOpen, setIsBankFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: data.settings.company_name || 'BlackHorse Roastery',
      stock_low_limit: data.settings.stock_low_limit || 10,
      modal_awal: data.settings.modal_awal || 0,
      company_address: data.settings.company_address || 'Jl. Kopi No. 123, Kota Kopi, Indonesia',
      invoice_notes: data.settings.invoice_notes || 'Pembayaran dapat dilakukan melalui transfer ke:\nBank Kopi Indonesia - 123-456-7890\na.n. BlackHorse Roastery',
      company_logo: data.settings.company_logo || '',
    },
  });
  
  useEffect(() => {
    if (data.settings.company_logo) {
      setLogoPreview(data.settings.company_logo);
      setValue('company_logo', data.settings.company_logo);
    }
  }, [data.settings.company_logo, setValue]);

  useEffect(() => {
    if (!state) return;
    if (state.status === 'success' && state.data) {
      toast({ title: 'Sukses!', description: state.message });
      onDataChange(state.data);
    } else if (state.status === 'error') {
      toast({
        title: 'Error!',
        description: state.message || 'Terjadi kesalahan saat menyimpan.',
        variant: 'destructive',
      });
    }
  }, [state, onDataChange, toast]);
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setValue('company_logo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFormSubmitWithData = (formData: SettingsFormValues) => {
    startTransition(() => {
        const payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if(value !== undefined) payload.append(key, String(value));
        });
        payload.append('currentData', JSON.stringify(data));
        formAction(payload);
    });
  }

  const handleBankFormSubmit = (newData: StorableGlobalData) => {
      onDataChange(newData);
      setIsBankFormOpen(false);
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmitWithData)} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
        <p className="text-muted-foreground">Konfigurasi sistem, informasi perusahaan, dan akun bank.</p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Akun Finansial (Kas & Bank)</CardTitle>
              <CardDescription>Kelola sumber dana untuk transaksi.</CardDescription>
            </div>
            <Dialog open={isBankFormOpen} onOpenChange={setIsBankFormOpen}>
                <DialogTrigger asChild>
                    <Button type='button' variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Akun Bank
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Tambah Akun Bank Baru</DialogTitle>
                        <DialogDescription>
                            Akun ini akan muncul sebagai opsi pembayaran saat transaksi.
                        </DialogDescription>
                    </DialogHeader>
                    <BankAccountForm onFormSubmit={handleBankFormSubmit} currentData={data} />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Akun</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>No. Rekening</TableHead>
                        <TableHead className="text-right">Saldo Saat Ini</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium flex items-center gap-2"><Banknote /> Cash (Kas)</TableCell>
                        <TableCell>N/A</TableCell>
                        <TableCell>N/A</TableCell>
                        <TableCell className="text-right font-semibold">{formatRupiah(data.accountBalances?.['cash'] || 0)}</TableCell>
                    </TableRow>
                    {(data.settings.bankAccounts || []).map((acc: BankAccount) => (
                         <TableRow key={acc.id}>
                            <TableCell className="font-medium flex items-center gap-2"><Landmark /> {acc.accountName}</TableCell>
                            <TableCell>{acc.bankName}</TableCell>
                            <TableCell>{acc.accountNumber}</TableCell>
                            <TableCell className="text-right font-semibold">{formatRupiah(data.accountBalances?.[acc.id] || 0)}</TableCell>
                        </TableRow>
                    ))}
                    {(!data.settings.bankAccounts || data.settings.bankAccounts.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">Belum ada akun bank ditambahkan.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi &amp; Konfigurasi Sistem</CardTitle>
              <CardDescription>Perubahan pada pengaturan ini akan mempengaruhi kalkulasi di seluruh sistem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="company_name">Nama Perusahaan</Label>
                <Input id="company_name" {...register('company_name')} />
                {errors.company_name && <p className="text-sm text-destructive mt-1">{errors.company_name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="stock_low_limit">Batas Stok Rendah (kg)</Label>
                  <Input id="stock_low_limit" type="number" {...register('stock_low_limit')} />
                  {errors.stock_low_limit && <p className="text-sm text-destructive mt-1">{errors.stock_low_limit.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Peringatan akan muncul jika stok di bawah nilai ini.</p>
                </div>
                <div>
                  <Label htmlFor="modal_awal">Modal Awal (di akun Kas)</Label>
                  <Input id="modal_awal" type="number" {...register('modal_awal')} />
                  {errors.modal_awal && <p className="text-sm text-destructive mt-1">{errors.modal_awal.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Hanya diisi 1x di awal, mempengaruhi Neraca.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Invoice</CardTitle>
              <CardDescription>Sesuaikan informasi yang muncul pada invoice cetak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div>
                  <Label htmlFor="company_address">Alamat Perusahaan</Label>
                  <Textarea id="company_address" {...register('company_address')} rows={3}/>
                  {errors.company_address && <p className="text-sm text-destructive mt-1">{errors.company_address.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="invoice_notes">Catatan/Info Pembayaran di Invoice</Label>
                  <Textarea id="invoice_notes" {...register('invoice_notes')} rows={4}/>
                  {errors.invoice_notes && <p className="text-sm text-destructive mt-1">{errors.invoice_notes.message}</p>}
                </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
              <CardHeader>
                  <CardTitle>Logo Perusahaan</CardTitle>
                  <CardDescription>Logo ini akan tampil di invoice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                      {logoPreview ? (
                          <Image src={logoPreview} alt="Logo Preview" width={150} height={84} className="object-contain" />
                      ) : (
                          <span className="text-muted-foreground text-sm">Pratinjau Logo</span>
                      )}
                  </div>
                  <Input id="company_logo_upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange}/>
                  <input type="hidden" {...register('company_logo')} />
                  <p className="text-xs text-muted-foreground mt-1">Gunakan format PNG transparan untuk hasil terbaik. Ukuran maks 500kb.</p>
              </CardContent>
          </Card>
        </div>
      </div>


      <div className="pt-4 flex justify-start">
        <SubmitButton pending={isPending || isTransitioning} pendingText="Menyimpan...">Simpan Semua Pengaturan</SubmitButton>
      </div>
    </form>
  );
}
