
'use client';
import React, { useState, useMemo, useEffect, useTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { StatCard } from '@/components/stat-card';
import { formatRupiah } from '@/lib/utils';
import type { GlobalData, StoreInventoryItem, StorableGlobalData } from '@/lib/definitions';
import { Package, DollarSign, CheckCircle, AlertTriangle, PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { ManualStockForm } from './manual-stock-form';
import { StoreItemForm } from './store-item-form';
import { useToast } from '@/hooks/use-toast';
import { deleteStoreItem } from '@/lib/actions';
import { SubmitButton } from '../submit-button';

interface StoreInventoryProps {
  data: GlobalData;
  onDataChange: (data: StorableGlobalData) => void;
}

type FilterType = 'all' | 'low' | 'available';

export function StoreInventory({ data, onDataChange }: StoreInventoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreInventoryItem | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();

  const lowStockLimit = data.settings.stock_low_limit || 10;

  const stats = useMemo(() => {
    const totalStock = (data.storeInventory || []).reduce((sum, item) => sum + (item.Stock_Kg || 0), 0);
    const totalValue = (data.storeInventory || []).reduce((sum, item) => sum + (item.Total_Value || 0), 0);
    const readyToSell = (data.storeInventory || []).filter(item => (item.Stock_Kg || 0) > 0).length;
    const lowStockCount = (data.storeInventory || []).filter(item => (item.Stock_Kg || 0) > 0 && (item.Stock_Kg || 0) < lowStockLimit).length;
    return { totalStock, totalValue, productCount: (data.storeInventory || []).length, readyToSell, lowStockCount };
  }, [data.storeInventory, lowStockLimit]);

  const filteredData = useMemo(() => {
    return (data.storeInventory || []).filter(item => {
      const stock = item.Stock_Kg || 0;
      if (filter === 'low') return stock > 0 && stock < lowStockLimit;
      if (filter === 'available') return stock > 0;
      return true;
    }).sort((a, b) => b.Stock_Kg - a.Stock_Kg);
  }, [data.storeInventory, filter, lowStockLimit]);
  
  const getStatus = (stock: number): { text: string; variant: 'destructive' | 'outline' | 'secondary' } => {
    if (stock === 0) return { text: 'Habis', variant: 'secondary' };
    if (stock < lowStockLimit) return { text: 'Stok Rendah', variant: 'destructive' };
    return { text: 'Tersedia', variant: 'outline' };
  };
  
  const handleFormSubmit = (newData: StorableGlobalData) => {
    onDataChange(newData);
    setIsManualDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedItem(null);
  }

  const handleEditClick = (item: StoreInventoryItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  }
  
  const handleDeleteClick = (itemId: string) => {
    startDeleteTransition(async () => {
        const formData = new FormData();
        formData.append('currentData', JSON.stringify(data));
        formData.append('itemId', itemId);
        const result = await deleteStoreItem(null, formData);

        if (result.status === 'success' && result.data) {
            toast({ title: 'Sukses', description: result.message });
            onDataChange(result.data);
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    });
  };

  useEffect(() => {
    if (!isEditDialogOpen) {
        setSelectedItem(null);
    }
  }, [isEditDialogOpen]);


  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventaris Toko</h2>
          <p className="text-muted-foreground">Stok siap jual di toko, termasuk merchandise dan produk blend.</p>
        </div>
        <div className="flex gap-2">
            <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tambah/Update Stok Manual
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tambah/Update Produk Manual</DialogTitle>
                  <DialogDescription>
                    Gunakan ini untuk menambahkan item non-roasting atau untuk menyesuaikan stok.
                  </DialogDescription>
                </DialogHeader>
                <ManualStockForm onFormSubmit={handleFormSubmit} currentData={data} />
              </DialogContent>
            </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                <DialogTitle>Edit Produk Toko</DialogTitle>
                <DialogDescription>
                    Ubah detail produk. Stok dan HPP tidak dapat diubah dari sini.
                </DialogDescription>
                </DialogHeader>
                <StoreItemForm onFormSubmit={handleFormSubmit} currentData={data} itemToEdit={selectedItem} />
            </DialogContent>
            </Dialog>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Daftar Produk Toko</CardTitle>
                <div className="flex space-x-2">
                    <Button variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('all')}>Semua</Button>
                    <Button variant={filter === 'available' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('available')}>Tersedia</Button>
                    <Button variant={filter === 'low' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('low')}>Stok Rendah</Button>
                </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Stok (kg)</TableHead>
                        <TableHead className="text-right">HPP/kg</TableHead>
                        <TableHead className="text-right">Harga Jual/kg</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredData.length > 0 ? (
                        filteredData.map((item: StoreInventoryItem) => {
                        const status = getStatus(item.Stock_Kg);
                        return(
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.Nama_Produk}</TableCell>
                                <TableCell>
                                <Badge variant={item.Kategori === 'Blend' ? 'default' : 'secondary'}>{item.Kategori}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{item.Stock_Kg.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{formatRupiah(item.HPP_Per_Kg)}</TableCell>
                                <TableCell className="text-right font-semibold">{formatRupiah(item.Harga_Jual_Kg)}</TableCell>
                                <TableCell className="text-right">{formatRupiah(item.Total_Value)}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={status.variant} className={status.variant === 'destructive' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-400' : status.variant === 'outline' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'border-gray-400 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }>{status.text}</Badge>
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
                                            <DropdownMenuItem onClick={() => handleEditClick(item)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                            </DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={item.Stock_Kg > 0}>
                                                        <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                                        <span className="text-destructive">Hapus</span>
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Tindakan ini akan menghapus produk <span className="font-bold">{item.Nama_Produk}</span> secara permanen dari daftar.
                                                        Hanya produk dengan stok 0 yang dapat dihapus.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                        <AlertDialogAction asChild>
                                                            <SubmitButton
                                                                variant="destructive"
                                                                onClick={() => handleDeleteClick(item.id)}
                                                                pending={isDeleting}
                                                                pendingText="Menghapus..."
                                                            >
                                                                Ya, Hapus Produk
                                                            </SubmitButton>
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                        })
                    ) : (
                        <TableRow>
                        <TableCell colSpan={8} className="text-center h-24">
                            Tidak ada produk di toko.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
            <StatCard title="Total Store Stock" value={`${stats.totalStock.toFixed(2)} kg`} icon={<Package />} description={`${stats.productCount} produk`} />
            <StatCard title="Total Value (HPP)" value={formatRupiah(stats.totalValue)} icon={<DollarSign />} description="Nilai inventaris" />
            <StatCard title="Ready to Sell" value={stats.readyToSell.toString()} icon={<CheckCircle />} description="Produk dengan stok > 0" />
            <StatCard title="Low Stock Alert" value={stats.lowStockCount.toString()} icon={<AlertTriangle />} description={`Stok < ${lowStockLimit} kg`} colorClass="text-destructive" />
        </div>
      </div>
    </div>
  );
}
