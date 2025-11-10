
"use client";

import React, { useActionState, useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateStoreItem } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { GlobalData, StoreInventoryItem, StorableGlobalData } from "@/lib/definitions";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";

const storeItemSchema = z.object({
  itemId: z.string(),
  Nama_Produk: z.string().min(3, "Nama produk minimal 3 karakter"),
  Kategori: z.string().min(1, "Kategori wajib diisi"),
  Harga_Jual_Kg: z.coerce.number().min(0, "Harga jual tidak boleh negatif"),
});

type StoreItemFormValues = z.infer<typeof storeItemSchema>;

interface StoreItemFormProps {
  onFormSubmit: (newData: StorableGlobalData) => void;
  currentData: GlobalData;
  itemToEdit: StoreInventoryItem | null;
}

export function StoreItemForm({ onFormSubmit, currentData, itemToEdit }: StoreItemFormProps) {
  const [state, formAction, isPending] = useActionState(updateStoreItem, null);
  const { toast } = useToast();
  const [isTransitioning, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<StoreItemFormValues>({
    resolver: zodResolver(storeItemSchema),
  });
  
  useEffect(() => {
    if (itemToEdit) {
        reset({
            itemId: itemToEdit.id,
            Nama_Produk: itemToEdit.Nama_Produk,
            Kategori: itemToEdit.Kategori,
            Harga_Jual_Kg: itemToEdit.Harga_Jual_Kg,
        });
    }
  }, [itemToEdit, reset]);

  useEffect(() => {
    if (!state) return;
    if (state.status === "success" && state.data) {
      toast({ title: "Sukses!", description: state.message });
      onFormSubmit(state.data);
    } else if (state.status === "error") {
      toast({ title: "Error!", description: state.message, variant: "destructive" });
    }
  }, [state, onFormSubmit, toast]);
  
  const onFormSubmitWithData = (data: StoreItemFormValues) => {
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
      <input type="hidden" {...register("itemId")} />
      <div>
        <Label htmlFor="Nama_Produk">Nama Produk</Label>
        <Input id="Nama_Produk" {...register("Nama_Produk")} />
        {errors.Nama_Produk && <p className="text-destructive text-sm mt-1">{errors.Nama_Produk.message}</p>}
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Kategori</Label>
          <Controller
            name="Kategori"
            control={control}
            render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Roasted Beans">Roasted Beans</SelectItem>
                    <SelectItem value="Blend">Blend</SelectItem>
                    <SelectItem value="Merchandise">Merchandise</SelectItem>
                    <SelectItem value="Other">Lainnya</SelectItem>
                    </SelectContent>
                </Select>
            )}
           />
           {errors.Kategori && <p className="text-destructive text-sm mt-1">{errors.Kategori.message}</p>}
        </div>
        <div>
          <Label htmlFor="Harga_Jual_Kg">Harga Jual/kg (Rp)</Label>
          <Input id="Harga_Jual_Kg" type="number" {...register("Harga_Jual_Kg")} />
          {errors.Harga_Jual_Kg && <p className="text-destructive text-sm mt-1">{errors.Harga_Jual_Kg.message}</p>}
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <SubmitButton pending={isPending || isTransitioning} pendingText="Menyimpan...">Simpan Perubahan</SubmitButton>
      </div>
    </form>
  );
}
