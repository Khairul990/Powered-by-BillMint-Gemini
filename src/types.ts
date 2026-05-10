export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  isPremium: boolean;
  invoiceCount: number;
  lastLogin: number;
  createdAt: number;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  totalDue: number;
  createdAt: number;
}

export type InvoiceStatus = 'Paid' | 'Partial' | 'Due' | 'Draft';
export type InvoiceTemplateType = 'Small Bill' | 'Large Professional';

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'quantity';

export interface InvoiceColumn {
  id: string;
  label: string;
  type: ColumnType;
  visible: boolean;
  order: number;
}

export const DEFAULT_INVOICE_COLUMNS: InvoiceColumn[] = [
  { id: 'designNo', label: 'Design No', type: 'text', visible: true, order: 1 },
  { id: 'workType', label: 'Work Type', type: 'text', visible: true, order: 2 },
  { id: 'name', label: 'Description', type: 'text', visible: true, order: 3 },
  { id: 'size', label: 'Size', type: 'text', visible: true, order: 4 },
  { id: 'quantity', label: 'Qty', type: 'quantity', visible: true, order: 5 },
  { id: 'price', label: 'Rate', type: 'currency', visible: true, order: 6 },
  { id: 'total', label: 'Amount', type: 'currency', visible: true, order: 7 }
];

export interface WorkCharge {
  id: string;
  name: string;
  rate: number;
}

export interface InvoiceItem {
  id: string;
  serialNumber?: string | number;
  name: string;
  designNo?: string;
  workType?: string;
  size?: string;
  quantity: number;
  price: number;
  total: number;
  workCharges?: WorkCharge[];
  [key: string]: any;
}


export interface PaymentRecord {
  id: string;
  amount: number;
  date: number;
  method?: string;
  note?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  invoiceNumber: string;
  date: number;
  dueDate?: number;
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  status: InvoiceStatus;
  templateType?: InvoiceTemplateType;
  notes?: string;
  customerAddress?: string;
  customerEmail?: string;
  payments?: PaymentRecord[];
  createdAt: number;
}

export type ExpenseCategory = 'Shop Rent' | 'Electricity' | 'Staff Salary' | 'Internet' | 'Other Expense';

export interface Expense {
  id: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: number;
  createdAt: number;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  price: number;
  category?: string;
  createdAt: number;
}

export type AppTheme = 'Classic Business' | 'Minimal Clean' | 'Dark Premium' | 'Luxury Gold' | 'Modern Blue SaaS';

export interface BusinessSettings {
  userId: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  logoUrl: string | null;
  brandColor: string;
  invoiceStyle: AppTheme | 'Modern' | 'Classic' | 'Minimum';
  isPremium?: boolean;
  invoiceColumns?: InvoiceColumn[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
