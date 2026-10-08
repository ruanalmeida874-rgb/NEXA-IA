import { 
  Company, 
  Customer, 
  Product, 
  Sale, 
  SaleItem, 
  Expense, 
  Receivable, 
  Payable, 
  Task, 
  Lead, 
  Notification, 
  AIConversation, 
  AIMessage, 
  Profile 
} from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Persistent Local Store Keys
const STORAGE_PREFIX = 'nexa_data_v1_';
const memoryStore = new Map<string, string>();

function getLocal<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? JSON.parse(raw) : defaultValue;
    }
    const raw = memoryStore.get(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error('Failed to parse storage key:', key, e);
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + key, serialized);
    } else {
      memoryStore.set(STORAGE_PREFIX + key, serialized);
    }
  } catch (e) {
    console.error('Failed to set storage key:', key, e);
  }
}

// ==============================================================================
// AUTH & COMPANY STORE
// ==============================================================================

export const storage = {
  // Profiles & Auth
  async getCurrentProfile(): Promise<{ profile: Profile | null; company: Company | null }> {
    if (isSupabaseConfigured) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { profile: null, company: null };

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.company_id) {
        return { profile: profile || null, company: null };
      }

      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      return { profile, company: company || null };
    }

    // Local fallback
    const profile = getLocal<Profile | null>('current_profile', null);
    const company = getLocal<Company | null>('current_company', null);
    return { profile, company };
  },

  async saveCompany(companyData: Partial<Company>): Promise<Company> {
    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || (await supabase.auth.getUser()).data?.user;
      if (!user) throw new Error('Sessão não encontrada. Por favor, realize o login novamente.');

      if (companyData.id) {
        const { data, error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', companyData.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const newCompanyId = crypto.randomUUID();

        // 1. Try RPC create_company if installed
        try {
          const { data: rpcData, error: rpcErr } = await supabase.rpc('create_company', {
            p_name: companyData.name || 'Minha Empresa',
            p_segment: companyData.segment || null,
            p_owner_name: companyData.owner_name || null,
            p_phone: companyData.phone || null,
            p_email: companyData.email || null,
            p_city: companyData.city || null,
            p_employee_count: companyData.employee_count || null,
            p_main_goal: companyData.main_goal || null,
            p_ai_employee_name: companyData.ai_employee_name || 'NEXA',
          });

          if (!rpcErr && rpcData) {
            return rpcData as Company;
          }
        } catch (e) {
          console.warn('RPC create_company não disponível, usando insert direto:', e);
        }

        // 2. Direct insert with pre-assigned ID so we do not block on .select() RLS
        const { error: compErr } = await supabase
          .from('companies')
          .insert({
            id: newCompanyId,
            name: companyData.name || 'Minha Empresa',
            segment: companyData.segment || null,
            owner_name: companyData.owner_name || null,
            phone: companyData.phone || null,
            email: companyData.email || null,
            city: companyData.city || null,
            employee_count: companyData.employee_count || null,
            main_goal: companyData.main_goal || null,
            ai_employee_name: companyData.ai_employee_name || 'NEXA',
          });
        if (compErr) {
          console.error('Supabase company insert error:', compErr);
          if (compErr.message?.includes('relation "public.companies" does not exist') || compErr.code === '42P01') {
            throw new Error('As tabelas do banco ainda não foram criadas no Supabase. Por favor, acesse o SQL Editor no painel do Supabase, cole e execute o script "supabase/schema.sql".');
          }
          throw compErr;
        }

        // 3. Upsert profile so company_id is immediately assigned to this user
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            company_id: newCompanyId,
            full_name: companyData.owner_name || null,
            role: 'owner',
            updated_at: new Date().toISOString(),
          });

        // 4. Register in company_members
        await supabase
          .from('company_members')
          .upsert({
            company_id: newCompanyId,
            user_id: user.id,
            role: 'owner',
          });

        // 5. Query company now that profile is linked
        const { data: fetched } = await supabase
          .from('companies')
          .select('*')
          .eq('id', newCompanyId)
          .single();

        return fetched || {
          id: newCompanyId,
          name: companyData.name || 'Minha Empresa',
          segment: companyData.segment || null,
          owner_name: companyData.owner_name || null,
          phone: companyData.phone || null,
          email: companyData.email || null,
          city: companyData.city || null,
          employee_count: companyData.employee_count || null,
          main_goal: companyData.main_goal || null,
          ai_employee_name: companyData.ai_employee_name || 'NEXA',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }

    // Local fallback
    let current = getLocal<Company | null>('current_company', null);
    if (!current) {
      current = {
        id: crypto.randomUUID(),
        name: companyData.name || 'Minha Empresa',
        segment: companyData.segment || '',
        owner_name: companyData.owner_name || 'Gestor',
        phone: companyData.phone || '',
        email: companyData.email || '',
        city: companyData.city || '',
        employee_count: companyData.employee_count || '1-5',
        main_goal: companyData.main_goal || 'Aumentar vendas',
        ai_employee_name: companyData.ai_employee_name || 'NEXA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      current = {
        ...current,
        ...companyData,
        updated_at: new Date().toISOString(),
      };
    }
    setLocal('current_company', current);

    let profile = getLocal<Profile | null>('current_profile', null);
    if (!profile) {
      profile = {
        id: 'local-user-id',
        company_id: current.id,
        full_name: current.owner_name || 'Gestor',
        role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      profile.company_id = current.id;
    }
    setLocal('current_profile', profile);

    return current;
  },

  // ==============================================================================
  // CUSTOMERS CRUD
  // ==============================================================================
  async getCustomers(companyId: string): Promise<Customer[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Customer[]>('customers', []);
    return all.filter(c => c.company_id === companyId);
  },

  async saveCustomer(companyId: string, customer: Partial<Customer>): Promise<Customer> {
    if (!customer.id && !customer.name?.trim()) throw new Error('O nome do cliente é obrigatório.');

    if (isSupabaseConfigured) {
      if (customer.id) {
        const { data, error } = await supabase
          .from('customers')
          .update({ ...customer, updated_at: new Date().toISOString() })
          .eq('id', customer.id)
          .eq('company_id', companyId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            company_id: companyId,
            name: (customer.name || '').trim(),
            company_name: customer.company_name?.trim() || null,
            phone: customer.phone || null,
            whatsapp: customer.whatsapp || null,
            email: customer.email || null,
            document: customer.document || null,
            address: customer.address || null,
            city: customer.city || null,
            state: customer.state || null,
            notes: customer.notes || null,
            status: customer.status || 'ativo',
            total_purchases: 0,
            purchase_count: 0,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    const all = getLocal<Customer[]>('customers', []);
    if (customer.id) {
      const index = all.findIndex(c => c.id === customer.id && c.company_id === companyId);
      if (index === -1) throw new Error('Cliente não encontrado.');
      const updated: Customer = {
        ...all[index],
        ...customer,
        updated_at: new Date().toISOString(),
      };
      all[index] = updated;
      setLocal('customers', all);
      return updated;
    } else {
      const created: Customer = {
        id: crypto.randomUUID(),
        company_id: companyId,
        name: (customer.name || '').trim(),
        company_name: customer.company_name?.trim() || null,
        phone: customer.phone || null,
        whatsapp: customer.whatsapp || null,
        email: customer.email || null,
        document: customer.document || null,
        address: customer.address || null,
        city: customer.city || null,
        state: customer.state || null,
        notes: customer.notes || null,
        status: customer.status || 'ativo',
        total_purchases: 0,
        purchase_count: 0,
        last_purchase_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      all.unshift(created);
      setLocal('customers', all);
      return created;
    }
  },

  async deleteCustomer(companyId: string, customerId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('company_id', companyId);
      if (error) throw error;
      return;
    }
    const all = getLocal<Customer[]>('customers', []);
    const filtered = all.filter(c => !(c.id === customerId && c.company_id === companyId));
    setLocal('customers', filtered);
  },

  // ==============================================================================
  // PRODUCTS CRUD
  // ==============================================================================
  async getProducts(companyId: string): Promise<Product[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Product[]>('products', []);
    return all.filter(p => p.company_id === companyId);
  },

  async saveProduct(companyId: string, product: Partial<Product>): Promise<Product> {
    if (!product.id && !product.name?.trim()) throw new Error('O nome do produto é obrigatório.');
    if (product.price !== undefined && product.price < 0) throw new Error('O preço do produto não pode ser negativo.');
    if (product.stock !== undefined && product.stock < 0) throw new Error('O estoque não pode ser negativo.');

    if (isSupabaseConfigured) {
      if (product.id) {
        const { data, error } = await supabase
          .from('products')
          .update({ ...product, updated_at: new Date().toISOString() })
          .eq('id', product.id)
          .eq('company_id', companyId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert({
            company_id: companyId,
            name: (product.name || '').trim(),
            sku: product.sku?.trim() || null,
            category: product.category?.trim() || 'Geral',
            price: Number(product.price || 0),
            cost: Number(product.cost || 0),
            stock: Number(product.stock || 0),
            min_stock: Number(product.min_stock ?? 5),
            supplier: product.supplier?.trim() || null,
            status: product.status || 'ativo',
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    const all = getLocal<Product[]>('products', []);
    if (product.id) {
      const idx = all.findIndex(p => p.id === product.id && p.company_id === companyId);
      if (idx === -1) throw new Error('Produto não encontrado.');
      const updated: Product = {
        ...all[idx],
        ...product,
        price: Number(product.price ?? all[idx].price),
        cost: Number(product.cost ?? all[idx].cost),
        stock: Number(product.stock ?? all[idx].stock),
        min_stock: Number(product.min_stock ?? all[idx].min_stock),
        updated_at: new Date().toISOString(),
      };
      all[idx] = updated;
      setLocal('products', all);
      return updated;
    } else {
      const created: Product = {
        id: crypto.randomUUID(),
        company_id: companyId,
        name: (product.name || '').trim(),
        sku: product.sku?.trim() || null,
        category: product.category?.trim() || 'Geral',
        price: Number(product.price || 0),
        cost: Number(product.cost || 0),
        stock: Number(product.stock || 0),
        min_stock: Number(product.min_stock ?? 5),
        supplier: product.supplier?.trim() || null,
        status: product.status || 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      all.push(created);
      setLocal('products', all);
      return created;
    }
  },

  async deleteProduct(companyId: string, productId: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('company_id', companyId);
      if (error) throw error;
      return;
    }
    const all = getLocal<Product[]>('products', []);
    setLocal('products', all.filter(p => !(p.id === productId && p.company_id === companyId)));
  },

  // ==============================================================================
  // SALES WITH STRICT REAL BUSINESS LOGIC (ATOMIC DEDUCTIONS)
  // ==============================================================================
  async getSales(companyId: string): Promise<Sale[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(*),
          items:sale_items(*)
        `)
        .eq('company_id', companyId)
        .order('sale_date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const allSales = getLocal<Sale[]>('sales', []);
    const customers = getLocal<Customer[]>('customers', []);
    return allSales
      .filter(s => s.company_id === companyId)
      .map(s => ({
        ...s,
        customer: customers.find(c => c.id === s.customer_id) || null,
      }))
      .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());
  },

  async createSale(companyId: string, saleData: {
    customer_id?: string | null;
    items: { product_id: string; quantity: number; unit_price: number }[];
    discount?: number;
    payment_method: Sale['payment_method'];
    notes?: string | null;
    sale_date?: string;
  }): Promise<Sale> {
    if (!saleData.items || saleData.items.length === 0) {
      throw new Error('A venda deve conter pelo menos um item.');
    }

    if (isSupabaseConfigured) {
      // Calculate totals
      const subtotal = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const discount = saleData.discount || 0;
      const total = Math.max(0, subtotal - discount);

      // Call database procedure for atomic deduction & validation
      const { data, error } = await supabase.rpc('execute_sale', {
        p_company_id: companyId,
        p_customer_id: saleData.customer_id || null,
        p_subtotal: subtotal,
        p_discount: discount,
        p_total: total,
        p_payment_method: saleData.payment_method,
        p_notes: saleData.notes || null,
        p_items: saleData.items,
      });

      if (error) throw error;

      // Fetch the created sale
      const { data: createdSale, error: fetchErr } = await supabase
        .from('sales')
        .select('*, customer:customers(*), items:sale_items(*)')
        .eq('id', data)
        .single();

      if (fetchErr) throw fetchErr;
      return createdSale;
    }

    // Local execution with identical real business logic
    const products = getLocal<Product[]>('products', []);
    const customers = getLocal<Customer[]>('customers', []);
    const sales = getLocal<Sale[]>('sales', []);

    // 1. Validate stocks
    for (const item of saleData.items) {
      const prod = products.find(p => p.id === item.product_id && p.company_id === companyId);
      if (!prod) {
        throw new Error('Produto não encontrado.');
      }
      if (item.quantity <= 0) {
        throw new Error(`Quantidade inválida para o produto "${prod.name}".`);
      }
      if (prod.stock < item.quantity) {
        throw new Error(`Estoque insuficiente para o produto "${prod.name}". Disponível: ${prod.stock}, Solicitado: ${item.quantity}`);
      }
    }

    // 2. Deduct stocks
    const saleItems: SaleItem[] = [];
    let subtotal = 0;

    for (const item of saleData.items) {
      const prodIndex = products.findIndex(p => p.id === item.product_id);
      const prod = products[prodIndex];
      prod.stock -= item.quantity;
      prod.updated_at = new Date().toISOString();

      const itemTotal = item.quantity * item.unit_price;
      subtotal += itemTotal;

      saleItems.push({
        id: crypto.randomUUID(),
        product_id: prod.id,
        product_name: prod.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: prod.cost,
        total: itemTotal,
        created_at: new Date().toISOString(),
      });
    }
    setLocal('products', products);

    const discount = Number(saleData.discount || 0);
    const total = Math.max(0, subtotal - discount);
    const saleId = crypto.randomUUID();
    const nowIso = saleData.sale_date || new Date().toISOString();

    // 3. Update customer stats if selected
    let customerObj: Customer | null = null;
    if (saleData.customer_id) {
      const cIndex = customers.findIndex(c => c.id === saleData.customer_id && c.company_id === companyId);
      if (cIndex !== -1) {
        customers[cIndex].total_purchases += total;
        customers[cIndex].purchase_count += 1;
        customers[cIndex].last_purchase_at = nowIso;
        customers[cIndex].status = 'ativo';
        customers[cIndex].updated_at = nowIso;
        customerObj = customers[cIndex];
        setLocal('customers', customers);
      }
    }

    // 4. Create Sale
    const newSale: Sale = {
      id: saleId,
      company_id: companyId,
      customer_id: saleData.customer_id || null,
      customer: customerObj,
      subtotal,
      discount,
      total,
      payment_method: saleData.payment_method,
      status: 'concluida',
      sale_date: nowIso,
      notes: saleData.notes || null,
      items: saleItems,
      created_at: nowIso,
      updated_at: nowIso,
    };
    sales.unshift(newSale);
    setLocal('sales', sales);

    // 5. If payment is 'a_prazo' or 'boleto', generate receivable
    if (saleData.payment_method === 'a_prazo' || saleData.payment_method === 'boleto') {
      const receivables = getLocal<Receivable[]>('receivables', []);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      receivables.unshift({
        id: crypto.randomUUID(),
        company_id: companyId,
        customer_id: saleData.customer_id || null,
        customer: customerObj,
        sale_id: saleId,
        description: `Recebível venda #${saleId.slice(0, 6)}`,
        amount: total,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pendente',
        notes: null,
        created_at: nowIso,
        updated_at: nowIso,
      });
      setLocal('receivables', receivables);
    }

    return newSale;
  },

  // ==============================================================================
  // FINANCIAL CRUD: EXPENSES, RECEIVABLES, PAYABLES
  // ==============================================================================
  async getExpenses(companyId: string): Promise<Expense[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Expense[]>('expenses', []);
    return all.filter(e => e.company_id === companyId);
  },

  async saveExpense(companyId: string, expense: Partial<Expense>): Promise<Expense> {
    if (!expense.description?.trim()) throw new Error('A descrição da despesa é obrigatória.');
    if (!expense.amount || expense.amount <= 0) throw new Error('O valor da despesa deve ser maior que zero.');

    if (isSupabaseConfigured) {
      if (expense.id) {
        const { data, error } = await supabase
          .from('expenses')
          .update({ ...expense, updated_at: new Date().toISOString() })
          .eq('id', expense.id)
          .eq('company_id', companyId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('expenses')
          .insert({
            company_id: companyId,
            description: expense.description.trim(),
            category: expense.category?.trim() || 'Geral',
            amount: Number(expense.amount),
            date: expense.date || new Date().toISOString().split('T')[0],
            due_date: expense.due_date || expense.date || new Date().toISOString().split('T')[0],
            status: expense.status || 'pago',
            notes: expense.notes || null,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    const all = getLocal<Expense[]>('expenses', []);
    if (expense.id) {
      const idx = all.findIndex(e => e.id === expense.id && e.company_id === companyId);
      if (idx === -1) throw new Error('Despesa não encontrada.');
      const updated: Expense = {
        ...all[idx],
        ...expense,
        amount: Number(expense.amount),
        updated_at: new Date().toISOString(),
      };
      all[idx] = updated;
      setLocal('expenses', all);
      return updated;
    } else {
      const created: Expense = {
        id: crypto.randomUUID(),
        company_id: companyId,
        description: expense.description.trim(),
        category: expense.category?.trim() || 'Geral',
        amount: Number(expense.amount),
        date: expense.date || new Date().toISOString().split('T')[0],
        due_date: expense.due_date || expense.date || new Date().toISOString().split('T')[0],
        status: expense.status || 'pago',
        notes: expense.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      all.unshift(created);
      setLocal('expenses', all);
      return created;
    }
  },

  async deleteExpense(companyId: string, id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
      return;
    }
    const all = getLocal<Expense[]>('expenses', []);
    setLocal('expenses', all.filter(e => !(e.id === id && e.company_id === companyId)));
  },

  async getReceivables(companyId: string): Promise<Receivable[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('receivables')
        .select('*, customer:customers(*)')
        .eq('company_id', companyId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Receivable[]>('receivables', []);
    const customers = getLocal<Customer[]>('customers', []);
    return all
      .filter(r => r.company_id === companyId)
      .map(r => ({ ...r, customer: customers.find(c => c.id === r.customer_id) || null }));
  },

  async saveReceivable(companyId: string, receivable: Partial<Receivable>): Promise<Receivable> {
    if (!receivable.description?.trim()) throw new Error('A descrição é obrigatória.');
    if (!receivable.amount || receivable.amount <= 0) throw new Error('O valor deve ser maior que zero.');

    if (isSupabaseConfigured) {
      if (receivable.id) {
        const { data, error } = await supabase
          .from('receivables')
          .update({ ...receivable, updated_at: new Date().toISOString() })
          .eq('id', receivable.id)
          .eq('company_id', companyId)
          .select('*, customer:customers(*)')
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('receivables')
          .insert({
            company_id: companyId,
            customer_id: receivable.customer_id || null,
            description: receivable.description.trim(),
            amount: Number(receivable.amount),
            due_date: receivable.due_date || new Date().toISOString().split('T')[0],
            status: receivable.status || 'pendente',
            notes: receivable.notes || null,
          })
          .select('*, customer:customers(*)')
          .single();
        if (error) throw error;
        return data;
      }
    }

    const all = getLocal<Receivable[]>('receivables', []);
    if (receivable.id) {
      const idx = all.findIndex(r => r.id === receivable.id && r.company_id === companyId);
      if (idx === -1) throw new Error('Conta a receber não encontrada.');
      const updated: Receivable = {
        ...all[idx],
        ...receivable,
        amount: Number(receivable.amount),
        updated_at: new Date().toISOString(),
      };
      all[idx] = updated;
      setLocal('receivables', all);
      return updated;
    } else {
      const created: Receivable = {
        id: crypto.randomUUID(),
        company_id: companyId,
        customer_id: receivable.customer_id || null,
        description: receivable.description.trim(),
        amount: Number(receivable.amount),
        due_date: receivable.due_date || new Date().toISOString().split('T')[0],
        status: receivable.status || 'pendente',
        notes: receivable.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      all.unshift(created);
      setLocal('receivables', all);
      return created;
    }
  },

  async deleteReceivable(companyId: string, id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('receivables')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
      return;
    }
    const all = getLocal<Receivable[]>('receivables', []);
    setLocal('receivables', all.filter(r => !(r.id === id && r.company_id === companyId)));
  },

  async getPayables(companyId: string): Promise<Payable[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payables')
        .select('*')
        .eq('company_id', companyId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Payable[]>('payables', []);
    return all.filter(p => p.company_id === companyId);
  },

  async savePayable(companyId: string, payable: Partial<Payable>): Promise<Payable> {
    if (!payable.description?.trim()) throw new Error('A descrição é obrigatória.');
    if (!payable.amount || payable.amount <= 0) throw new Error('O valor deve ser maior que zero.');

    if (isSupabaseConfigured) {
      if (payable.id) {
        const { data, error } = await supabase
          .from('payables')
          .update({ ...payable, updated_at: new Date().toISOString() })
          .eq('id', payable.id)
          .eq('company_id', companyId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('payables')
          .insert({
            company_id: companyId,
            supplier: payable.supplier?.trim() || null,
            description: payable.description.trim(),
            category: payable.category?.trim() || 'Fornecedores',
            amount: Number(payable.amount),
            due_date: payable.due_date || new Date().toISOString().split('T')[0],
            status: payable.status || 'pendente',
            notes: payable.notes || null,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    const all = getLocal<Payable[]>('payables', []);
    if (payable.id) {
      const idx = all.findIndex(p => p.id === payable.id && p.company_id === companyId);
      if (idx === -1) throw new Error('Conta a pagar não encontrada.');
      const updated: Payable = {
        ...all[idx],
        ...payable,
        amount: Number(payable.amount),
        updated_at: new Date().toISOString(),
      };
      all[idx] = updated;
      setLocal('payables', all);
      return updated;
    } else {
      const created: Payable = {
        id: crypto.randomUUID(),
        company_id: companyId,
        supplier: payable.supplier?.trim() || null,
        description: payable.description.trim(),
        category: payable.category?.trim() || 'Fornecedores',
        amount: Number(payable.amount),
        due_date: payable.due_date || new Date().toISOString().split('T')[0],
        status: payable.status || 'pendente',
        notes: payable.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      all.unshift(created);
      setLocal('payables', all);
      return created;
    }
  },

  async deletePayable(companyId: string, id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('payables')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
      return;
    }
    const all = getLocal<Payable[]>('payables', []);
    setLocal('payables', all.filter(p => !(p.id === id && p.company_id === companyId)));
  },

  // ==============================================================================
  // TASKS CRUD
  // ==============================================================================
  async getTasks(companyId: string): Promise<Task[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Task[]>('tasks', []);
    return all.filter(t => t.company_id === companyId);
  },

  async saveTask(companyId: string, task: Partial<Task>): Promise<Task> {
    if (!task.id && !task.title?.trim()) throw new Error('O título da tarefa é obrigatório.');

    if (isSupabaseConfigured) {
      if (task.id) {
        const { data, error } = await supabase
          .from('tasks')
          .update({ ...task, updated_at: new Date().toISOString() })
          .eq('id', task.id)
          .eq('company_id', companyId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            company_id: companyId,
            title: (task.title || '').trim(),
            description: task.description?.trim() || null,
            assignee: task.assignee?.trim() || null,
            priority: task.priority || 'media',
            due_date: task.due_date || null,
            status: task.status || 'pendente',
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    const all = getLocal<Task[]>('tasks', []);
    if (task.id) {
      const idx = all.findIndex(t => t.id === task.id && t.company_id === companyId);
      if (idx === -1) throw new Error('Tarefa não encontrada.');
      const updated: Task = {
        ...all[idx],
        ...task,
        updated_at: new Date().toISOString(),
      };
      all[idx] = updated;
      setLocal('tasks', all);
      return updated;
    } else {
      const created: Task = {
        id: crypto.randomUUID(),
        company_id: companyId,
        title: (task.title || '').trim(),
        description: task.description?.trim() || null,
        assignee: task.assignee?.trim() || null,
        priority: task.priority || 'media',
        due_date: task.due_date || null,
        status: task.status || 'pendente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      all.unshift(created);
      setLocal('tasks', all);
      return created;
    }
  },

  async deleteTask(companyId: string, id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
      return;
    }
    const all = getLocal<Task[]>('tasks', []);
    setLocal('tasks', all.filter(t => !(t.id === id && t.company_id === companyId)));
  },

  // ==============================================================================
  // CRM LEADS CRUD
  // ==============================================================================
  async getLeads(companyId: string): Promise<Lead[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Lead[]>('leads', []);
    return all.filter(l => l.company_id === companyId);
  },

  async saveLead(companyId: string, lead: Partial<Lead>): Promise<Lead> {
    if (!lead.id && !lead.name?.trim()) throw new Error('O nome do lead é obrigatório.');

    if (isSupabaseConfigured) {
      if (lead.id) {
        const { data, error } = await supabase
          .from('leads')
          .update({ ...lead, updated_at: new Date().toISOString() })
          .eq('id', lead.id)
          .eq('company_id', companyId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('leads')
          .insert({
            company_id: companyId,
            name: (lead.name || '').trim(),
            company_name: lead.company_name?.trim() || null,
            contact_name: lead.contact_name?.trim() || null,
            email: lead.email || null,
            phone: lead.phone || null,
            stage: lead.stage || 'novo',
            estimated_value: Number(lead.estimated_value || 0),
            source: lead.source || null,
            notes: lead.notes || null,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    const all = getLocal<Lead[]>('leads', []);
    if (lead.id) {
      const idx = all.findIndex(l => l.id === lead.id && l.company_id === companyId);
      if (idx === -1) throw new Error('Lead não encontrado.');
      const updated: Lead = {
        ...all[idx],
        ...lead,
        estimated_value: Number(lead.estimated_value ?? all[idx].estimated_value),
        updated_at: new Date().toISOString(),
      };
      all[idx] = updated;
      setLocal('leads', all);
      return updated;
    } else {
      const created: Lead = {
        id: crypto.randomUUID(),
        company_id: companyId,
        name: (lead.name || '').trim(),
        company_name: lead.company_name?.trim() || null,
        contact_name: lead.contact_name?.trim() || null,
        email: lead.email || null,
        phone: lead.phone || null,
        stage: lead.stage || 'novo',
        estimated_value: Number(lead.estimated_value || 0),
        source: lead.source || null,
        notes: lead.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      all.unshift(created);
      setLocal('leads', all);
      return created;
    }
  },

  async deleteLead(companyId: string, id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
        .eq('company_id', companyId);
      if (error) throw error;
      return;
    }
    const all = getLocal<Lead[]>('leads', []);
    setLocal('leads', all.filter(l => !(l.id === id && l.company_id === companyId)));
  },

  // ==============================================================================
  // NOTIFICATIONS
  // ==============================================================================
  async getNotifications(companyId: string): Promise<Notification[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<Notification[]>('notifications', []);
    return all.filter(n => n.company_id === companyId);
  },

  async markNotificationRead(companyId: string, id: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('company_id', companyId);
      return;
    }
    const all = getLocal<Notification[]>('notifications', []);
    const idx = all.findIndex(n => n.id === id && n.company_id === companyId);
    if (idx !== -1) {
      all[idx].read = true;
      setLocal('notifications', all);
    }
  },

  async createNotification(companyId: string, notif: Omit<Notification, 'id' | 'company_id' | 'created_at' | 'read'>): Promise<Notification> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          company_id: companyId,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          link: notif.link || null,
          read: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const all = getLocal<Notification[]>('notifications', []);
    const created: Notification = {
      id: crypto.randomUUID(),
      company_id: companyId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: false,
      link: notif.link || null,
      created_at: new Date().toISOString(),
    };
    all.unshift(created);
    setLocal('notifications', all);
    return created;
  },

  // ==============================================================================
  // AI CONVERSATIONS & MESSAGES
  // ==============================================================================
  async getAIConversations(companyId: string): Promise<AIConversation[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<AIConversation[]>('ai_conversations', []);
    return all.filter(c => c.company_id === companyId);
  },

  async createAIConversation(companyId: string, title = 'Nova conversa'): Promise<AIConversation> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          company_id: companyId,
          title,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const all = getLocal<AIConversation[]>('ai_conversations', []);
    const created: AIConversation = {
      id: crypto.randomUUID(),
      company_id: companyId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.unshift(created);
    setLocal('ai_conversations', all);
    return created;
  },

  async getAIMessages(companyId: string, conversationId: string): Promise<AIMessage[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    const all = getLocal<AIMessage[]>('ai_messages', []);
    return all.filter(m => m.conversation_id === conversationId && m.company_id === companyId);
  },

  async saveAIMessage(companyId: string, msg: Omit<AIMessage, 'id' | 'created_at'> & { id?: string }): Promise<AIMessage> {
    if (isSupabaseConfigured) {
      if (msg.id) {
        const { data, error } = await supabase
          .from('ai_messages')
          .update({
            action_status: msg.action_status,
            content: msg.content,
          })
          .eq('id', msg.id)
          .eq('company_id', companyId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('ai_messages')
          .insert({
            conversation_id: msg.conversation_id,
            company_id: companyId,
            role: msg.role,
            content: msg.content,
            action_data: msg.action_data || null,
            action_status: msg.action_status || null,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    const all = getLocal<AIMessage[]>('ai_messages', []);
    if (msg.id) {
      const idx = all.findIndex(m => m.id === msg.id && m.company_id === companyId);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...msg };
        setLocal('ai_messages', all);
        return all[idx];
      }
    }
    const created: AIMessage = {
      id: crypto.randomUUID(),
      conversation_id: msg.conversation_id,
      company_id: companyId,
      role: msg.role,
      content: msg.content,
      action_data: msg.action_data || null,
      action_status: msg.action_status || null,
      created_at: new Date().toISOString(),
    };
    all.push(created);
    setLocal('ai_messages', all);
    return created;
  },

  // ==============================================================================
  // DEMO DATA MANAGEMENT (DEMO MODE & CLEARING)
  // ==============================================================================
  async clearAllCompanyData(companyId: string): Promise<void> {
    if (isSupabaseConfigured) {
      // In Supabase, delete all business entities for this company
      await Promise.all([
        supabase.from('sales').delete().eq('company_id', companyId),
        supabase.from('products').delete().eq('company_id', companyId),
        supabase.from('customers').delete().eq('company_id', companyId),
        supabase.from('expenses').delete().eq('company_id', companyId),
        supabase.from('receivables').delete().eq('company_id', companyId),
        supabase.from('payables').delete().eq('company_id', companyId),
        supabase.from('tasks').delete().eq('company_id', companyId),
        supabase.from('leads').delete().eq('company_id', companyId),
        supabase.from('notifications').delete().eq('company_id', companyId),
        supabase.from('ai_conversations').delete().eq('company_id', companyId),
      ]);
      return;
    }

    // In LocalStorage, filter out everything belonging to this companyId
    const filterOut = (key: string) => {
      const items = getLocal<any[]>(key, []);
      setLocal(key, items.filter(i => i.company_id !== companyId));
    };

    filterOut('customers');
    filterOut('products');
    filterOut('sales');
    filterOut('expenses');
    filterOut('receivables');
    filterOut('payables');
    filterOut('tasks');
    filterOut('leads');
    filterOut('notifications');
    filterOut('ai_conversations');
    filterOut('ai_messages');
  }
};
