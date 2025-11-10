
'use client';
import React, { useState, useMemo } from 'react';
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
import { StatCard } from '@/components/stat-card';
import { formatRupiah } from '@/lib/utils';
import type { GlobalData, WarehouseItem } from '@/lib/definitions';
import { Package, DollarSign, Scale } from 'lucide-react';

interface WarehouseProps {
  data: GlobalData;
}

type FilterType = 'all' | 'low' | 'available';

export function Warehouse({ data }: WarehouseProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const lowStockLimit = data.settings.stock_low_limit * 5 || 50;

  const stats = useMemo(() => {
    const totalStock = data.warehouseData.reduce((sum, item) => sum + (item.Stock_Kg || 0), 0);
    const totalValue = data.warehouseData.reduce((sum, item) => sum + (item.Total_Value || 0), 0);
    const avgPrice = totalStock > 0 ? totalValue / totalStock : 0;
    return { totalStock, totalValue, avgPrice, varieties: data.warehouseData.length };
  }, [data.warehouseData]);

  const filteredData = useMemo(() => {
    return data.warehouseData.filter(item => {
      const stock = item.Stock_Kg || 0;
      if (filter === 'low') return stock > 0 && stock < lowStockLimit;
      if (filter === 'available') return stock > 0;
      return true;
    }).sort((a, b) => b.Stock_Kg - a.Stock_Kg);
  }, [data.warehouseData, filter, lowStockLimit]);

  const getStatus = (stock: number): { text: string; variant: 'destructive' | 'secondary' | 'default' } => {
    if (stock === 0) return { text: 'Habis', variant: 'secondary' };
    if (stock < lowStockLimit) return { text: 'Stok Rendah', variant: 'destructive' };
    return { text: 'Tersedia', variant: 'default' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Warehouse Green Beans</h2>
        <p className="text-muted-foreground">Stok green beans dari faktur pembelanjaan.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Stok Green Beans</CardTitle>
                <div className="flex space-x-2">
                    <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Semua</Button>
                    <Button variant={filter === 'available' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('available')}>Tersedia</Button>
                    <Button variant={filter === 'low' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('low')}>Stok Rendah</Button>
                </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Nama Green Beans</TableHead>
                        <TableHead>Stok (kg)</TableHead>
                        <TableHead>Harga Rata-rata (Avg HPP)</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Last Update</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredData.length > 0 ? (
                        filteredData.map((item: WarehouseItem) => {
                        const status = getStatus(item.Stock_Kg);
                        return (
                            <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.Nama_Green_Beans}</TableCell>
                            <TableCell>{item.Stock_Kg.toFixed(1)}</TableCell>
                            <TableCell>{formatRupiah(item.Avg_HPP)}</TableCell>
                            <TableCell>{formatRupiah(item.Total_Value)}</TableCell>
                            <TableCell>{new Date(item.Last_Update).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell>
                                <Badge variant={status.variant}>{status.text}</Badge>
                            </TableCell>
                            </TableRow>
                        );
                        })
                    ) : (
                        <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                            Tidak ada data untuk filter ini.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
            <StatCard title="Total Stock" value={`${stats.totalStock.toFixed(1)} kg`} icon={<Package />} description={`${stats.varieties} varietas`} />
            <StatCard title="Total Value" value={formatRupiah(stats.totalValue)} icon={<DollarSign />} description="Nilai total inventory" />
            <StatCard title="Avg Price" value={formatRupiah(stats.avgPrice)} icon={<Scale />} description="Harga rata-rata per kg (WAC)" />
        </div>
      </div>
    </div>
  );
}
