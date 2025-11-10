
"use client";

import React, { useActionState, useEffect, useTransition, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBlend } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { GlobalData, RoastedInventoryItem, StorableGlobalData } from "@/lib/definitions";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";

const blendComponentSchema = z.object({
  id: z.string().min(1, "Komponen wajib dipilih"),
  percentage: z.coerce.number().min(1, "Persentase harus lebih dari 0").max(100),
});

const blendSchema = z.object({
  blendName: z.string().min(3, "Nama blend minimal 3 karakter"),
  totalQty: z.coerce.number().min(0.1, "Jumlah total harus lebih dari 0"),
  components: z.array(blendComponentSchema).min(1, "Harus ada minimal 1 komponen"),
});

type BlendFormValues = z.infer<typeof blendSchema>;

interface BlendFormProps {
  onFormSubmit: (newData: StorableGlobalData) => void;
  currentData: GlobalData;
}

export function BlendForm({ onFormSubmit, currentData }: BlendFormProps) {
  const [state, formAction, isPending] = useActionState(createBlend, null);
  const { toast } = useToast();
  const [isTransitioning, startTransition] = useTransition();

  const availableComponents = useMemo(() => 
    (currentData.roastedInventory || []).filter(item => item.Stock_Kg > 0 && item.Kategori !== 'Blend')
  , [currentData.roastedInventory]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<BlendFormValues>({
    resolver: zodResolver(blendSchema),
    defaultValues: {
      blendName: "",
      totalQty: 1,
      components: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "components",
  });
  
  const watchedComponents = watch("components");
  const totalPercentage = watchedComponents.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);


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

  const onFormSubmitWithData = (data: BlendFormValues) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append('blendName', data.blendName);
      formData.append('totalQty', String(data.totalQty));
      formData.append('components', JSON.stringify(data.components));
      formData.append('currentData', JSON.stringify(currentData));
      formAction(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmitWithData)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-1">
          <Label htmlFor="blendName">Nama Blend Baru</Label>
          <Input id="blendName" {...register("blendName")} placeholder="Contoh: House Blend" />
          {errors.blendName && <p className="text-destructive text-sm mt-1">{errors.blendName.message}</p>}
        </div>
        <div>
          <Label htmlFor="totalQty">Jumlah Total (kg)</Label>
          <Input id="totalQty" type="number" step="0.1" {...register("totalQty")} />
          {errors.totalQty && <p className="text-destructive text-sm mt-1">{errors.totalQty.message}</p>}
        </div>
      </div>
      
      <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
        <div className="flex justify-between items-center">
            <h4 className="font-semibold">Komponen Blend (Single Origin)</h4>
             <div className={`font-semibold text-sm ${totalPercentage !== 100 ? 'text-destructive' : 'text-green-600'}`}>
                Total: {totalPercentage}%
            </div>
        </div>
        
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-8">
              <Label htmlFor={`components.${index}.id`} className="sr-only">Komponen</Label>
              <Controller
                name={`components.${index}.id`}
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Pilih komponen..."/></SelectTrigger>
                    <SelectContent>
                      {availableComponents.map(comp => (
                        <SelectItem key={comp.id} value={comp.id}>
                          {comp.Produk_Roasting} (Stok: {comp.Stock_Kg.toFixed(2)} kg)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.components?.[index]?.id && <p className="text-destructive text-sm mt-1">{errors.components[index].id.message}</p>}
            </div>
            <div className="col-span-3">
              <Label htmlFor={`components.${index}.percentage`} className="sr-only">Persentase (%)</Label>
              <Input type="number" placeholder="Persen (%)" {...register(`components.${index}.percentage`)} />
              {errors.components?.[index]?.percentage && <p className="text-destructive text-sm mt-1">{errors.components[index].percentage.message}</p>}
            </div>
            <div className="col-span-1">
              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={() => append({ id: "", percentage: null as any })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Komponen
        </Button>
        {errors.components?.root && <p className="text-destructive text-sm mt-1">{errors.components.root.message}</p>}
        {totalPercentage > 0 && totalPercentage !== 100 && (
             <p className="text-destructive text-sm mt-1">Total persentase komponen harus 100%.</p>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <SubmitButton pending={isPending || isTransitioning} pendingText="Membuat Blend...">Buat Blend</SubmitButton>
      </div>
    </form>
  );
}
