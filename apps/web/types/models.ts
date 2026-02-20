export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type EstimateStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'INVOICED';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'VOID';

export type LineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
};

export type Estimate = {
  id: string;
  number: string;
  status: EstimateStatus;
  movingDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerJobAddress: string;
  subtotal: number;
  tax: number;
  total: number;
  currencySymbol: string;
  notes?: string;
  lineItems: LineItem[];
};

export type Invoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  currencySymbol: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerJobAddress: string;
  lineItems: LineItem[];
};

export type Employee = {
  id: string;
  name: string;
  phone: string;
  role: Role;
};

export type TimeEntry = {
  id: string;
  employeeId: string;
  clockIn: string;
  clockOut: string | null;
  durationMinutes: number | null;
  employee: Employee;
};

export type Job = {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  address: string;
  estimateId: string | null;
  assignments: Array<{ id: string; employeeId: string; employee: Employee }>;
};
