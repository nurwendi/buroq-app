export interface Customer {
  id: string;
  username: string;
  name?: string;
  customerId?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  email?: string;
  agentId?: string;
  technicianId?: string;
  ownerId?: string;
  
  // Appended runtime flags
  isOnline?: boolean;
  ipAddress?: string | null;
  isIsolir?: boolean;
}

export interface Payment {
  id: string;
  invoiceNumber: string;
  username: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'cancelled';
  date: string; // ISO date string
  month?: number;
  year?: number;
  notes?: string;
  ownerId?: string;
}

export interface ActiveConnection {
  name: string;
  address?: string;
  'remote-address'?: string;
  'rx-byte'?: string;
  'tx-byte'?: string;
  uptime?: string;
}

export interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
  phone?: string;
  fullName?: string;
  ownerId?: string;
}
