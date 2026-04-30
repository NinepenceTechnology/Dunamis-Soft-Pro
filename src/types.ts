export interface Customer {
  id: string;
  name: string;
  phone: string;
  hairType?: string;
  allergies?: string;
  loyalty: 'New' | 'Regular' | 'VIP';
  points: number;
  email?: string;
  lastVisit?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock?: number;
}

export interface Treatment {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in minutes
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  treatmentId: string;
  treatmentName: string;
  professionalId: string;
  professionalName: string;
  date: string; // ISO date
  time: string; // HH:mm
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  commission: number; // percentage
  phone?: string;
  status: 'active' | 'inactive' | 'on_break';
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: string;
  email?: string;
}

export interface Store {
  id: string;
  name: string;
  location: string;
  manager: string;
  phone: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  type: 'product' | 'treatment';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number; // IVA amount
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
  date: string;
  nuit?: string;
}

export type ModuleKey = 
  | 'customers' 
  | 'calendar' 
  | 'products' 
  | 'calculator' 
  | 'statistics' 
  | 'settings'
  | 'inventory'
  | 'finance'
  | 'treatments'
  | 'expenses'
  | 'hr'
  | 'stores'
  | 'reports'
  | 'guide';
