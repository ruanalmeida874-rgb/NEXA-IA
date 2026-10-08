import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/services/storage';
import { aiService } from '../src/services/aiService';

describe('NEXA AI Agent & Action Confirmation Tests', () => {
  const companyId = 'ai-test-company';

  beforeEach(async () => {
    await storage.clearAllCompanyData(companyId);
  });

  it('should query sales accurately using real company data', async () => {
    // 0 sales initially
    const resEmpty = await aiService.processUserMessage(companyId, 'Como estão minhas vendas?');
    expect(resEmpty.reply).toContain('Ainda não temos registros de vendas');

    // Add real product and sale
    const product = await storage.saveProduct(companyId, { name: 'Serviço Consultoria', price: 500, stock: 10 });
    await storage.createSale(companyId, {
      payment_method: 'pix',
      items: [{ product_id: product.id, quantity: 2, unit_price: 500 }],
    });

    const resWithSales = await aiService.processUserMessage(companyId, 'Quanto vendi este mês?');
    expect(resWithSales.reply).toContain('R$ 1.000,00');
    expect(resWithSales.reply).toContain('1 transações');
  });

  it('should answer read queries using real data without fabricating numbers', async () => {
    // 1. Clientes
    await storage.saveCustomer(companyId, { name: 'Cliente Real 1', total_purchases: 800 });
    const resCust = await aiService.processUserMessage(companyId, 'Quais são meus clientes?');
    expect(resCust.reply).toContain('Cliente Real 1');

    // 2. Produtos com estoque baixo
    await storage.saveProduct(companyId, { name: 'Produto Crítico', stock: 1, min_stock: 5 });
    const resStock = await aiService.processUserMessage(companyId, 'Quais produtos estão com estoque baixo?');
    expect(resStock.reply).toContain('Produto Crítico');
    expect(resStock.reply).toContain('apenas 1 unid.');

    // 3. Contas a pagar e receber
    await storage.saveReceivable(companyId, { description: 'Título a Receber 1', amount: 1500, due_date: '2026-10-20' });
    await storage.savePayable(companyId, { description: 'Fornecedor A Pagar 1', amount: 900, due_date: '2026-10-22' });
    const resFinance = await aiService.processUserMessage(companyId, 'Quanto tenho para receber?');
    expect(resFinance.reply).toContain('R$ 1.500,00');
    expect(resFinance.reply).toContain('R$ 900,00');
  });

  it('should identify inactive customers accurately', async () => {
    await storage.saveCustomer(companyId, {
      name: 'Cliente Recente',
      status: 'ativo',
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 70);

    const oldCustomer = await storage.saveCustomer(companyId, {
      name: 'Cliente Antigo Esquecido',
      status: 'inativo',
    });
    await storage.saveCustomer(companyId, {
      id: oldCustomer.id,
      name: oldCustomer.name,
      last_purchase_at: pastDate.toISOString(),
      status: 'inativo',
    });

    const res = await aiService.processUserMessage(companyId, 'Quais clientes estão inativos?');
    expect(res.reply).toContain('Cliente Antigo Esquecido');
  });

  it('should test "Cadastre um cliente chamado João da Silva" with cancellation and confirmation', async () => {
    const prompt = 'Cadastre um cliente chamado João da Silva';
    const res = await aiService.processUserMessage(companyId, prompt);

    expect(res.actionData).toBeDefined();
    expect(res.actionData?.tool).toBe('create_customer');
    expect(res.actionData?.parameters.name).toBe('João da Silva');

    // Step 1: Cancellation test - database must remain unmodified
    const customersBefore = await storage.getCustomers(companyId);
    expect(customersBefore.length).toBe(0);

    // Step 2: Confirmation test - database is only modified upon confirmation
    const confirmResult = await aiService.confirmAndExecuteAction(companyId, res.actionData!);
    expect(confirmResult.success).toBe(true);

    const customersAfter = await storage.getCustomers(companyId);
    expect(customersAfter.length).toBe(1);
    expect(customersAfter[0].name).toBe('João da Silva');
  });

  it('should test "Crie uma tarefa para ligar para Maria amanhã" with confirmation', async () => {
    const prompt = 'Crie uma tarefa para ligar para Maria amanhã';
    const res = await aiService.processUserMessage(companyId, prompt);

    expect(res.actionData).toBeDefined();
    expect(res.actionData?.tool).toBe('create_task');
    expect(res.actionData?.parameters.title).toContain('ligar para Maria');

    // Before confirmation, no tasks in DB
    const tasksBefore = await storage.getTasks(companyId);
    expect(tasksBefore.length).toBe(0);

    // Confirm
    const confirmResult = await aiService.confirmAndExecuteAction(companyId, res.actionData!);
    expect(confirmResult.success).toBe(true);

    const tasksAfter = await storage.getTasks(companyId);
    expect(tasksAfter.length).toBe(1);
    expect(tasksAfter[0].title).toContain('ligar para Maria');
  });
});
