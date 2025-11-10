
import type { 
    GlobalData,
    StorableGlobalData,
    BankAccount,
} from './definitions';
import { getAllData as getLocalData, writeAllData as setLocalData } from './local-storage-helpers';


export async function fetchAllData(): Promise<GlobalData> {
    const data = await getLocalData();
    return getRefreshedData(data);
}

// This can be used on client or server
export async function getRefreshedData(storableData: StorableGlobalData): Promise<GlobalData> {
    const initialBalance = Number(storableData.settings.modal_awal) || 0;
    
    const accountBalances: { [key: string]: number } = { 'cash': initialBalance };
    (storableData.settings.bankAccounts || []).forEach((acc: BankAccount) => {
        accountBalances[acc.id] = acc.balance;
    });

    (storableData.transactions || []).forEach(t => {
        const accountId = t.accountId || 'cash';
        if (accountBalances[accountId] === undefined) {
            const bankAccount = (storableData.settings.bankAccounts || []).find(ba => ba.id === accountId);
            accountBalances[accountId] = bankAccount ? bankAccount.balance : 0;
        }
        accountBalances[accountId] += (Number(t.Debit) || 0) - (Number(t.Kredit) || 0);
    });

    const currentBalance = Object.values(accountBalances).reduce((sum, bal) => sum + bal, 0);
    const timestamp = Date.now();

    const lastSaleInvoice = (storableData.salesInvoices || [])
      .filter(inv => inv.No_Invoice && inv.No_Invoice.startsWith('INV-'))
      .sort((a, b) => {
          const numA = parseInt(a.No_Invoice.split('-')[1] || '0', 10);
          const numB = parseInt(b.No_Invoice.split('-')[1] || '0', 10);
          return numB - numA;
      })[0];
    
    let nextSaleNumber = 1;
    if (lastSaleInvoice) {
        nextSaleNumber = (parseInt(lastSaleInvoice.No_Invoice.split('-')[1] || '0', 10) || 0) + 1;
    }
    const nextSalesInvoiceId = `INV-${String(nextSaleNumber).padStart(3, '0')}`;

    const nextIds = {
        purchaseInvoice: `FP-${timestamp}`,
        roastingBatch: `RB-${timestamp}`,
        salesInvoice: nextSalesInvoiceId,
    };

    const safeData: StorableGlobalData = {
        warehouseData: storableData.warehouseData || [],
        roastingBatches: storableData.roastingBatches || [],
        roastedInventory: storableData.roastedInventory || [],
        storeInventory: storableData.storeInventory || [],
        salesInvoices: storableData.salesInvoices || [],
        purchaseInvoices: storableData.purchaseInvoices || [],
        transactions: storableData.transactions || [],
        assetsData: storableData.assetsData || [],
        settings: storableData.settings || { bankAccounts: [] },
    };

    return {
        ...safeData,
        transactions: safeData.transactions.sort((a, b) => new Date(b.Tanggal).getTime() - new Date(a.Tanggal).getTime()), 
        salesInvoices: safeData.salesInvoices.sort((a, b) => new Date(b.Tanggal).getTime() - new Date(a.Tanggal).getTime()),
        purchaseInvoices: safeData.purchaseInvoices.sort((a, b) => new Date(b.Tanggal).getTime() - new Date(a.Tanggal).getTime()),
        roastingBatches: safeData.roastingBatches.sort((a, b) => new Date(b.Tanggal).getTime() - new Date(a.Tanggal).getTime()),
        currentBalance,
        accountBalances,
        nextIds,
    };
}
