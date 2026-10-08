import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/services/storage';

describe('Tenant Isolation Tests (Strict Multi-Tenancy)', () => {
  const companyA = 'tenant-company-aaa';
  const companyB = 'tenant-company-bbb';

  beforeEach(async () => {
    await storage.clearAllCompanyData(companyA);
    await storage.clearAllCompanyData(companyB);
  });

  it('should isolate customers between companies', async () => {
    // Company A creates customer
    await storage.saveCustomer(companyA, {
      name: 'Cliente Exclusivo A',
      email: 'a@client.com',
    });

    // Company B creates customer
    await storage.saveCustomer(companyB, {
      name: 'Cliente Exclusivo B',
      email: 'b@client.com',
    });

    // Company A should only see its customer
    const listA = await storage.getCustomers(companyA);
    expect(listA.length).toBe(1);
    expect(listA[0].name).toBe('Cliente Exclusivo A');

    // Company B should only see its customer
    const listB = await storage.getCustomers(companyB);
    expect(listB.length).toBe(1);
    expect(listB[0].name).toBe('Cliente Exclusivo B');
  });

  it('should isolate products and inventory between companies', async () => {
    await storage.saveProduct(companyA, {
      name: 'Produto da Empresa A',
      stock: 50,
      price: 100,
    });

    const productsB = await storage.getProducts(companyB);
    expect(productsB.length).toBe(0);

    const productsA = await storage.getProducts(companyA);
    expect(productsA.length).toBe(1);
    expect(productsA[0].name).toBe('Produto da Empresa A');
  });

  it('should isolate financial expenses and receivables between companies', async () => {
    await storage.saveExpense(companyA, {
      description: 'Conta de Luz Empresa A',
      amount: 450,
    });

    const expensesB = await storage.getExpenses(companyB);
    expect(expensesB.length).toBe(0);

    const expensesA = await storage.getExpenses(companyA);
    expect(expensesA.length).toBe(1);
  });
});
