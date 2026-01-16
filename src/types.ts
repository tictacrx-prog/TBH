export type TransactionType = 'INCOME' | 'EXPENSE';

export type Category = 
  | 'PLANT_PURCHASE' 
  | 'ACCESSORY_PURCHASE' 
  | 'SALE' 
  | 'IMPORT_FEE' 
  | 'SHIPPING' 
  | 'FEES' 
  | 'SUPPLIES' 
  | 'COGS' 
  | 'TAX_PAYMENT'
  | 'OTHER';

export type Source = 'PALMSTREET' | 'ONLINE' | 'OVERSEAS' | 'LOCAL' | 'OTHER';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: Category;
  description: string;
  amount: number;
  source: Source;
  linkedPlantId?: string;
  isPalmstreetFee?: boolean;
}

export interface Plant {
  id: string;
  name: string;
  purchasePrice: number;
  purchaseDate: string;
  source: Source;
  importFees: number;
  status: 'MOTHER' | 'FOR_SALE' | 'SOLD' | 'ARCHIVED';
  initialBasis: number; // Purchase Price + Import Fees
  remainingBasis: number; // Basis after selling cuttings
  notes?: string;
}

export interface BusinessState {
  transactions: Transaction[];
  plants: Plant[];
  settings: {
    vaTaxRate: number;
    fedTaxRate: number;
    palmstreetFeeRate: number;
  };
}