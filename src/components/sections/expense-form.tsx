
"use client";

import React, { useActionState, useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createExpense } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { getTodayDateString } from "@/lib/utils";
import type { GlobalData, StorableGlobalData } from "@/lib/definitions";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";

const expenseSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  description: z.string().min(3, "Deskripsi minimal 3 karakter"),
  amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  accountId: z.string().min(1, "Akun pembayaran wajib dipilih"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  onFormSubmit: (newData: StorableGlobalData) => void;
  currentData: GlobalData;
  availableAccounts: { id: string, name: string }[];
}

export function ExpenseForm({ onFormSubmit, currentData, availableAccounts }: ExpenseFormProps) {
  const [state, formAction, isPending] = useActionState(createExpense, null);
  const { toast } = useToast();
  const [isTransitioning, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: getTodayDateString(),
      description: "",
      accountId: 'cash',
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
  
  const onFormSubmitWithData = (data: ExpenseFormValues) => {
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
        <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Tanggal</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input id="amount" type="number" {...register("amount")} />
              {errors.amount && <p className="text-destructive text-sm mt-1">{errors.amount.message}</p>}
            </div>
        </div>
        <div>
          <Label htmlFor="accountId">Bayar Dari Akun</Label>
           <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Pilih akun..."/></SelectTrigger>
                    <SelectContent>
                        {availableAccounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                )}
            />
          {errors.accountId && <p className="text-destructive text-sm mt-1">{errors.accountId.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="description">Deskripsi Pengeluaran</Label>
          <Textarea id="description" {...register("description")} placeholder="Contoh: Biaya listrik bulan ini" />
          {errors.description && <p className="text-destructive text-sm mt-1">{errors.description.message}</p>}
        </div>

      <div className="flex justify-end pt-4">
        <SubmitButton pending={isPending || isTransitioning} pendingText="Menyimpan...">Simpan Pengeluaran</SubmitButton>
      </div>
    </form>
  );
}
