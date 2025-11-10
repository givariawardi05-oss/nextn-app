
'use client';
import React, { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils';
import type { GlobalData, PurchaseInvoice, StorableGlobalData } from '@/lib/definitions';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Printer } from 'lucide-react';
import { PurchaseForm } from './purchase-form';
import { deletePurchase } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { SubmitButton } from '../submit-button';

interface PurchasesProps {
  data: GlobalData;
  onDataChange: (data: StorableGlobalData) => void;
}

export function Purchases({ data, onDataChange }: PurchasesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const { toast } = useToast();

  const handleFormSubmit = (newData: StorableGlobalData) => {
      onDataChange(newData);
      setIsFormOpen(false);
      setSelectedInvoice(null);
  }

  const handleDelete = (invoiceId: string) => {
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.append('currentData', JSON.stringify(data));
      formData.append('invoiceId', invoiceId);
      const result = await deletePurchase(null, formData);

      if (result.status === 'success' && result.data) {
          toast({ title: "Sukses!", description: result.message });
          onDataChange(result.data);
      } else {
          toast({ title: "Error!", description: result.message, variant: "destructive" });
      }
    });
  };
  
  const openEditDialog = (invoice: PurchaseInvoice) => {
      setSelectedInvoice(invoice);
      setIsFormOpen(true);
  }
  
  const openNewDialog = () => {
      setSelectedInvoice(null);
      setIsFormOpen(true);
  }
  
  const handlePrint = (invoiceId: string) => {
    const url = `/print/purchase/${invoiceId}`;
    window.open(url, '_blank');
  };


  useEffect(() => {
    if (!isFormOpen) {
      setSelectedInvoice(null);
    }
  }, [isFormOpen]);


  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Faktur Pembelanjaan</h2>
          <p className="text-muted-foreground">Catat semua pembelian green beans dari supplier.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Buat Faktur Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>{selectedInvoice ? 'Edit Faktur Pembelian' : 'Faktur Pembelanjaan Baru'}</DialogTitle>
              <DialogDescription>
                {selectedInvoice ? 'Ubah detail faktur di bawah ini.' : 'Isi detail pembelian di bawah ini. Stok akan otomatis masuk ke Gudang Green Beans.'}
              </DialogDescription>
            </DialogHeader>
            <PurchaseForm
              nextInvoiceNumber={data.nextIds.purchaseInvoice}
              onFormSubmit={handleFormSubmit}
              currentData={data}
              initialData={selectedInvoice}
            />
          </DialogContent>
        </Dialog>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Faktur Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Faktur</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.purchaseInvoices.length > 0 ? (
                data.purchaseInvoices.map((inv: PurchaseInvoice) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.No_Faktur}</TableCell>
                    <TableCell>{inv.Supplier}</TableCell>
                    <TableCell>{new Date(inv.Tanggal).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="text-right">{formatRupiah(inv.Total_Faktur)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-green-500 bg-green-900/20 text-green-400">
                        {inv.Status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePrint(inv.id)}>
                              <Printer className="mr-2 h-4 w-4" />
                              <span>Cetak</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(inv)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                  <span className="text-destructive">Hapus</span>
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tindakan ini akan menghapus faktur <span className="font-bold">{inv.No_Faktur}</span> secara permanen, mengembalikan stok, dan menghapus transaksi terkait.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction asChild>
                                    <SubmitButton onClick={() => handleDelete(inv.id)} variant="destructive" pending={isDeleting} pendingText="Menghapus...">
                                      Ya, Hapus Faktur
                                    </SubmitButton>
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Belum ada faktur pembelian.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
