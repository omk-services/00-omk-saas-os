export type TabType = 'dashboard' | 'finance' | 'clients' | 'documents' | 'agents' | 'sop' | 'settings';

export interface Client {
  id: string;
  name: string;
  email: string;
  service: string;
  status: string;
  progress: number;
  date: string;
}

export interface Document {
  id: string;
  name: string;
  client: string;
  type: string;
  status: string;
  size: string;
  date: string;
}

export interface Agent {
  id: string;
  name: string;
  desc: string;
  status: string;
  tasks: number;
  totalTasks: number;
  accuracy: number;
  time: string;
  capabilities: string[];
}

export interface Invoice {
  id: string;
  client: string;
  service: string;
  amount: number;
  status: string;
  due: string;
}

export interface Sop {
  id: string;
  title: string;
  category: string;
  steps: number;
  time: string;
  uses: number;
  rating: number;
}
