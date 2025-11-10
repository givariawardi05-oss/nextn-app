
"use client";

import React, { useActionState, useEffect, useTransition, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createSale } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { formatRupiah, getTodayDateString } from "@/lib/utils";
import type { GlobalData, StoreInventoryItem, SalesItem, SalesInvoice, StorableGlobalData } from "@/lib/definitions";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";

const salesItemSchema = z.object({
  name: z.string().min(1, "Produk wajib dipilih"),
  qty: z.coerce.number().min(0.01, "Qty harus lebih dari 0"),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
});

const salesSchema = z.object({
  invoiceNumber: z.string(),
  date: z.string().min(1, "Tanggal wajib diisi"),
  dueDate: z.string().min(1, "Jatuh tempo wajib diisi"),
  paymentStatus: z.string().min(1, "Status bayar wajib dipilih"),
  customerName: z.string().min(1, "Nama customer wajib diisi"),
  items: z.array(salesItemSchema).min(1, "Harus ada minimal 1 item penjualan"),
});

type SalesFormValues = z.infer<typeof salesSchema>;

interface SalesFormProps {
  nextInvoiceNumber: string;
  availableProducts: StoreInventoryItem[];
  onFormSubmit: (newData: StorableGlobalData) => void;
  currentData: GlobalData;
}

export function SalesForm({ nextInvoiceNumber, availableProducts, onFormSubmit, currentData }: SalesFormProps) {
  const [state, formAction, isPending] = useActionState(createSale, null);
  const { toast } = useToast();
  const [isTransitioning, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SalesFormValues>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      invoiceNumber: nextInvoiceNumber,
      date: getTodayDateString(),
      dueDate: getTodayDateString(),
      paymentStatus: "Paid",
      items: [{ name: "", qty: 0, price: 0 }],
    },
  });
  
  useEffect(() => {
    setValue('invoiceNumber', nextInvoiceNumber);
  }, [nextInvoiceNumber, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  useEffect(() => {
    if (!state) return;
    if (state.status === "success" && state.data) {
      toast({ title: "Sukses!", description: state.message });
      reset({
        invoiceNumber: nextInvoiceNumber,
        date: getTodayDateString(),
        dueDate: getTodayDateString(),
        paymentStatus: 'Paid',
        customerName: '',
        items: [{ name: '', qty: 0, price: 0 }],
      });
      onFormSubmit(state.data);
    } else if (state.status === "error") {
      toast({ title: "Error!", description: state.message, variant: "destructive" });
    }
  }, [state, onFormSubmit, reset, toast, nextInvoiceNumber]);

  const handleProductChange = (index: number, productName: string) => {
    const product = availableProducts.find(p => p.Nama_Produk === productName);
    if (product) {
      setValue(`items.${index}.name`, productName, { shouldValidate: true });
      setValue(`items.${index}.price`, product.Harga_Jual_Kg);
    }
  };

  const onFormSubmitWithData = (data: SalesFormValues) => {
    startTransition(() => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'items') {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, String(value));
            }
        });
        formData.append('currentData', JSON.stringify(currentData));
        formAction(formData);
    });
  }
  
  return (
    <form onSubmit={handleSubmit(onFormSubmitWithData)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div><Label>No. Invoice</Label><Input {...register("invoiceNumber")} readOnly /></div>
        <div><Label>Tanggal</Label><Input type="date" {...register("date")} /></div>
        <div><Label>Jatuh Tempo</Label><Input type="date" {...register("dueDate")} /></div>
        <div><Label>Status Bayar</Label>
            <Controller name="paymentStatus" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Paid">Lunas</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Sent">Terkirim</SelectItem>
                        <SelectItem value="Overdue">Jatuh Tempo</SelectItem>
                    </SelectContent>
                </Select>
            )} />
        </div>
      </div>
      <div><Label>Nama Customer</Label><Input {...register("customerName")} /> {errors.customerName && <p className="text-destructive text-sm mt-1">{errors.customerName.message}</p>}</div>

      <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
        <h4 className="font-semibold">Item Penjualan</h4>
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-5"><Label className="sr-only">Produk</Label>
              <Controller name={`items.${index}.name`} control={control} render={({ field }) => (
                <Select onValueChange={(value) => handleProductChange(index, value)} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Pilih Produk..." /></SelectTrigger>
                  <SelectContent>
                    {availableProducts.map(p => <SelectItem key={p.id} value={p.Nama_Produk}>{p.Nama_Produk} ({p.Stock_Kg.toFixed(2)} kg)</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
               {errors.items?.[index]?.name && <p className="text-destructive text-sm mt-1">{errors.items[index].name.message}</p>}
            </div>
            <div className="col-span-2"><Label className="sr-only">Qty</Label><Input type="number" step="0.01" placeholder="Qty" {...register(`items.${index}.qty`)} /></div>
            <div className="col-span-2"><Label className="sr-only">Harga</Label><Input type="number" placeholder="Harga" {...register(`items.${index}.price`)} /></div>
            <div className="col-span-2"><Label className="sr-only">Total</Label><Input value={formatRupiah( (watchedItems[index]?.qty || 0) * (watchedItems[index]?.price || 0))} readOnly className="font-mono bg-background" /></div>
            <div className="col-span-1"><Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button></div>
          </div>
        ))}
         {errors.items?.root && <p className="text-destructive text-sm mt-1">{errors.items.root.message}</p>}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", qty: 0, price: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Tambah Item</Button>
      </div>

      <div className="flex justify-end pt-4">
        <SubmitButton pending={isPending || isTransitioning} pendingText="Menyimpan...">Simpan Invoice</SubmitButton>
      </div>
    </form>
  );
}
