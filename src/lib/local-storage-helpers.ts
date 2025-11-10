
"use client";

import type { GlobalData, StorableGlobalData } from './definitions';

const DB_KEY = 'blackhorse_roastery_db';

const getInitialDbState = (): StorableGlobalData => ({
  warehouseData: [],
  roastingBatches: [],
  roastedInventory: [],
  storeInventory: [],
  salesInvoices: [],
  purchaseInvoices: [],
  transactions: [],
  assetsData: [],
  settings: {
    modal_awal: 0,
    company_name: 'BlackHorse Roastery',
    stock_low_limit: 10,
    bankAccounts: [],
  },
});

// This function can only be called on the client
export async function getAllData(): Promise<StorableGlobalData> {
  if (typeof window === 'undefined') {
    return getInitialDbState();
  }

  try {
    const localData = window.localStorage.getItem(DB_KEY);
    if (localData) {
      const parsedData = JSON.parse(localData);
      // Ensure bankAccounts exists
      if (!parsedData.settings.bankAccounts) {
        parsedData.settings.bankAccounts = [];
      }
      return parsedData;
    } else {
      const initialState = getInitialDbState();
      window.localStorage.setItem(DB_KEY, JSON.stringify(initialState));
      return initialState;
    }
  } catch (error) {
    console.error("Failed to read from localStorage", error);
    return getInitialDbState();
  }
}

// This function can only be called on the client
export async function writeAllData(data: Omit<GlobalData, 'nextIds' | 'currentBalance' | 'accountBalances'>): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const dataString = JSON.stringify(data);
    window.localStorage.setItem(DB_KEY, dataString);
  } catch (error) {
    console.error("Failed to write to localStorage", error);
  }
}
