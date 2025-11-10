
"use server";
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { SalesInvoice, WarehouseItem, StorableGlobalData, BlendComponent, PurchaseInvoice, BankAccount, Asset, PurchaseItem, SalesItem } from './definitions';

const safeParseFloat = (val: any): number => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

type ActionState = {
  message: string;
  status: 'success' | 'error';
  data?: StorableGlobalData; 
  errors?: any;
};

function revertItemsFromWarehouse(warehouse: WarehouseItem[], items: PurchaseItem[]): WarehouseItem[] {
    const newWarehouse = [...warehouse];
    for (const item of items) {
        const warehouseItemIndex = newWarehouse.findIndex(wh => wh.Nama_Green_Beans === item.name);
        if (warehouseItemIndex > -1) {
            const warehouseItem = newWarehouse[warehouseItemIndex];
            const qty = safeParseFloat(item.qty);
            const totalValueItem = qty * safeParseFloat(item.price);

            const revertedStock = warehouseItem.Stock_Kg - qty;
            const revertedTotalValue = warehouseItem.Total_Value - totalValueItem;

            warehouseItem.Stock_Kg = revertedStock < 0 ? 0 : revertedStock;
            warehouseItem.Total_Value = revertedTotalValue < 0 ? 0 : revertedTotalValue;
            warehouseItem.Avg_HPP = warehouseItem.Stock_Kg > 0 ? warehouseItem.Total_Value / warehouseItem.Stock_Kg : 0;
        }
    }
    return newWarehouse;
}

function applyItemsToWarehouse(warehouse: WarehouseItem[], items: PurchaseItem[], date: string): WarehouseItem[] {
    const newWarehouse = [...warehouse];
    for (const item of items) {
        const warehouseItemIndex = newWarehouse.findIndex(wh => wh.Nama_Green_Beans === item.name);
        const qty = safeParseFloat(item.qty);
        const price = safeParseFloat(item.price);
        const totalValueItem = qty * price;

        if (warehouseItemIndex > -1) {
            const warehouseItem = newWarehouse[warehouseItemIndex];
            const newStock = warehouseItem.Stock_Kg + qty;
            const newTotalValue = warehouseItem.Total_Value + totalValueItem;
            warehouseItem.Stock_Kg = newStock;
            warehouseItem.Total_Value = newTotalValue;
            warehouseItem.Avg_HPP = newStock > 0 ? newTotalValue / newStock : 0;
            warehouseItem.Last_Update = date;
        } else {
            newWarehouse.push({
                id: `wh-${item.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                Nama_Green_Beans: item.name,
                Stock_Kg: qty,
                Avg_HPP: price,
                Total_Value: totalValueItem,
                Last_Update: date,
            });
        }
    }
    return newWarehouse;
}

// --- Purchase Invoice Action ---
export async function createPurchase(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const invoiceId = formData.get('invoiceId') as string | null;
    if (invoiceId) {
        return updatePurchase(prevState, formData);
    }
    return createNewPurchase(prevState, formData);
}

async function createNewPurchase(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    try {
        const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const items = JSON.parse(formData.get('items') as string) as PurchaseItem[];
        const paymentSource = formData.get('paymentSource') as string;

        const totalFaktur = items.reduce((sum, item) => sum + (safeParseFloat(item.qty) * safeParseFloat(item.price)), 0);
        
        const purchaseData: PurchaseInvoice = {
            id: `pur-${Date.now()}`,
            No_Faktur: formData.get('invoiceNumber') as string,
            Supplier: formData.get('supplier') as string,
            Tanggal: formData.get('date') as string,
            Total_Faktur: totalFaktur,
            Status: 'Completed',
            items,
            paymentSource,
        };
    
        const newWarehouseData = applyItemsToWarehouse(db.warehouseData, items, purchaseData.Tanggal);

        const storableDb: StorableGlobalData = {
            ...db,
            purchaseInvoices: [...db.purchaseInvoices, purchaseData],
            transactions: [...db.transactions, {
                id: `trx-${Date.now()}`,
                Tanggal: purchaseData.Tanggal,
                Deskripsi: `Pembelian dari ${purchaseData.Supplier}`,
                Referensi: purchaseData.No_Faktur,
                Kategori: 'Pembelian Bahan Baku',
                Debit: 0,
                Kredit: purchaseData.Total_Faktur,
                accountId: paymentSource,
            }],
            warehouseData: newWarehouseData,
        };
        
        revalidatePath('/');
        return { message: 'Faktur pembelian berhasil dibuat!', status: 'success', data: storableDb };
    } catch (e: any) {
        console.error("Error creating purchase:", e);
        return { message: `Gagal membuat faktur: ${e.message}`, status: 'error' };
    }
}

// --- Roasting Batch Action ---
export async function createRoastingBatch(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    try {
        const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const greenBeansName = formData.get('greenBeans') as string;
        const inputKg = safeParseFloat(formData.get('inputQty'));

        const warehouseItemIndex = db.warehouseData.findIndex(b => b.Nama_Green_Beans === greenBeansName);
        
        if (warehouseItemIndex === -1) {
            return { message: `Stok Green Bean "${greenBeansName}" tidak ditemukan.`, status: 'error' };
        }
        
        const warehouseItem = db.warehouseData[warehouseItemIndex];
        if (warehouseItem.Stock_Kg < inputKg) {
            return { message: `Stok ${greenBeansName} tidak mencukupi (tersisa ${warehouseItem.Stock_Kg} kg).`, status: 'error' };
        }
        
        const yieldPercent = safeParseFloat(formData.get('yieldPercent'));
        const outputKg = inputKg * (yieldPercent / 100);

        const batchData = {
            id: `rb-${Date.now()}`,
            Batch_ID: formData.get('batchId') as string,
            Tanggal: formData.get('date') as string,
            Green_Beans: greenBeansName,
            Input_Kg: inputKg,
            Output_Kg: outputKg,
            Yield_Persen: `${yieldPercent}%`,
            Profile: formData.get('profile') as string,
            HPP_Per_Kg: safeParseFloat(formData.get('hppPerKg')),
            Harga_Jual_Kg: 0,
            Status: 'Completed',
        };

        // Update warehouse stock
        warehouseItem.Stock_Kg -= batchData.Input_Kg;
        warehouseItem.Total_Value = warehouseItem.Stock_Kg * warehouseItem.Avg_HPP;
        warehouseItem.Last_Update = batchData.Tanggal;

        // Update roasted inventory
        const roastedProductName = `${batchData.Green_Beans} - ${batchData.Profile}`;
        const roastedInvItemIndex = db.roastedInventory.findIndex(item => item.Produk_Roasting === roastedProductName);
        
        if (roastedInvItemIndex > -1) {
            const roastedInvItem = db.roastedInventory[roastedInvItemIndex];
            const newValueFromBatch = batchData.HPP_Per_Kg * batchData.Output_Kg;
            const newTotalValue = roastedInvItem.Total_Value + newValueFromBatch;
            const newRoastedStock = roastedInvItem.Stock_Kg + batchData.Output_Kg;
            
            roastedInvItem.Stock_Kg = newRoastedStock;
            roastedInvItem.Total_Value = newTotalValue;
            roastedInvItem.HPP_Per_Kg = newRoastedStock > 0 ? newTotalValue / newRoastedStock : 0;
        } else {
            db.roastedInventory.push({
                id: `ri-${roastedProductName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                Kategori: 'Roasted Beans',
                Produk_Roasting: roastedProductName,
                Stock_Kg: batchData.Output_Kg,
                HPP_Per_Kg: batchData.HPP_Per_Kg,
                Harga_Jual_Kg: 0,
                Total_Value: batchData.HPP_Per_Kg * batchData.Output_Kg,
            });
        }
        
        const storableDb: StorableGlobalData = {
            ...db,
            roastingBatches: [...db.roastingBatches, batchData],
        };

        revalidatePath('/');
        return { message: 'Batch roasting berhasil diproses!', status: 'success', data: storableDb };
    } catch (e: any) {
        console.error("Error creating roasting batch:", e);
        return { message: `Gagal memproses batch: ${e.message}`, status: 'error' };
    }
}


// --- Transfer to Store Action ---
export async function transferToStore(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    
    try {
        const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const itemsToTransfer: { id: string }[] = JSON.parse(formData.get('itemsToTransfer') as string);

        if (!itemsToTransfer || itemsToTransfer.length === 0) {
            return { message: 'Tidak ada item yang dipilih untuk ditransfer.', status: 'error' };
        }

        let storableDb: StorableGlobalData = {
            ...db,
            roastedInventory: [...db.roastedInventory],
            storeInventory: [...db.storeInventory],
        };

        for (const item of itemsToTransfer) {
            const roastedIndex = storableDb.roastedInventory.findIndex(i => i.id === item.id);
            if (roastedIndex === -1) continue;
            
            const roastedDoc = storableDb.roastedInventory[roastedIndex];
            const stockToTransfer = roastedDoc.Stock_Kg;
            if (stockToTransfer <= 0) continue;

            const storeInvIndex = storableDb.storeInventory.findIndex(si => si.Nama_Produk === roastedDoc.Produk_Roasting);
            const hpp = roastedDoc.HPP_Per_Kg;
            const valueToTransfer = stockToTransfer * hpp;
            const category = roastedDoc.Kategori || 'Roasted Beans';

            if (storeInvIndex > -1) {
                const storeInvItem = storableDb.storeInventory[storeInvIndex];
                const newStoreStock = storeInvItem.Stock_Kg + stockToTransfer;
                const newStoreValue = storeInvItem.Total_Value + valueToTransfer;
                storeInvItem.Stock_Kg = newStoreStock;
                storeInvItem.Total_Value = newStoreValue;
                storeInvItem.HPP_Per_Kg = newStoreStock > 0 ? newStoreValue / newStoreStock : 0;
                storeInvItem.Harga_Jual_Kg = storeInvItem.Harga_Jual_Kg > 0 ? storeInvItem.Harga_Jual_Kg : hpp * 1.5;
            } else {
                storableDb.storeInventory.push({
                    id: `si-${roastedDoc.Produk_Roasting.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                    Nama_Produk: roastedDoc.Produk_Roasting,
                    Kategori: category,
                    Stock_Kg: stockToTransfer,
                    HPP_Per_Kg: hpp,
                    Harga_Jual_Kg: hpp * 1.5,
                    Total_Value: valueToTransfer,
                });
            }
            
            roastedDoc.Stock_Kg = 0;
            roastedDoc.Total_Value = 0;
        }

        revalidatePath('/');
        return { message: `${itemsToTransfer.length} item berhasil ditransfer ke toko.`, status: 'success', data: storableDb };
    } catch (e: any) {
        console.error("Error transferring to store:", e);
        return { message: `Gagal mentransfer: ${e.message}`, status: 'error' };
    }
}

// --- Sales Invoice Action ---
export async function createSale(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    try {
        const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const items = JSON.parse(formData.get('items') as string) as SalesItem[];
        
        const totalInvoice = items.reduce((sum, item) => sum + (safeParseFloat(item.qty) * safeParseFloat(item.price)), 0);
        const paymentStatus = formData.get('paymentStatus') as string;

        const salesData: SalesInvoice = {
            id: `sale-${Date.now()}`,
            No_Invoice: formData.get('invoiceNumber') as string,
            Customer: formData.get('customerName') as string,
            Tanggal: formData.get('date') as string,
            Jatuh_Tempo: formData.get('dueDate') as string,
            Total_Invoice: totalInvoice,
            Status_Bayar: paymentStatus as any,
            items,
        };
        
        let storableDb: StorableGlobalData = {
            ...db,
            transactions: [...db.transactions],
            storeInventory: [...db.storeInventory],
            salesInvoices: [...db.salesInvoices, salesData],
        };

        if (paymentStatus === 'Paid' || paymentStatus === 'Lunas') {
            storableDb.transactions.push({
                id: `trx-${Date.now()}-sale`,
                Tanggal: salesData.Tanggal,
                Deskripsi: `Penjualan kepada ${salesData.Customer}`,
                Referensi: salesData.No_Invoice,
                Kategori: 'Pendapatan Penjualan',
                Debit: salesData.Total_Invoice,
                Kredit: 0,
                accountId: 'cash',
            });
        }

        let totalCOGS = 0;
        for (const item of items) {
            const storeItemIndex = storableDb.storeInventory.findIndex(si => si.Nama_Produk === item.name);
            if (storeItemIndex === -1) throw new Error(`Produk ${item.name} tidak ditemukan di toko.`);
            
            const storeItem = storableDb.storeInventory[storeItemIndex];
            const qtySold = safeParseFloat(item.qty);
            if (storeItem.Stock_Kg < qtySold) throw new Error(`Stok ${item.name} tidak cukup.`);
            
            const avgHPP = storeItem.HPP_Per_Kg;
            totalCOGS += qtySold * avgHPP;
            storeItem.Stock_Kg -= qtySold;
            storeItem.Total_Value = storeItem.Stock_Kg * avgHPP;
        }

        if (totalCOGS > 0) {
            storableDb.transactions.push({
                id: `trx-${Date.now()}-cogs`,
                Tanggal: salesData.Tanggal,
                Deskripsi: `Beban Pokok Penjualan untuk ${salesData.No_Invoice}`,
                Referensi: salesData.No_Invoice,
                Kategori: 'Beban Pokok Penjualan',
                Debit: 0,
                Kredit: totalCOGS,
                accountId: 'cash',
            });
        }
        
        revalidatePath('/');
        return { message: 'Invoice penjualan berhasil dibuat!', status: 'success', data: storableDb };
    } catch (e: any) {
        console.error("Error creating sale:", e);
        return { message: `Gagal membuat invoice: ${e.message}`, status: 'error' };
    }
}


// --- Add Manual Stock Action ---
export async function addManualStock(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    try {
        const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const stockData = {
            Nama_Produk: formData.get('productName') as string,
            Kategori: formData.get('category') as string,
            Stock_Kg: safeParseFloat(formData.get('stock')),
            HPP_Per_Kg: safeParseFloat(formData.get('hpp')),
            Harga_Jual_Kg: safeParseFloat(formData.get('sellPrice')),
        };
        
        let storableDb: StorableGlobalData = { ...db, storeInventory: [...db.storeInventory] };
        const storeItemIndex = storableDb.storeInventory.findIndex(si => si.Nama_Produk === stockData.Nama_Produk);

        if (storeItemIndex > -1) {
            let storeItem = storableDb.storeInventory[storeItemIndex];
            storeItem.Stock_Kg = stockData.Stock_Kg;
            storeItem.HPP_Per_Kg = stockData.HPP_Per_Kg;
            storeItem.Harga_Jual_Kg = stockData.Harga_Jual_Kg;
            storeItem.Total_Value = stockData.Stock_Kg * stockData.HPP_Per_Kg;
            storeItem.Kategori = stockData.Kategori;
        } else {
            storableDb.storeInventory.push({
                id: `si-${stockData.Nama_Produk.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                ...stockData,
                Total_Value: stockData.Stock_Kg * stockData.HPP_Per_Kg,
            });
        }
        
        revalidatePath('/');
        return { message: 'Stok manual berhasil ditambahkan/diupdate!', status: 'success', data: storableDb };
    } catch (e: any) {
        console.error("Error adding manual stock:", e);
        return { message: `Gagal menambahkan stok: ${e.message}`, status: 'error' };
    }
}

// --- Asset Action ---
export async function createAsset(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    try {
        const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const value = safeParseFloat(formData.get('value'));
        const assetData: Asset = {
            id: `asset-${Date.now()}`,
            Nama_Aset: formData.get('name') as string,
            Kategori: formData.get('category') as string,
            Tgl_Perolehan: formData.get('date') as string,
            Nilai_Perolehan: value,
            Penyusutan_Tahun: safeParseFloat(formData.get('depreciation')),
        };

        const storableDb: StorableGlobalData = {
            ...db,
            assetsData: [...db.assetsData, assetData],
            transactions: [...db.transactions]
        };

        storableDb.transactions.push({
            id: `trx-${Date.now()}-asset`,
            Tanggal: assetData.Tgl_Perolehan,
            Deskripsi: `Pembelian Aset: ${assetData.Nama_Aset}`,
            Referensi: assetData.id,
            Kategori: 'Pembelian Aset',
            Debit: 0,
            Kredit: assetData.Nilai_Perolehan,
            accountId: 'cash',
        });

        revalidatePath('/');
        return { message: 'Aset berhasil dicatat!', status: 'success', data: storableDb };
    } catch (e: any) {
        console.error("Error saving asset:", e);
        return { message: `Gagal mencatat aset: ${e.message}`, status: 'error' };
    }
}

// --- Settings Action ---
export async function saveSettings(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const SettingsSchema = z.object({
        company_name: z.string().min(1, "Nama perusahaan wajib diisi"),
        stock_low_limit: z.coerce.number().min(0, "Batas stok tidak boleh negatif"),
        modal_awal: z.coerce.number().min(0, "Modal awal tidak boleh negatif"),
        company_address: z.string().optional(),
        invoice_notes: z.string().optional(),
        company_logo: z.string().optional(),
    });

    const parsed = SettingsSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { message: 'Data tidak valid.', status: 'error', errors: parsed.error.flatten().fieldErrors };
    }

    try {
        const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const storableDb: StorableGlobalData = {
            ...db,
            settings: { ...db.settings, ...parsed.data }
        };
        
        revalidatePath('/');
        return { message: 'Pengaturan berhasil disimpan!', status: 'success', data: storableDb };
    } catch (e: any) {
        console.error("Error saving settings:", e);
        return { message: `Gagal menyimpan pengaturan: ${e.message}`, status: 'error' };
    }
}

// --- Delete Purchase Invoice Action ---
export async function deletePurchase(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    try {
        const currentData: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const invoiceId = formData.get('invoiceId') as string;
        
        const invoiceToDelete = currentData.purchaseInvoices.find(inv => inv.id === invoiceId);
        if (!invoiceToDelete) throw new Error("Faktur tidak ditemukan.");
        
        const remainingInvoices = currentData.purchaseInvoices.filter(inv => inv.id !== invoiceId);
        
        // Rebuild warehouse from scratch without the deleted invoice
        let newWarehouseData: WarehouseItem[] = [];
        for (const inv of remainingInvoices) {
            newWarehouseData = applyItemsToWarehouse(newWarehouseData, inv.items, inv.Tanggal);
        }

        const storableDb: StorableGlobalData = {
            ...currentData,
            purchaseInvoices: remainingInvoices,
            transactions: currentData.transactions.filter(t => t.Referensi !== invoiceToDelete.No_Faktur),
            warehouseData: newWarehouseData,
        };
        
        revalidatePath('/');
        return { message: 'Faktur pembelian berhasil dihapus!', status: 'success', data: storableDb };
    } catch (e: any) {
        console.error("Error deleting purchase:", e);
        return { message: `Gagal menghapus faktur: ${e.message}`, status: 'error' };
    }
}

// --- Update Purchase Invoice Action ---
async function updatePurchase(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
     try {
        const currentData: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const invoiceId = formData.get('invoiceId') as string;
        if (!invoiceId) throw new Error("ID Faktur tidak ditemukan untuk pembaruan.");
        
        const oldInvoice = currentData.purchaseInvoices.find(inv => inv.id === invoiceId);
        if(!oldInvoice) throw new Error("Faktur lama tidak ditemukan.");

        const newItems = JSON.parse(formData.get('items') as string) as PurchaseItem[];
        const paymentSource = formData.get('paymentSource') as string;
        const totalFaktur = newItems.reduce((sum, item) => sum + (safeParseFloat(item.qty) * safeParseFloat(item.price)), 0);
        
        const newInvoiceData: PurchaseInvoice = {
            id: invoiceId,
            No_Faktur: formData.get('invoiceNumber') as string,
            Supplier: formData.get('supplier') as string,
            Tanggal: formData.get('date') as string,
            Total_Faktur: totalFaktur,
            Status: 'Completed',
            items: newItems,
            paymentSource,
        };
        
        const updatedInvoices = currentData.purchaseInvoices.map(inv => inv.id === invoiceId ? newInvoiceData : inv);
        
        // Rebuild warehouse from scratch with the updated invoices
        let newWarehouseData: WarehouseItem[] = [];
        for (const inv of updatedInvoices) {
            newWarehouseData = applyItemsToWarehouse(newWarehouseData, inv.items, inv.Tanggal);
        }
        
        const storableDb: StorableGlobalData = {
            ...currentData,
            purchaseInvoices: updatedInvoices,
            transactions: [
                ...currentData.transactions.filter(t => t.Referensi !== oldInvoice.No_Faktur && t.Referensi !== newInvoiceData.No_Faktur),
                {
                    id: `trx-upd-${Date.now()}`, Tanggal: newInvoiceData.Tanggal,
                    Deskripsi: `Pembelian dari ${newInvoiceData.Supplier}`, Referensi: newInvoiceData.No_Faktur,
                    Kategori: 'Pembelian Bahan Baku', Debit: 0, Kredit: newInvoiceData.Total_Faktur,
                    accountId: paymentSource,
                }
            ],
            warehouseData: newWarehouseData,
        };
        
        revalidatePath('/');
        return { message: 'Faktur pembelian berhasil diperbarui!', status: 'success', data: storableDb };
    } catch (e: any) {
        console.error("Error updating purchase:", e);
        return { message: `Gagal memperbarui faktur: ${e.message}`, status: 'error' };
    }
}


// --- Store Item Actions ---
export async function updateStoreItem(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
    
    const storableDb: StorableGlobalData = {
        ...db,
        storeInventory: db.storeInventory.map(item => {
          if (item.id === formData.get('itemId')) {
            return {
              ...item,
              Nama_Produk: formData.get('Nama_Produk') as string,
              Kategori: formData.get('Kategori') as string,
              Harga_Jual_Kg: safeParseFloat(formData.get('Harga_Jual_Kg')),
            };
          }
          return item;
        }),
    };
    
    revalidatePath('/');
    return { message: 'Produk berhasil diupdate!', status: 'success', data: storableDb };
  } catch (e: any) {
    return { message: `Gagal mengupdate produk: ${e.message}`, status: 'error' };
  }
}

export async function deleteStoreItem(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    try {
        const currentData: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const itemId = formData.get('itemId') as string;
        
        const itemToDelete = currentData.storeInventory.find(item => item.id === itemId);
        if (!itemToDelete) throw new Error("Produk tidak ditemukan.");
        if (itemToDelete.Stock_Kg > 0) throw new Error("Tidak dapat menghapus produk dengan stok lebih dari nol.");

        const storableDb: StorableGlobalData = { ...currentData, storeInventory: currentData.storeInventory.filter(item => item.id !== itemId) };
        revalidatePath('/');
        return { message: 'Produk berhasil dihapus.', status: 'success', data: storableDb };
    } catch (e: any) {
        return { message: `Gagal menghapus produk: ${e.message}`, status: 'error' };
    }
}


// --- Manual Expense Action ---
export async function createExpense(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    try {
        const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const newTransaction = {
            id: `trx-exp-${Date.now()}`,
            Tanggal: formData.get('date') as string,
            Deskripsi: formData.get('description') as string,
            Referensi: "Manual",
            Kategori: 'Pengeluaran Operasional',
            Debit: 0,
            Kredit: safeParseFloat(formData.get('amount')),
            accountId: formData.get('accountId') as string,
        };
        
        const storableDb: StorableGlobalData = { ...db, transactions: [newTransaction, ...db.transactions] };
        revalidatePath('/');
        return { message: 'Pengeluaran berhasil dicatat!', status: 'success', data: storableDb };
    } catch (e: any) {
        return { message: `Gagal mencatat pengeluaran: ${e.message}`, status: 'error' };
    }
}

// --- Bank Account Action ---
export async function createBankAccount(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    try {
        const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const newAccount: BankAccount = {
            id: `bank-${Date.now()}`,
            accountName: formData.get('accountName') as string,
            bankName: formData.get('bankName') as string,
            accountNumber: formData.get('accountNumber') as string,
            balance: safeParseFloat(formData.get('balance')),
        };
        
        const newAsset: Asset = {
          id: `asset-bank-${Date.now()}`,
          Nama_Aset: `Bank: ${newAccount.bankName} (${newAccount.accountName})`,
          Kategori: 'current',
          Tgl_Perolehan: new Date().toISOString().split('T')[0],
          Nilai_Perolehan: newAccount.balance,
          Penyusutan_Tahun: 0,
        };

        const storableDb: StorableGlobalData = {
            ...db,
            settings: { ...db.settings, bankAccounts: [...(db.settings.bankAccounts || []), newAccount] },
            assetsData: [...db.assetsData, newAsset]
        };
        
        revalidatePath('/');
        return { message: `Akun bank ${newAccount.bankName} berhasil dibuat!`, status: 'success', data: storableDb };
    } catch (e: any) {
        return { message: `Gagal membuat akun: ${e.message}`, status: 'error' };
    }
}

// --- Create Blend Action ---
export async function createBlend(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    try {
        const db: StorableGlobalData = JSON.parse(formData.get('currentData') as string);
        const components: Omit<BlendComponent, 'name'>[] = JSON.parse(formData.get('components') as string);

        const blendData = {
            name: formData.get('blendName') as string,
            totalQty: safeParseFloat(formData.get('totalQty')),
            components,
        };

        if (!blendData.name || blendData.totalQty <= 0 || blendData.components.length === 0) {
            throw new Error("Data blend tidak lengkap.");
        }

        const totalPercentage = blendData.components.reduce((sum, c) => sum + c.percentage, 0);
        if (Math.round(totalPercentage) !== 100) {
            throw new Error(`Total persentase harus 100%, saat ini ${totalPercentage}%.`);
        }

        let storableDb: StorableGlobalData = {
            ...db,
            roastedInventory: [...db.roastedInventory.map(item => ({...item}))], // deep copy
            storeInventory: [...db.storeInventory.map(item => ({...item}))],
            transactions: [...db.transactions],
        };

        let calculatedHpp = 0;
        for (const component of blendData.components) {
            const componentQtyNeeded = blendData.totalQty * (component.percentage / 100);
            const roastedIndex = storableDb.roastedInventory.findIndex(r => r.id === component.id);
            if (roastedIndex === -1) throw new Error(`Komponen tidak ditemukan.`);
            
            const roastedItem = storableDb.roastedInventory[roastedIndex];
            if (roastedItem.Stock_Kg < componentQtyNeeded) {
                throw new Error(`Stok ${roastedItem.Produk_Roasting} tidak mencukupi.`);
            }
            
            roastedItem.Stock_Kg -= componentQtyNeeded;
            roastedItem.Total_Value = roastedItem.Stock_Kg * roastedItem.HPP_Per_Kg;
            calculatedHpp += (componentQtyNeeded * roastedItem.HPP_Per_Kg);
        }

        const finalHppPerKg = blendData.totalQty > 0 ? calculatedHpp / blendData.totalQty : 0;
        const totalValue = blendData.totalQty * finalHppPerKg;
        const storeIndex = storableDb.storeInventory.findIndex(s => s.Nama_Produk === blendData.name);

        if (storeIndex > -1) {
            const storeItem = storableDb.storeInventory[storeIndex];
            const newValue = storeItem.Total_Value + totalValue;
            const newStock = storeItem.Stock_Kg + blendData.totalQty;
            storeItem.Stock_Kg = newStock;
            storeItem.Total_Value = newValue;
            storeItem.HPP_Per_Kg = newStock > 0 ? newValue / newStock : 0;
            storeItem.Harga_Jual_Kg = storeItem.Harga_Jual_Kg > 0 ? storeItem.Harga_Jual_Kg : finalHppPerKg * 1.5;
        } else {
            storableDb.storeInventory.push({
                id: `si-${blendData.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                Nama_Produk: blendData.name, Kategori: 'Blend', Stock_Kg: blendData.totalQty,
                HPP_Per_Kg: finalHppPerKg, Harga_Jual_Kg: finalHppPerKg * 1.5, Total_Value: totalValue,
            });
        }

        storableDb.transactions.push({
            id: `trx-${Date.now()}-blend`, Tanggal: new Date().toISOString().split('T')[0],
            Deskripsi: `Pembuatan blend: ${blendData.name}`, Referensi: `BLND-${Date.now()}`,
            Kategori: 'Produksi Internal', Debit: 0, Kredit: 0, accountId: 'cash',
        });
        
        revalidatePath('/');
        return { message: `Blend '${blendData.name}' berhasil dibuat!`, status: 'success', data: storableDb };
    } catch (e: any) {
        return { message: `Gagal membuat blend: ${e.message}`, status: 'error' };
    }
}
