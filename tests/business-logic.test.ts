import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/services/storage';

describe('Real Business Logic & Stock Calculations', () => {
  const companyId = 'test-company-1';

  beforeEach(async () => {
    await storage.clearAllCompanyData(companyId);
  });

  it('should successfully create a product and record initial stock', async () => {
    const product = await storage.saveProduct(companyId, {
      name: 'Monitor Ultra HD',
      sku: 'MON-01',
      price: 1500,
      cost: 1000,
      stock: 10,
      min_stock: 3,
    });

    expect(product.id).toBeDefined();
    expect(product.stock).toBe(10);
    expect(product.price).toBe(1500);

    const list = await storage.getProducts(companyId);
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Monitor Ultra HD');
  });

  it('should deduct stock automatically and atomically upon sale', async () => {
    const product = await storage.saveProduct(companyId, {
      name: 'Teclado Mecânico',
      price: 200,
      cost: 100,
      stock: 8,
    });

    const customer = await storage.saveCustomer(companyId, {
      name: 'Empresa Alpha',
      email: 'alpha@test.com',
    });

    const sale = await storage.createSale(companyId, {
      customer_id: customer.id,
      payment_method: 'pix',
      items: [
        { product_id: product.id, quantity: 3, unit_price: 200 }
      ],
    });

    expect(sale.id).toBeDefined();
    expect(sale.total).toBe(600);

    // Verify stock is now 5 (8 - 3)
    const products = await storage.getProducts(companyId);
    const updatedProd = products.find(p => p.id === product.id);
    expect(updatedProd?.stock).toBe(5);

    // Verify customer metrics updated
    const customers = await storage.getCustomers(companyId);
    const updatedCust = customers.find(c => c.id === customer.id);
    expect(updatedCust?.total_purchases).toBe(600);
    expect(updatedCust?.purchase_count).toBe(1);
    expect(updatedCust?.last_purchase_at).toBeDefined();
  });

  it('should prevent sale and throw error when stock is insufficient (no negative stock)', async () => {
    const product = await storage.saveProduct(companyId, {
      name: 'Mousepad Gamer',
      price: 50,
      stock: 2,
    });

    await expect(storage.createSale(companyId, {
      payment_method: 'pix',
      items: [
        { product_id: product.id, quantity: 5, unit_price: 50 }
      ],
    })).rejects.toThrow(/Estoque insuficiente/);

    // Verify stock remains untouched at 2
    const products = await storage.getProducts(companyId);
    expect(products[0].stock).toBe(2);
  });

  it('should automatically generate a receivable for credit / prazo sales', async () => {
    const product = await storage.saveProduct(companyId, {
      name: 'Cadeira Gamer',
      price: 800,
      stock: 5,
    });

    await storage.createSale(companyId, {
      payment_method: 'a_prazo',
      items: [
        { product_id: product.id, quantity: 1, unit_price: 800 }
      ],
    });

    const receivables = await storage.getReceivables(companyId);
    expect(receivables.length).toBe(1);
    expect(receivables[0].amount).toBe(800);
    expect(receivables[0].status).toBe('pendente');
  });
});
