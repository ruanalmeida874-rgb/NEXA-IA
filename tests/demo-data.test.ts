import { describe, it, expect } from 'vitest';
import { storage } from '../src/services/storage';
import { demoService } from '../src/services/demoService';

describe('Demo Data & Reset System', () => {
  const companyId = 'demo-test-company';

  it('should start completely empty', async () => {
    await storage.clearAllCompanyData(companyId);

    const customers = await storage.getCustomers(companyId);
    const products = await storage.getProducts(companyId);
    const sales = await storage.getSales(companyId);
    const expenses = await storage.getExpenses(companyId);
    const tasks = await storage.getTasks(companyId);
    const leads = await storage.getLeads(companyId);

    expect(customers.length).toBe(0);
    expect(products.length).toBe(0);
    expect(sales.length).toBe(0);
    expect(expenses.length).toBe(0);
    expect(tasks.length).toBe(0);
    expect(leads.length).toBe(0);
  });

  it('should load full demo dataset (20 customers, 15 products, 30 sales, 10 expenses, 10 tasks, 10 leads)', async () => {
    await demoService.loadDemoData(companyId);

    const customers = await storage.getCustomers(companyId);
    const products = await storage.getProducts(companyId);
    const sales = await storage.getSales(companyId);
    const expenses = await storage.getExpenses(companyId);
    const tasks = await storage.getTasks(companyId);
    const leads = await storage.getLeads(companyId);

    expect(customers.length).toBe(20);
    expect(products.length).toBe(15);
    expect(sales.length).toBe(30);
    expect(expenses.length).toBe(10);
    expect(tasks.length).toBe(10);
    expect(leads.length).toBe(10);
  });

  it('should completely clear all demo data when requested', async () => {
    await demoService.clearDemoData(companyId);

    const customers = await storage.getCustomers(companyId);
    const products = await storage.getProducts(companyId);
    const sales = await storage.getSales(companyId);
    const expenses = await storage.getExpenses(companyId);
    const tasks = await storage.getTasks(companyId);
    const leads = await storage.getLeads(companyId);

    expect(customers.length).toBe(0);
    expect(products.length).toBe(0);
    expect(sales.length).toBe(0);
    expect(expenses.length).toBe(0);
    expect(tasks.length).toBe(0);
    expect(leads.length).toBe(0);
  });
});
