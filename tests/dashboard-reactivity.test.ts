import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/services/storage';
import { dashboardService } from '../src/services/dashboardService';

describe('Dashboard Live Reactivity & Dynamic Metrics (No Hardcoded Values)', () => {
  const companyId = 'dashboard-test-company';

  beforeEach(async () => {
    await storage.clearAllCompanyData(companyId);
  });

  it('should start completely empty with 0s and no false metrics', async () => {
    const metrics = await dashboardService.getMetrics(companyId);
    expect(metrics.monthRevenue).toBe(0);
    expect(metrics.salesCount).toBe(0);
    expect(metrics.activeCustomers).toBe(0);
    expect(metrics.inactiveCustomers).toBe(0);
    expect(metrics.totalExpenses).toBe(0);
    expect(metrics.totalReceivables).toBe(0);
    expect(metrics.totalPayables).toBe(0);
    expect(metrics.recentSales.length).toBe(0);
    expect(metrics.importantAlerts.length).toBe(0);
  });

  it('should dynamically reflect newly created customers, products, sales, and expenses', async () => {
    // 1. Create a customer
    const customer = await storage.saveCustomer(companyId, {
      name: 'Cliente Real Dashboard',
      status: 'ativo',
    });

    let metrics = await dashboardService.getMetrics(companyId);
    expect(metrics.activeCustomers).toBe(1);
    expect(metrics.newCustomers).toBe(1);

    // 2. Create product with low stock
    const product = await storage.saveProduct(companyId, {
      name: 'Item Crítico',
      price: 250,
      stock: 2,
      min_stock: 5,
    });

    metrics = await dashboardService.getMetrics(companyId);
    expect(metrics.importantAlerts.some(a => a.id === 'low-stock')).toBe(true);

    // 3. Create expense
    await storage.saveExpense(companyId, {
      description: 'Conta Internet',
      amount: 199.90,
      date: new Date().toISOString().split('T')[0],
    });

    metrics = await dashboardService.getMetrics(companyId);
    expect(metrics.totalExpenses).toBe(199.90);

    // 4. Create sale
    await storage.createSale(companyId, {
      customer_id: customer.id,
      payment_method: 'pix',
      items: [{ product_id: product.id, quantity: 1, unit_price: 250 }],
    });

    metrics = await dashboardService.getMetrics(companyId);
    expect(metrics.monthRevenue).toBe(250);
    expect(metrics.salesCount).toBe(1);
    expect(metrics.recentSales.length).toBe(1);
    expect(metrics.recentSales[0].total).toBe(250);

    // 5. Create payables & receivables
    await storage.saveReceivable(companyId, {
      description: 'Recebível Teste',
      amount: 400,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pendente',
    });
    await storage.savePayable(companyId, {
      description: 'Fornecedor Teste',
      amount: 150,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pendente',
    });

    metrics = await dashboardService.getMetrics(companyId);
    expect(metrics.totalReceivables).toBe(400);
    expect(metrics.totalPayables).toBe(150);
    expect(metrics.importantAlerts.some(a => a.id === 'due-payables')).toBe(true);
  });
});
