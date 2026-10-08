import { describe, it, expect } from 'vitest';
import { storage } from '../src/services/storage';
import { demoService } from '../src/services/demoService';
import { dashboardService } from '../src/services/dashboardService';
import { aiService } from '../src/services/aiService';

describe('End-to-End Real User Flow Simulation Audit', () => {
  const companyId = 'e2e-audit-company';

  it('Flow: Full cycle from empty to demo to clear', async () => {
    // 1. Initial State: Company starts completely empty
    await storage.clearAllCompanyData(companyId);
    let metrics = await dashboardService.getMetrics(companyId);
    expect(metrics.salesCount).toBe(0);
    expect(metrics.activeCustomers).toBe(0);
    expect(metrics.monthRevenue).toBe(0);

    // 2. Customers: Create customer manually
    const customer = await storage.saveCustomer(companyId, {
      name: 'Padaria Modelo Ltda',
      phone: '(11) 98888-1234',
      status: 'ativo',
    });
    expect(customer.id).toBeDefined();

    // 3. Products: Create 2 products
    const prod1 = await storage.saveProduct(companyId, {
      name: 'Farinha Especial 25kg',
      price: 120,
      cost: 70,
      stock: 10,
      min_stock: 3,
    });
    const prod2 = await storage.saveProduct(companyId, {
      name: 'Fermento Biológico 500g',
      price: 25,
      cost: 12,
      stock: 4,
      min_stock: 5, // low stock alert!
    });
    expect(prod1.stock).toBe(10);
    expect(prod2.stock).toBe(4);

    // 4. Sales: Successful sale with customer and prod1
    const sale = await storage.createSale(companyId, {
      customer_id: customer.id,
      payment_method: 'pix',
      items: [{ product_id: prod1.id, quantity: 3, unit_price: 120 }],
    });
    expect(sale.total).toBe(360);

    // Check stock was reduced to 7
    const prodsAfter = await storage.getProducts(companyId);
    expect(prodsAfter.find(p => p.id === prod1.id)?.stock).toBe(7);

    // 5. Overstock Prevention: Attempt sale greater than available stock
    await expect(storage.createSale(companyId, {
      payment_method: 'pix',
      items: [{ product_id: prod1.id, quantity: 99, unit_price: 120 }],
    })).rejects.toThrow(/Estoque insuficiente/);

    // 6. Finance: Create Expense, Receivable, Payable
    await storage.saveExpense(companyId, {
      description: 'Manutenção Forno',
      amount: 300,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pago',
    });
    await storage.saveReceivable(companyId, {
      description: 'Recebível Contrato Mensal',
      amount: 1500,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pendente',
    });
    await storage.savePayable(companyId, {
      description: 'Conta de Gás Industrial',
      amount: 450,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pendente',
    });

    // 7. Tasks: Cycle Pendente -> Em andamento -> Concluída
    const task = await storage.saveTask(companyId, {
      title: 'Realizar pedido de embalagens',
      status: 'pendente',
    });
    expect(task.status).toBe('pendente');

    const taskEmAndamento = await storage.saveTask(companyId, {
      id: task.id,
      status: 'em_andamento',
    });
    expect(taskEmAndamento.status).toBe('em_andamento');

    const taskConcluida = await storage.saveTask(companyId, {
      id: task.id,
      status: 'concluida',
    });
    expect(taskConcluida.status).toBe('concluida');

    // 8. CRM: Create Lead, move across stages, and convert to Customer
    const lead = await storage.saveLead(companyId, {
      name: 'Supermercado Progresso',
      stage: 'novo',
      estimated_value: 5000,
    });
    expect(lead.stage).toBe('novo');

    // Advance to contato
    const leadContato = await storage.saveLead(companyId, { id: lead.id, stage: 'contato' });
    expect(leadContato.stage).toBe('contato');

    // Convert to cliente
    await storage.saveCustomer(companyId, {
      name: lead.name,
      status: 'ativo',
    });
    await storage.saveLead(companyId, { id: lead.id, stage: 'cliente' });
    const customersNow = await storage.getCustomers(companyId);
    expect(customersNow.some(c => c.name === 'Supermercado Progresso')).toBe(true);

    // 9. Dashboard: Metrics changed automatically
    metrics = await dashboardService.getMetrics(companyId);
    expect(metrics.salesCount).toBe(1);
    expect(metrics.monthRevenue).toBe(360);
    expect(metrics.totalExpenses).toBe(300);
    expect(metrics.totalReceivables).toBe(1500);
    expect(metrics.totalPayables).toBe(450);
    expect(metrics.activeCustomers).toBe(2);

    // 10. AI Chat Read Queries & Action confirmation
    const salesAnswer = await aiService.processUserMessage(companyId, 'Quanto vendi este mês?');
    expect(salesAnswer.reply).toContain('360,00');

    // AI mutating prompt
    const aiActionPrompt = await aiService.processUserMessage(companyId, 'Cadastre um cliente chamado Marcos Oliveira');
    expect(aiActionPrompt.actionData).toBeDefined();
    expect(aiActionPrompt.actionData?.parameters.name).toBe('Marcos Oliveira');

    // User confirms
    const confirmRes = await aiService.confirmAndExecuteAction(companyId, aiActionPrompt.actionData!);
    expect(confirmRes.success).toBe(true);
    const customersAfterAI = await storage.getCustomers(companyId);
    expect(customersAfterAI.some(c => c.name === 'Marcos Oliveira')).toBe(true);

    // 11. Demo Mode: Load full demo dataset
    await demoService.loadDemoData(companyId);
    const demoCusts = await storage.getCustomers(companyId);
    const demoProds = await storage.getProducts(companyId);
    const demoSales = await storage.getSales(companyId);
    expect(demoCusts.length).toBe(20);
    expect(demoProds.length).toBe(15);
    expect(demoSales.length).toBe(30);

    // 12. Clear Demo Mode: Return to 0
    await demoService.clearDemoData(companyId);
    const emptyCusts = await storage.getCustomers(companyId);
    const emptySales = await storage.getSales(companyId);
    expect(emptyCusts.length).toBe(0);
    expect(emptySales.length).toBe(0);
  });
});
