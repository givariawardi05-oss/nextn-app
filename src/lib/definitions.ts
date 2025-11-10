

export type BankAccount = {
    id: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    balance: number;
};

export type PurchaseItem = {
    name: string;
    qty: number;
    price: number;
};

export type SalesItem = {
    name: string;
    qty: number;
    price: number;
};

export type WarehouseItem = {
    id: string;
    Nama_Green_Beans: string;
    Stock_Kg: number;
    Avg_HPP: number;
    Total_Value: number;
    Last_Update: string;
};

export type RoastingBatch = {
    id: string;
    Batch_ID: string;
    Tanggal: string;
    Green_Beans: string;
    Input_Kg: number;
    Output_Kg: number;
    Yield_Persen: string;
    Profile: string;
    HPP_Per_Kg: number;
    Harga_Jual_Kg: number;
    Status: string;
};

export type RoastedInventoryItem = {
    id: string;
    Produk_Roasting: string;
    Kategori: string;
    Stock_Kg: number;
    HPP_Per_Kg: number;
    Harga_Jual_Kg: number;
    Total_Value: number;
};

export type StoreInventoryItem = {
    id: string;
    Nama_Produk: string;
    Kategori: string;
    Stock_Kg: number;
    HPP_Per_Kg: number;
    Harga_Jual_Kg: number;
    Total_Value: number;
};

export type SalesInvoice = {
    id: string;
    No_Invoice: string;
    Customer: string;
    Tanggal: string;
    Jatuh_Tempo: string;
    Total_Invoice: number;
    Status_Bayar: 'Draft' | 'Sent' | 'Paid' | 'Lunas' | 'Overdue';
    items: SalesItem[];
};

export type PurchaseInvoice = {
    id: string;
    No_Faktur: string;
    Supplier: string;
    Tanggal: string;
    Total_Faktur: number;
    Status: string;
    items: PurchaseItem[];
    paymentSource: string; // 'cash' or bank account id
};

export type TransactionCategory = 
    | 'Pembelian Bahan Baku'
    | 'Pendapatan Penjualan'
    | 'Beban Pokok Penjualan'
    | 'Pembelian Aset'
    | 'Produksi Internal'
    | 'Pengeluaran Operasional';

export type Transaction = {
    id: string;
    Tanggal: string;
    Deskripsi: string;
    Referensi: string;
    Kategori: TransactionCategory | string; // Allow for other strings for flexibility
    Debit: number;
    Kredit: number;
    accountId: string; // 'cash' or bank account id
};

export type Asset = {
    id: string;
    Nama_Aset: string;
    Kategori: string;
    Tgl_Perolehan: string;
    Nilai_Perolehan: number;
    Penyusutan_Tahun: number;
};

export type Settings = {
    [key: string]: any;
    bankAccounts: BankAccount[];
};

export type NextIds = {
    purchaseInvoice: string;
    roastingBatch: string;
    salesInvoice: string;
}

export type BlendComponent = {
    id: string;
    percentage: number;
};


// Data that is actually stored in localStorage
export type StorableGlobalData = {
    warehouseData: WarehouseItem[];
    roastingBatches: RoastingBatch[];
    roastedInventory: RoastedInventoryItem[];
    storeInventory: StoreInventoryItem[];
    salesInvoices: SalesInvoice[];
    purchaseInvoices: PurchaseInvoice[];
    transactions: Transaction[];
    assetsData: Asset[];
    settings: Settings;
}

// The complete data structure available in the app context, including calculated fields
export type GlobalData = StorableGlobalData & {
    nextIds: NextIds;
    currentBalance: number; // This will now represent total of all accounts
    accountBalances: { [key: string]: number };
};

export type SectionName = 
    | 'dashboard'
    | 'purchases'
    | 'warehouse'
    | 'roasting'
    | 'roasted-inventory'
    | 'store-inventory'
    | 'sales'
    | 'transactions'
    | 'reports'
    | 'assets'
    | 'balance-sheet'
    | 'settings';
