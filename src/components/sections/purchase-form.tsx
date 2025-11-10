
"use client";

import React, { useActionState, useEffect, useTransition, useState, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPurchase } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { formatRupiah, getTodayDateString } from "@/lib/utils";
import type { GlobalData, PurchaseItem, PurchaseInvoice, BankAccount, StorableGlobalData } from "@/lib/definitions";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";

const purchaseItemSchema = z.object({
  name: z.string().min(1, "Nama item tidak boleh kosong"),
  qty: z.coerce.number().min(0.01, "Qty harus lebih dari 0"),
  price: z.coerce.number().min(1, "Harga harus lebih dari 0"),
});

const purchaseSchema = z.object({
  supplier: z.string().min(1, "Supplier tidak boleh kosong"),
  date: z.string().min(1, "Tanggal tidak boleh kosong"),
  invoiceNumber: z.string(),
  items: z.array(purchaseItemSchema).min(1, "Harus ada minimal 1 item"),
  paymentSource: z.string().min(1, "Sumber pembayaran harus dipilih"),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

interface PurchaseFormProps {
  nextInvoiceNumber: string;
  onFormSubmit: (newData: StorableGlobalData) => void;
  currentData: GlobalData;
  initialData?: PurchaseInvoice | null;
}

export function PurchaseForm({ nextInvoiceNumber, onFormSubmit, currentData, initialData = null }: PurchaseFormProps) {
  const [state, formAction, isPending] = useActionState(createPurchase, null);
  const { toast } = useToast();
  const [isTransitioning, startTransition] = useTransition();

  const allAccounts: { id: string, name: string }[] = useMemo(() => [
    { id: 'cash', name: 'Cash (Kas)' },
    ...(currentData.settings.bankAccounts || []).map((acc: BankAccount) => ({ id: acc.id, name: `${acc.bankName} - ${acc.accountName}` }))
  ], [currentData.settings.bankAccounts]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: initialData 
        ? {
            invoiceNumber: initialData.No_Faktur,
            date: initialData.Tanggal,
            supplier: initialData.Supplier,
            items: initialData.items.map(item => ({ ...item })),
            paymentSource: initialData.paymentSource || 'cash',
          }
        : {
            invoiceNumber: nextInvoiceNumber,
            date: getTodayDateString(),
            items: [{ name: "", qty: 0, price: 0 }],
            supplier: "",
            paymentSource: 'cash',
          }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  
  useEffect(() => {
    reset(initialData 
        ? {
            invoiceNumber: initialData.No_Faktur,
            date: initialData.Tanggal,
            supplier: initialData.Supplier,
            items: initialData.items.map(item => ({ ...item })),
            paymentSource: initialData.paymentSource || 'cash',
          }
        : {
            invoiceNumber: nextInvoiceNumber,
            date: getTodayDateString(),
            items: [{ name: "", qty: 0, price: 0 }],
            supplier: "",
            paymentSource: 'cash',
          });
  }, [initialData, nextInvoiceNumber, reset]);


  const watchedItems = watch("items");
  
  const grandTotal = useMemo(() => {
    return watchedItems.reduce((total, item) => {
        const qty = parseFloat(String(item.qty)) || 0;
        const price = parseFloat(String(item.price)) || 0;
        return total + (qty * price);
    }, 0);
  }, [watchedItems]);

  useEffect(() => {
    if (!state) return;
    if (state.status === "success" && state.data) {
      toast({ title: "Sukses!", description: state.message });
      onFormSubmit(state.data);
    } else if (state.status === "error") {
      toast({
        title: "Error!",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, onFormSubmit, toast]);
  
  const onFormSubmitWithData = (data: PurchaseFormValues) => {
    startTransition(() => {
        const formData = new FormData();
        formData.append('items', JSON.stringify(data.items));
        formData.append('invoiceNumber', data.invoiceNumber || (initialData?.No_Faktur || nextInvoiceNumber));
        formData.append('date', data.date);
        formData.append('supplier', data.supplier);
        formData.append('paymentSource', data.paymentSource);
        formData.append('currentData', JSON.stringify(currentData));
        if (initialData) {
            formData.append('invoiceId', initialData.id);
        }
        formAction(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmitWithData)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
          <Label htmlFor="supplier">Supplier</Label>
          <Input id="supplier" {...register("supplier")} />
          {errors.supplier && <p className="text-destructive text-sm mt-1">{errors.supplier.message}</p>}
        </div>
         <div>
          <Label htmlFor="date">Tanggal</Label>
          <Input type="date" id="date" {...register("date")} />
          {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="invoiceNumber">No. Faktur</Label>
          <Input id="invoiceNumber" {...register("invoiceNumber")} />
        </div>
        <div>
            <Label htmlFor="paymentSource">Sumber Pembayaran</Label>
            <Controller
                name="paymentSource"
                control={control}
                render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Pilih akun..."/></SelectTrigger>
                    <SelectContent>
                        {allAccounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                )}
            />
            {errors.paymentSource && <p className="text-destructive text-sm mt-1">{errors.paymentSource.message}</p>}
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
        <h4 className="font-semibold">Item Pembelian</h4>
        
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-10 gap-2 items-start">
            <div className="col-span-4">
              <Label htmlFor={`items.${index}.name`} className="sr-only">Nama Green Beans</Label>
              <Input placeholder="Nama Green Beans" {...register(`items.${index}.name`)} />
              {errors.items?.[index]?.name && <p className="text-destructive text-sm mt-1">{errors.items[index].name.message}</p>}
            </div>
            <div className="col-span-2">
              <Label htmlFor={`items.${index}.qty`} className="sr-only">Qty (kg)</Label>
              <Input type="number" step="0.1" placeholder="Qty (kg)" {...register(`items.${index}.qty`)} />
               {errors.items?.[index]?.qty && <p className="text-destructive text-sm mt-1">{errors.items[index].qty.message}</p>}
            </div>
            <div className="col-span-2">
              <Label htmlFor={`items.${index}.price`} className="sr-only">Harga/kg</Label>
              <Input type="number" placeholder="Harga/kg" {...register(`items.${index}.price`)} />
              {errors.items?.[index]?.price && <p className="text-destructive text-sm mt-1">{errors.items[index].price.message}</p>}
            </div>
            <div className="col-span-1">
                <Label className="sr-only">Total</Label>
                <Input value={formatRupiah((watchedItems[index]?.qty || 0) * (watchedItems[index]?.price || 0))} readOnly className="font-mono bg-background"/>
            </div>
            <div className="col-span-1">
              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
         {errors.items?.root && <p className="text-destructive text-sm mt-1">{errors.items.root.message}</p>}

        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", qty: 0, price: 0 })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Item
        </Button>
      </div>
      
      <div className="flex justify-end items-center gap-6 pt-4">
        <div className="text-right">
            <p className="text-sm text-muted-foreground">Grand Total</p>
            <p className="text-2xl font-bold">{formatRupiah(grandTotal)}</p>
        </div>
         <SubmitButton pending={isPending || isTransitioning} pendingText="Menyimpan..." size="lg">
            {initialData ? 'Simpan Perubahan' : 'Simpan & Masuk Warehouse'}
         </SubmitButton>
      </div>
    </form>
  );
}
