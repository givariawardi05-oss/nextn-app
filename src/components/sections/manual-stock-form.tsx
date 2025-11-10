
"use client";

import React, { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addManualStock } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { GlobalData, StorableGlobalData } from "@/lib/definitions";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";

const manualStockSchema = z.object({
  productName: z.string().min(3, "Nama produk minimal 3 karakter"),
  category: z.string().min(1, "Kategori wajib diisi"),
  stock: z.coerce.number().min(0, "Stok tidak boleh negatif"),
  hpp: z.coerce.number().min(0, "HPP tidak boleh negatif"),
  sellPrice: z.coerce.number().min(0, "Harga jual tidak boleh negatif"),
});

type ManualStockFormValues = z.infer<typeof manualStockSchema>;

interface ManualStockFormProps {
  onFormSubmit: (newData: StorableGlobalData) => void;
  currentData: GlobalData;
}

export function ManualStockForm({ onFormSubmit, currentData }: ManualStockFormProps) {
  const [state, formAction, isPending] = useActionState(addManualStock, null);
  const { toast } = useToast();
  const [isTransitioning, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ManualStockFormValues>({
    resolver: zodResolver(manualStockSchema),
    defaultValues: {
        category: "Roasted Beans",
        stock: 0,
        hpp: 0,
        sellPrice: 0,
    }
  });

  useEffect(() => {
    if (!state) return;
    if (state.status === "success" && state.data) {
      toast({ title: "Sukses!", description: state.message });
      reset();
      onFormSubmit(state.data);
    } else if (state.status === "error") {
      toast({
        title: "Error!",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, onFormSubmit, reset, toast]);
  
  const onFormSubmitWithData = (data: ManualStockFormValues) => {
    startTransition(() => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
        formData.append('currentData', JSON.stringify(currentData));
        formAction(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmitWithData)} className="space-y-4">
      <div>
        <Label htmlFor="productName">Nama Produk</Label>
        <Input id="productName" {...register("productName")} placeholder="contoh: Gayo Wine" />
        {errors.productName && <p className="text-destructive text-sm mt-1">{errors.productName.message}</p>}
      </div>
       <div>
          <Label>Kategori</Label>
          <Select onValueChange={(value) => setValue('category', value, { shouldValidate: true })} defaultValue="Roasted Beans">
            <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Roasted Beans">Roasted Beans</SelectItem>
              <SelectItem value="Merchandise">Merchandise</SelectItem>
              <SelectItem value="Other">Lainnya</SelectItem>
            </SelectContent>
          </Select>
           {errors.category && <p className="text-destructive text-sm mt-1">{errors.category.message}</p>}
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="stock">Stok (kg)</Label>
          <Input id="stock" type="number" step="0.01" {...register("stock")} />
          {errors.stock && <p className="text-destructive text-sm mt-1">{errors.stock.message}</p>}
        </div>
        <div>
          <Label htmlFor="hpp">HPP/kg (Rp)</Label>
          <Input id="hpp" type="number" {...register("hpp")} />
          {errors.hpp && <p className="text-destructive text-sm mt-1">{errors.hpp.message}</p>}
        </div>
        <div>
          <Label htmlFor="sellPrice">Harga Jual/kg (Rp)</Label>
          <Input id="sellPrice" type="number" {...register("sellPrice")} />
          {errors.sellPrice && <p className="text-destructive text-sm mt-1">{errors.sellPrice.message}</p>}
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <SubmitButton pending={isPending || isTransitioning} pendingText="Menyimpan...">Simpan Produk</SubmitButton>
      </div>
    </form>
  );
}
