import { Client, Document, Agent, Invoice, Sop } from './types';

export const CLIENTS: Client[] = [
  { id: 'C1', name: 'John Smith', email: 'john.smith@email.com', service: 'Immigration Visa', status: 'In Progress', progress: 65, date: 'Oct 14, 2025' },
  { id: 'C2', name: 'Maria Garcia', email: 'maria.g@corp.com', service: 'Business Formation', status: 'Under Review', progress: 85, date: 'Oct 20, 2025' },
  { id: 'C3', name: 'Ahmed Hassan', email: 'ahmed.h@domain.com', service: 'Tax Consulting', status: 'Submitted', progress: 100, date: 'Sep 30, 2025' },
  { id: 'C4', name: 'Chen Wei', email: 'c.wei@startup.io', service: 'Certified Translation', status: 'New Request', progress: 15, date: 'Nov 02, 2025' },
  { id: 'C5', name: 'Sarah Miller', email: 'smiller@llc.co', service: 'Notarial', status: 'Validated', progress: 100, date: 'Oct 05, 2025' }
];

export const DOCUMENTS: Document[] = [
  { id: 'D1', name: 'Visa Application Form I-130.pdf', client: 'John Smith', type: 'Immigration', status: 'Auto-filled', size: '2.4 MB', date: 'Oct 7, 2025' },
  { id: 'D2', name: 'Articles of Incorporation.pdf', client: 'Maria Garcia', type: 'Business', status: 'Pending Signature', size: '1.1 MB', date: 'Oct 8, 2025' },
  { id: 'D3', name: 'Q3 Tax Declaration.pdf', client: 'Ahmed Hassan', type: 'Tax', status: 'Completed', size: '3.5 MB', date: 'Sep 29, 2025' },
  { id: 'D4', name: 'Birth Certificate_EN.pdf', client: 'Chen Wei', type: 'Translation', status: 'Under Review', size: '0.8 MB', date: 'Oct 9, 2025' }
];

export const AGENTS: Agent[] = [
  { id: 'A1', name: 'Intake-Agent', desc: 'Collects and validates CRM data', status: 'active', tasks: 24, totalTasks: 1847, accuracy: 99.1, time: '2.3 min', capabilities: ['Multi-language form collection', 'Automatic data validation', 'CRM integration', 'Checklist generation'] },
  { id: 'A2', name: 'Translator-Agent', desc: 'Certified translation & human validation', status: 'active', tasks: 15, totalTasks: 923, accuracy: 96.5, time: '5.8 min', capabilities: ['50+ language pairs', 'Legal document translation', 'Quality validation workflow', 'Certified output'] },
  { id: 'A3', name: 'DocuFlow-Agent', desc: 'Auto-fills official templates', status: 'active', tasks: 42, totalTasks: 4120, accuracy: 99.8, time: '1.2 min', capabilities: ['PDF parsing', 'Smart field mapping', 'E-signature routing', 'Version control'] },
  { id: 'A4', name: 'Compliance-Sentinel', desc: 'Tracks deadlines and missing items', status: 'monitoring', tasks: 8, totalTasks: 560, accuracy: 100, time: '0.5 min', capabilities: ['Deadline alerts', 'Missing document tracking', 'SLA monitoring', 'Risk scoring'] },
  { id: 'A5', name: 'Finance-Flow', desc: 'Automated Stripe/PayPal billing', status: 'active', tasks: 12, totalTasks: 840, accuracy: 100, time: '1.0 min', capabilities: ['Invoice generation', 'Payment collection', 'Reconciliation', 'Tax calculation'] },
  { id: 'A6', name: 'Client-Comms', desc: 'Multi-channel notifications', status: 'active', tasks: 89, totalTasks: 12050, accuracy: 98.2, time: '0.1 min', capabilities: ['Email automation', 'SMS alerts', 'Status updates', 'Query routing'] }
];

export const INVOICES: Invoice[] = [
  { id: 'INV-001', client: 'John Smith', service: 'Immigration Visa', amount: 1500, status: 'Paid', due: 'Oct 7, 2025' },
  { id: 'INV-002', client: 'Maria Garcia', service: 'Business Formation', amount: 850, status: 'Pending', due: 'Oct 15, 2025' },
  { id: 'INV-003', client: 'Chen Wei', service: 'Translation', amount: 350, status: 'Overdue', due: 'Oct 1, 2025' },
  { id: 'INV-004', client: 'Ahmed Hassan', service: 'Tax Consulting', amount: 1200, status: 'Paid', due: 'Sep 25, 2025' },
  { id: 'INV-005', client: 'Sarah Miller', service: 'Notarial', amount: 450, status: 'Paid', due: 'Sep 28, 2025' }
];

export const SOPS: Sop[] = [
  { id: 'S1', title: 'Immigration Visa Application Workflow', category: 'Immigration', steps: 12, time: '45 min', uses: 189, rating: 4.8 },
  { id: 'S2', title: 'Client Intake & Onboarding', category: 'General', steps: 8, time: '15 min', uses: 234, rating: 4.9 },
  { id: 'S3', title: 'Corporate Tax Filing Preparation', category: 'Tax', steps: 15, time: '60 min', uses: 85, rating: 4.6 },
  { id: 'S4', title: 'Certified Technical Translation', category: 'Translation', steps: 6, time: '120 min', uses: 142, rating: 4.7 },
  { id: 'S5', title: 'LLC Formation Protocol', category: 'Business', steps: 10, time: '30 min', uses: 110, rating: 4.9 },
  { id: 'S6', title: 'Notary Public Verification', category: 'Notarial', steps: 5, time: '10 min', uses: 310, rating: 5.0 },
  { id: 'S7', title: 'System Incident Response', category: 'Technical', steps: 9, time: '20 min', uses: 12, rating: 4.5 },
  { id: 'S8', title: 'Overdue Payment Collection', category: 'Communication', steps: 4, time: '5 min', uses: 45, rating: 4.8 }
];
