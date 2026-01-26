
export type Currency = 'USD' | 'VES';
export type AccountType = 'Ahorros' | 'Corriente' | 'Efectivo' | 'Tarjeta de Crédito' | 'Billetera Virtual' | 'Broker';
export type TransactionType = 'Ingreso' | 'Gasto' | 'Transferencia' | 'Ajuste';
export type Category = string;

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Nuevo: Contraseña para acceso protegido
}

export interface BankAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  color: string;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  commission?: number; 
  type: TransactionType;
  category: string;
  date: string;
  currency: Currency;
  accountId: string;
  toAccountId?: string;
  targetAmount?: number;
  relatedInvestmentId?: string;
  adjustmentDirection?: 'plus' | 'minus';
  isWorkRelated?: boolean; 
  workStatus?: 'pending' | 'settled';
  isThirdParty?: boolean; 
  thirdPartyOwner?: string; 
}

export interface Investment {
  id: string;
  name: string;
  ticker?: string;
  brokerId?: string; 
  platform?: string;
  initialInvestment: number; 
  quantity: number; 
  buyPrice: number; 
  currentMarketPrice: number; 
  value: number; 
  currency: Currency;
  performance: number;
  category: string;
  date?: string;
  yieldRate?: number;
  yieldPeriod?: 'Mensual' | 'Anual';
  participationPercent?: number;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  currency: Currency;
  month: string; 
  spent?: number; 
}

export const DEFAULT_EXPENSE_CATEGORIES = ['Comida', 'Transporte', 'Servicios', 'Salud', 'Educación', 'Ocio', 'Compras', 'Comisiones', 'Otros'];
export const DEFAULT_INCOME_CATEGORIES = ['Sueldo', 'Freelance', 'Ventas', 'Inversiones', 'Regalos', 'Otros'];
