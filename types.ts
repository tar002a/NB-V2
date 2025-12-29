export enum View {
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  INVENTORY = 'INVENTORY',
  SALES = 'SALES',
  CUSTOMERS = 'CUSTOMERS',
  EXPENSES = 'EXPENSES',
  RETURNS = 'RETURNS'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  color: string;
  size: string;
  cost_price: number; // Mapped from DB snake_case
  selling_price: number; // Mapped from DB snake_case
  stock: number;
}

// Helper to map DB Product to App Product (if needed, but we will use the DB shape directly)
// For the frontend, we'll try to stick to the snake_case coming from DB to avoid constant mapping,
// OR map it on fetch. Let's update the interfaces to match what Supabase returns (snake_case generally preferred in SQL)
// but to minimize frontend refactor, we will map data after fetching.

export interface ProductApp {
  id: string;
  name: string;
  category: string;
  color: string;
  size: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
}

export interface CartItem extends ProductApp {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalSpent: number;
  lastPurchase: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  color: string;
  size: string;
}

export interface Sale {
  id: string;
  date: string; // ISO String
  customerName: string;
  customerPhone: string;
  deliveryDuration: string;
  items: SaleItem[];
  totalAmount: number;
  isReturned?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface DashboardStats {
  todaySales: number;
  netProfit: number;
  totalExpenses: number;
  inventoryValue: number;
}
