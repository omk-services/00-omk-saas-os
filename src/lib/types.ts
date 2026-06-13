export type TabType =
  | 'dashboard'
  | 'finance'
  | 'people'
  | 'clients'
  | 'documents'
  | 'tasks'
  | 'sop'
  | 'legal'
  | 'agents'
  | 'growth'
  | 'sales'
  | 'marketplace'
  | 'it-data'
  | 'settings';

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

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  type: 'Founder' | 'Freelance' | 'AI';
  load: number;
}

export interface RoleAllocation {
  id: string;
  domain: string;
  ownerName: string;
  ownerAvatar: string;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  deadline: string;
  completed: boolean;
  sopLink?: string;
}

export interface LegalDoc {
  id: string;
  title: string;
  type: 'PDF' | 'DOCX';
  date: string;
  status: 'Signed' | 'Pending' | 'Draft';
  category: 'Client' | 'Freelance' | 'Corporate';
}

export interface Lead {
  id: string;
  name: string;
  value: string;
  status: 'Lead' | 'In Discussion' | 'Won';
  agency?: string;
  bleed?: string;
  bottleneck?: string;
}

export interface SaleAgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Processing' | 'Idle';
  iconName: 'Brain' | 'Cpu' | 'ShieldCheck' | 'Activity';
}

export interface SalePipelineItem {
  id: string;
  name: string;
  sub: string;
}

export interface SalePipelineColumn {
  id: string;
  title: string;
  items: SalePipelineItem[];
}

export interface SaleLog {
  id: string;
  time: string;
  agent: string;
  msg: string;
  status: 'success' | 'info' | 'system';
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
}

export interface StackConnection {
  id: string;
  name: string;
  status: 'Connected' | 'Error' | 'Maintenance';
  latency: string;
  uptime: string;
  type: 'Database' | 'API' | 'Auth' | 'AI';
}

// === Auth + tenant types (Phase C) ===

export interface AuthUser {
  id: string;
  email: string;
  orgId: string | null;
  role: string;
  isAuthenticated: boolean;
}

export interface Organization {
  id: string;
  name: string;
  plan?: string;
  createdAt?: string;
}

export interface Membership {
  userId: string;
  orgId: string;
  role: 'owner' | 'admin' | 'member' | string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
