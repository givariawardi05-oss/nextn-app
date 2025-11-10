
"use client";

import React, { useActionState, useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createAsset } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { getTodayDateString } from "@/lib/utils";
import type { GlobalData, StorableGlobalData } from "@/lib/definitions";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";

const assetSchema = z.object({
  name: z.string().min(3, "Nama aset minimal 3 karakter"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  date: z.string().min(1, "Tanggal perolehan wajib diisi"),
  value: z.coerce.number().min(1, "Nilai perolehan harus lebih dari 0"),
  depreciation: z.coerce.number().min(0, "Penyusutan tidak boleh negatif"),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetFormProps {
  onFormSubmit: (newData: StorableGlobalData) => void;
  currentData: GlobalData;
}

export function AssetForm({ onFormSubmit, currentData }: AssetFormProps) {
  const [state, formAction, isPending] = useActionState(createAsset, null);
  const { toast } = useToast();
  const [isTransitioning, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      date: getTodayDateString(),
      category: 'fixed',
      depreciation: 0,
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.status === "success" && state.data) {
      toast({ title: "Sukses!", description: state.message });
      reset();
      onFormSubmit(state.data);
    } else if (state.status === "error") {
      toast({ title: "Error!", description: state.message, variant: "destructive" });
    }
  }, [state, onFormSubmit, reset, toast]);
  
  const onFormSubmitWithData = (data: AssetFormValues) => {
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
          <Label htmlFor="name">Nama Aset</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <Label htmlFor="category">Kategori</Label>
            <Controller
                name="category"
                control={control}
                render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fixed">Aset Tetap</SelectItem>
                        <SelectItem value="current">Aset Lancar (Non-Stock)</SelectItem>
                    </SelectContent>
                </Select>
                )}
            />
            {errors.category && <p className="text-destructive text-sm mt-1">{errors.category.message}</p>}
            </div>
            <div>
            <Label htmlFor="date">Tanggal Perolehan</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <Label htmlFor="value">Nilai Perolehan (Rp)</Label>
            <Input id="value" type="number" {...register("value")} />
            {errors.value && <p className="text-destructive text-sm mt-1">{errors.value.message}</p>}
            </div>
            <div>
            <Label htmlFor="depreciation">Penyusutan / Tahun (Rp)</Label>
            <Input id="depreciation" type="number" {...register("depreciation")} />
            {errors.depreciation && <p className="text-destructive text-sm mt-1">{errors.depreciation.message}</p>}
            </div>
        </div>

      <div className="flex justify-end pt-4">
        <SubmitButton pending={isPending || isTransitioning} pendingText="Menyimpan...">Simpan Aset</SubmitButton>
      </div>
    </form>
  );
}
