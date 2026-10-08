// ==============================================================================
// NEXA — Funcionário de IA: Core Data Models & TypeScript Types
// ==============================================================================

export type UserRole = 'owner' | 'admin' | 'member';

export interface Company {
  id: string;
  name: string;
  segment?: string | null;
  owner_name?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  employee_count?: string | null;
  main_goal?: string | null;
  ai_employee_name: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_id?: string | null;
  full_name?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type CustomerStatus = 'ativo' | 'inativo' | 'potencial';

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  company_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  document?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  status: CustomerStatus;
  total_purchases: number;
  purchase_count: number;
  last_purchase_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'ativo' | 'inativo';

export interface Product {
  id: string;
  company_id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  supplier?: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'boleto' | 'a_prazo';
export type SaleStatus = 'concluida' | 'cancelada';

export interface SaleItem {
  id?: string;
  sale_id?: string;
  company_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost?: number;
  total: number;
  created_at?: string;
}

export interface Sale {
  id: string;
  company_id: string;
  customer_id?: string | null;
  customer?: Customer | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  sale_date: string;
  notes?: string | null;
  items?: SaleItem[];
  created_at: string;
  updated_at: string;
}

export type FinancialStatus = 'pago' | 'pendente' | 'vencido';

export interface Expense {
  id: string;
  company_id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  due_date: string;
  status: FinancialStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Receivable {
  id: string;
  company_id: string;
  customer_id?: string | null;
  customer?: Customer | null;
  sale_id?: string | null;
  description: string;
  amount: number;
  due_date: string;
  status: FinancialStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payable {
  id: string;
  company_id: string;
  supplier?: string | null;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  status: FinancialStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = 'baixa' | 'media' | 'alta';
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida';

export interface Task {
  id: string;
  company_id: string;
  title: string;
  description?: string | null;
  assignee?: string | null;
  priority: TaskPriority;
  due_date?: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export type LeadStage = 'novo' | 'contato' | 'interessado' | 'proposta' | 'negociacao' | 'cliente' | 'perdido';

export interface Lead {
  id: string;
  company_id: string;
  name: string;
  company_name?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  stage: LeadStage;
  estimated_value: number;
  source?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 'alerta' | 'aviso' | 'info' | 'sucesso';

export interface Notification {
  id: string;
  company_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string | null;
  created_at: string;
}

export interface AIConversation {
  id: string;
  company_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export type AIMessageRole = 'user' | 'assistant' | 'system';
export type ActionStatus = 'pending_confirmation' | 'confirmed' | 'cancelled' | 'executed';

export interface AIMessageActionData {
  tool: string;
  description: string;
  parameters: Record<string, any>;
  summary: Record<string, any>;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  company_id: string;
  role: AIMessageRole;
  content: string;
  action_data?: AIMessageActionData | null;
  action_status?: ActionStatus | null;
  created_at: string;
}

export interface DashboardMetrics {
  monthRevenue: number;
  salesCount: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalReceivables: number;
  totalPayables: number;
  totalExpenses: number;
  recentSales: Sale[];
  salesByPeriod: { date: string; amount: number }[];
  revenueVsExpense: { month: string; receita: number; despesa: number }[];
  importantAlerts: {
    id: string;
    type: 'alerta' | 'aviso' | 'info';
    title: string;
    description: string;
    link?: string;
  }[];
}
