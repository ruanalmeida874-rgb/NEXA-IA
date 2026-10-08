import { storage } from './storage';
import { DashboardMetrics } from '@/types';
import { getDaysInactive } from '@/utils/formatters';

export const dashboardService = {
  async getMetrics(companyId: string): Promise<DashboardMetrics> {
    const [
      customers,
      products,
      sales,
      expenses,
      receivables,
      payables,
    ] = await Promise.all([
      storage.getCustomers(companyId),
      storage.getProducts(companyId),
      storage.getSales(companyId),
      storage.getExpenses(companyId),
      storage.getReceivables(companyId),
      storage.getPayables(companyId),
    ]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Month Revenue & Sales count
    const monthSales = sales.filter(s => {
      if (s.status === 'cancelada') return false;
      const d = new Date(s.sale_date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const monthRevenue = monthSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const salesCount = monthSales.length;

    // 2. Customers metrics
    const newCustomers = customers.filter(c => {
      const d = new Date(c.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;

    const activeCustomers = customers.filter(c => c.status === 'ativo').length;
    const inactiveCustomers = customers.filter(c => {
      if (c.status === 'inativo') return true;
      const days = getDaysInactive(c.last_purchase_at);
      return days !== null && days > 60;
    }).length;

    // 3. Finance
    const totalReceivables = receivables
      .filter(r => r.status === 'pendente')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const totalPayables = payables
      .filter(p => p.status === 'pendente' || p.status === 'vencido')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalExpenses = expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 4. Sales by Period (Last 7 active days or daily breakdown of last 14 days)
    const salesByDayMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      salesByDayMap.set(key, 0);
    }

    sales.forEach(s => {
      if (s.status === 'cancelada') return;
      const d = new Date(s.sale_date);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (salesByDayMap.has(key)) {
        salesByDayMap.set(key, (salesByDayMap.get(key) || 0) + Number(s.total || 0));
      }
    });

    const salesByPeriod = Array.from(salesByDayMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));

    // 5. Revenue vs Expenses (Last 6 months)
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const revenueVsExpenseMap = new Map<string, { receita: number; despesa: number }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const label = `${monthsNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      revenueVsExpenseMap.set(label, { receita: 0, despesa: 0 });
    }

    sales.forEach(s => {
      if (s.status === 'cancelada') return;
      const d = new Date(s.sale_date);
      const label = `${monthsNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      if (revenueVsExpenseMap.has(label)) {
        const item = revenueVsExpenseMap.get(label)!;
        item.receita += Number(s.total || 0);
      }
    });

    expenses.forEach(e => {
      const d = new Date(e.date);
      const label = `${monthsNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      if (revenueVsExpenseMap.has(label)) {
        const item = revenueVsExpenseMap.get(label)!;
        item.despesa += Number(e.amount || 0);
      }
    });

    const revenueVsExpense = Array.from(revenueVsExpenseMap.entries()).map(([month, val]) => ({
      month,
      receita: Math.round(val.receita),
      despesa: Math.round(val.despesa),
    }));

    // 6. Important Alerts & Activities
    const importantAlerts: DashboardMetrics['importantAlerts'] = [];

    // Low stock products
    const lowStock = products.filter(p => p.stock <= p.min_stock && p.status === 'ativo');
    if (lowStock.length > 0) {
      importantAlerts.push({
        id: 'low-stock',
        type: 'alerta',
        title: `${lowStock.length} produto(s) com estoque baixo`,
        description: `Itens como "${lowStock[0].name}" precisam de reposição urgente.`,
        link: '/produtos',
      });
    }

    // Inactive customers (>60 days)
    const inactiveList = customers.filter(c => {
      const days = getDaysInactive(c.last_purchase_at);
      return days !== null && days >= 60;
    });
    if (inactiveList.length > 0) {
      importantAlerts.push({
        id: 'inactive-customers',
        type: 'aviso',
        title: `${inactiveList.length} cliente(s) inativo(s) há mais de 60 dias`,
        description: `Ex: ${inactiveList[0].name}. Recomendado envio de mensagem ou oferta.`,
        link: '/clientes',
      });
    }

    // Payables due soon
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    const duePayables = payables.filter(p => (p.due_date === today || p.due_date === tomorrow || p.status === 'vencido') && p.status !== 'pago');
    if (duePayables.length > 0) {
      importantAlerts.push({
        id: 'due-payables',
        type: 'alerta',
        title: `${duePayables.length} conta(s) a pagar vencendo ou em atraso`,
        description: `Total de R$ ${duePayables.reduce((acc, p) => acc + Number(p.amount), 0).toFixed(2)} requer atenção.`,
        link: '/financeiro',
      });
    }

    // Receivables pending
    const overdueReceivables = receivables.filter(r => r.status === 'vencido');
    if (overdueReceivables.length > 0) {
      importantAlerts.push({
        id: 'overdue-receivables',
        type: 'aviso',
        title: `${overdueReceivables.length} conta(s) a receber em atraso`,
        description: 'Contate os clientes inadimplentes para regularização.',
        link: '/financeiro',
      });
    }

    return {
      monthRevenue,
      salesCount,
      newCustomers,
      activeCustomers,
      inactiveCustomers,
      totalReceivables,
      totalPayables,
      totalExpenses,
      recentSales: sales.slice(0, 5),
      salesByPeriod,
      revenueVsExpense,
      importantAlerts,
    };
  }
};
