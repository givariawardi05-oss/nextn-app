'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { formatRupiah } from '@/lib/utils';
import type { GlobalData } from '@/lib/definitions';
import { DollarSign, Package, Warehouse, Store, Banknote, CalendarDays } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { subDays, format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  data: GlobalData;
}

export function Dashboard({ data }: DashboardProps) {
  const totalSales = data.transactions.filter(t => t.Kategori === 'Pendapatan Penjualan').reduce((sum, t) => sum + (t.Debit || 0), 0);
  const warehouseStock = data.warehouseData.reduce((sum, item) => sum + (item.Stock_Kg || 0), 0);
  const roastedStock = data.roastedInventory.reduce((sum, item) => sum + (item.Stock_Kg || 0), 0);
  const storeStock = data.storeInventory.reduce((sum, item) => sum + (item.Stock_Kg || 0), 0);
  const todayTransactions = data.transactions.filter(t => t.Tanggal === new Date().toISOString().split('T')[0]).length;

  const salesDataLast7Days = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    
    const dailySales = last7Days.map(day => {
      const formattedDay = format(day, 'yyyy-MM-dd');
      const salesForDay = data.transactions
        .filter(t => t.Kategori === 'Pendapatan Penjualan' && t.Tanggal === formattedDay)
        .reduce((sum, t) => sum + (t.Debit || 0), 0);
      
      return {
        date: format(day, 'dd MMM'),
        total: salesForDay
      };
    });

    return dailySales;
  }, [data.transactions]);

  const chartConfig = {
    total: {
      label: "Penjualan",
      color: "hsl(var(--primary))",
    },
  };
  
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main Column */}
      <div className="xl:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Penjualan" value={formatRupiah(totalSales)} icon={<DollarSign />} colorClass="text-primary" />
            <StatCard title="Saldo Saat Ini" value={formatRupiah(data.currentBalance)} icon={<Banknote />} colorClass="text-blue-400" />
            <StatCard title="Transaksi Hari Ini" value={todayTransactions.toString()} icon={<CalendarDays />} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Ikhtisar Penjualan</CardTitle>
            <CardDescription>Grafik pendapatan penjualan 7 hari terakhir.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <BarChart accessibilityLayer data={salesDataLast7Days}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `Rp ${Number(value) / 1000}k`}
                />
                <Tooltip 
                  cursor={false} 
                  content={<ChartTooltipContent 
                    formatter={(value) => formatRupiah(Number(value))}
                    indicator="dot"
                    />} 
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>5 transaksi terakhir yang tercatat di buku besar.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.transactions.slice(0, 5).map(t => (
                            <TableRow key={t.id}>
                                <TableCell>
                                    <p className="font-medium">{t.Deskripsi}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(t.Tanggal).toLocaleDateString('id-ID')}</p>
                                </TableCell>
                                <TableCell>{t.Kategori}</TableCell>
                                <TableCell className={`text-right font-semibold ${t.Debit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {t.Debit > 0 ? `+${formatRupiah(t.Debit)}` : `-${formatRupiah(t.Kredit)}`}
                                </TableCell>
                            </TableRow>
                        ))}
                         {data.transactions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">Belum ada aktivitas.</TableCell>
                           </TableRow>
                        )}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
      </div>

      {/* Side Column */}
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Notifikasi & Inventaris</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <StatCard title="Stok Gudang (GB)" value={`${warehouseStock.toFixed(1)} kg`} icon={<Warehouse />} colorClass="text-orange-400" />
                 <StatCard title="Stok Roasting" value={`${roastedStock.toFixed(1)} kg`} icon={<Package />} colorClass="text-cyan-400" />
                 <StatCard title="Stok Toko" value={`${storeStock.toFixed(1)} kg`} icon={<Store />} colorClass="text-purple-400" />
            </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/80 to-primary/60 border-primary/50">
            <CardHeader>
                <CardTitle className="text-primary-foreground">Tingkatkan Bisnis Anda</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-primary-foreground/90 text-sm mb-4">Analisa lebih dalam, kelola profit, dan lihat performa bisnis Anda dengan fitur premium.</p>
                <Button variant="secondary" className="w-full">Get Started</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
