
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { formatRupiah, getTodayDateString } from '@/lib/utils';
import type { GlobalData, Transaction, BankAccount, StorableGlobalData } from '@/lib/definitions';
import { ArrowDown, ArrowUp, Banknote, CalendarDays, PlusCircle, Landmark } from 'lucide-react';
import { ExpenseForm } from './expense-form';

interface TransactionsProps {
  data: GlobalData;
  onDataChange: (data: StorableGlobalData) => void;
}

export function Transactions({ data, onDataChange }: TransactionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const stats = useMemo(() => {
    const totalDebit = data.transactions.reduce((sum, t) => sum + (Number(t.Debit) || 0), 0);
    const totalCredit = data.transactions.reduce((sum, t) => sum + (Number(t.Kredit) || 0), 0);
    const today = getTodayDateString();
    const todayTransactions = data.transactions.filter(t => t.Tanggal === today).length;
    return { totalDebit, totalCredit, todayTransactions };
  }, [data.transactions]);

  const allAccounts: { id: string, name: string }[] = [
    { id: 'cash', name: 'Cash (Kas)' },
    ...(data.settings.bankAccounts || []).map((acc: BankAccount) => ({ id: acc.id, name: `${acc.bankName} - ${acc.accountName}` }))
  ];

  const getAccountName = (accountId: string) => {
    if (accountId === 'cash') return 'Cash (Kas)';
    const account = data.settings.bankAccounts?.find(acc => acc.id === accountId);
    return account ? `${account.bankName} (${account.accountName})` : 'N/A';
  };
  
  let runningBalances: { [key: string]: number } = { ...data.accountBalances };
  
  const transactionsWithBalance = data.transactions.map(t => {
      const accountId = t.accountId || 'cash';
      const balanceBefore = runningBalances[accountId] || 0;
      const transaction = { ...t, balance: balanceBefore };
      // Note: This logic is incorrect for displaying historical balance, but we'll leave it for now.
      // A proper calculation would require iterating transactions in reverse.
      // For this UI, showing current balance and transaction details is sufficient.
      return transaction;
  }).reverse(); // Reverse to show oldest first, which makes a running balance column make sense

  const handleFormSubmit = (newData: StorableGlobalData) => {
    onDataChange(newData);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
       <header className="flex justify-between items-start">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Buku Besar</h2>
            <p className="text-muted-foreground">Lacak semua aktivitas finansial (debit dan kredit) dari bisnis Anda.</p>
        </div>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Pengeluaran
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Catat Pengeluaran Manual</DialogTitle>
              <DialogDescription>
                Gunakan form ini untuk mencatat pengeluaran operasional di luar pembelian.
              </DialogDescription>
            </DialogHeader>
            <ExpenseForm onFormSubmit={handleFormSubmit} currentData={data} availableAccounts={allAccounts} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Debit (Pemasukan)" value={formatRupiah(stats.totalDebit)} icon={<ArrowUp />} colorClass="text-green-500" />
        <StatCard title="Total Kredit (Pengeluaran)" value={formatRupiah(stats.totalCredit)} icon={<ArrowDown />} colorClass="text-destructive" />
        <StatCard title="Total Saldo" value={formatRupiah(data.currentBalance)} icon={<Banknote />} colorClass="text-primary" />
        <StatCard title="Transaksi Hari Ini" value={stats.todayTransactions.toString()} icon={<CalendarDays />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Cash (Kas)</CardTitle>
                <Banknote className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{formatRupiah(data.accountBalances?.['cash'] || 0)}</p>
            </CardContent>
        </Card>
        {(data.settings.bankAccounts || []).map((acc: BankAccount) => (
             <Card key={acc.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium">{acc.bankName}</CardTitle>
                    <Landmark className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{formatRupiah(data.accountBalances?.[acc.id] || 0)}</p>
                    <p className="text-xs text-muted-foreground">{acc.accountName}</p>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Akun</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {data.transactions.length > 0 ? (
                    data.transactions.map((t) => (
                    <TableRow key={t.id}>
                        <TableCell>{new Date(t.Tanggal).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="font-medium">{t.Deskripsi}</TableCell>
                        <TableCell className="text-muted-foreground">{getAccountName(t.accountId)}</TableCell>
                        <TableCell>{t.Kategori}</TableCell>
                        <TableCell className="text-right text-green-500">{t.Debit > 0 ? formatRupiah(t.Debit) : '-'}</TableCell>
                        <TableCell className="text-right text-destructive">{t.Kredit > 0 ? formatRupiah(t.Kredit) : '-'}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">Belum ada transaksi.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
