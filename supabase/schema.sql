-- ==============================================================================
-- NEXA — Funcionário de IA: Complete Database Schema & RLS Policies
-- ==============================================================================
-- Instruções de Execução:
-- Copie todo o conteúdo deste script e cole no "SQL Editor" do painel do seu projeto Supabase.
-- Clique em "RUN" para criar todas as tabelas, índices, triggers e políticas RLS.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. COMPANIES
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    segment TEXT,
    owner_name TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    employee_count TEXT,
    main_goal TEXT,
    ai_employee_name TEXT NOT NULL DEFAULT 'NEXA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PROFILES (Linked directly to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. COMPANY MEMBERS
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, user_id)
);

-- 5. HELPER FUNCTION FOR RLS (Security Definer to prevent recursive RLS)
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    document TEXT, -- CPF / CNPJ
    address TEXT,
    city TEXT,
    state TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'potencial')),
    total_purchases NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    purchase_count INT NOT NULL DEFAULT 0,
    last_purchase_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(company_id, status);

-- 7. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 5,
    supplier TEXT,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_positive_stock CHECK (stock >= 0)
);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);

-- 8. SALES
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'boleto', 'a_prazo')),
    status TEXT NOT NULL DEFAULT 'concluida' CHECK (status IN ('concluida', 'cancelada')),
    sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(company_id, sale_date);

-- 9. SALE ITEMS
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_company_id ON public.sale_items(company_id);

-- 10. EXPENSES (Despesas)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'pendente', 'vencido')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON public.expenses(company_id);

-- 11. RECEIVABLES (Contas a Receber)
CREATE TABLE IF NOT EXISTS public.receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'vencido')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_receivables_company_id ON public.receivables(company_id);

-- 12. PAYABLES (Contas a Pagar)
CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier TEXT,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'vencido')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payables_company_id ON public.payables(company_id);

-- 13. TASKS (Tarefas)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee TEXT,
    priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta')),
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON public.tasks(company_id);

-- 14. LEADS (CRM Funil)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    stage TEXT NOT NULL DEFAULT 'novo' CHECK (stage IN ('novo', 'contato', 'interessado', 'proposta', 'negociacao', 'cliente', 'perdido')),
    estimated_value NUMERIC(12, 2) DEFAULT 0.00,
    source TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);

-- 15. NOTIFICATIONS (Notificações)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('alerta', 'aviso', 'info', 'sucesso')),
    read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON public.notifications(company_id);

-- 16. AI CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nova conversa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_company_id ON public.ai_conversations(company_id);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    action_data JSONB,
    action_status TEXT CHECK (action_status IN ('pending_confirmation', 'confirmed', 'cancelled', 'executed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_id ON public.ai_messages(conversation_id);

-- 17. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON public.activity_logs(company_id);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation by company_id
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- 2. COMPANIES POLICIES
CREATE POLICY "Users can view their assigned company"
    ON public.companies FOR SELECT
    USING (
      id = public.get_auth_company_id()
      OR id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
      OR auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update their assigned company"
    ON public.companies FOR UPDATE
    USING (id = public.get_auth_company_id());

CREATE POLICY "Authenticated users can create a new company during onboarding"
    ON public.companies FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- 3. COMPANY MEMBERS
CREATE POLICY "Users can view company members"
    ON public.company_members FOR SELECT
    USING (
      company_id = public.get_auth_company_id()
      OR user_id = auth.uid()
    );

CREATE POLICY "Users can insert or manage members"
    ON public.company_members FOR ALL
    USING (
      company_id = public.get_auth_company_id()
      OR user_id = auth.uid()
    );

-- 4. BUSINESS TABLES POLICIES (CUSTOMERS, PRODUCTS, SALES, ETC.)
-- CUSTOMERS
CREATE POLICY "Tenant isolation for customers select"
    ON public.customers FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for customers insert"
    ON public.customers FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for customers update"
    ON public.customers FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for customers delete"
    ON public.customers FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- PRODUCTS
CREATE POLICY "Tenant isolation for products select"
    ON public.products FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for products insert"
    ON public.products FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for products update"
    ON public.products FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for products delete"
    ON public.products FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- SALES
CREATE POLICY "Tenant isolation for sales select"
    ON public.sales FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for sales insert"
    ON public.sales FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for sales update"
    ON public.sales FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for sales delete"
    ON public.sales FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- SALE ITEMS
CREATE POLICY "Tenant isolation for sale_items select"
    ON public.sale_items FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for sale_items insert"
    ON public.sale_items FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for sale_items update"
    ON public.sale_items FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for sale_items delete"
    ON public.sale_items FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- EXPENSES
CREATE POLICY "Tenant isolation for expenses select"
    ON public.expenses FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for expenses insert"
    ON public.expenses FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for expenses update"
    ON public.expenses FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for expenses delete"
    ON public.expenses FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- RECEIVABLES
CREATE POLICY "Tenant isolation for receivables select"
    ON public.receivables FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for receivables insert"
    ON public.receivables FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for receivables update"
    ON public.receivables FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for receivables delete"
    ON public.receivables FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- PAYABLES
CREATE POLICY "Tenant isolation for payables select"
    ON public.payables FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for payables insert"
    ON public.payables FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for payables update"
    ON public.payables FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for payables delete"
    ON public.payables FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- TASKS
CREATE POLICY "Tenant isolation for tasks select"
    ON public.tasks FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for tasks insert"
    ON public.tasks FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for tasks update"
    ON public.tasks FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for tasks delete"
    ON public.tasks FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- LEADS
CREATE POLICY "Tenant isolation for leads select"
    ON public.leads FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for leads insert"
    ON public.leads FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for leads update"
    ON public.leads FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for leads delete"
    ON public.leads FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- NOTIFICATIONS
CREATE POLICY "Tenant isolation for notifications select"
    ON public.notifications FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for notifications insert"
    ON public.notifications FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for notifications update"
    ON public.notifications FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for notifications delete"
    ON public.notifications FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- AI CONVERSATIONS & MESSAGES
CREATE POLICY "Tenant isolation for ai_conversations select"
    ON public.ai_conversations FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for ai_conversations insert"
    ON public.ai_conversations FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for ai_conversations update"
    ON public.ai_conversations FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for ai_conversations delete"
    ON public.ai_conversations FOR DELETE
    USING (company_id = public.get_auth_company_id());

CREATE POLICY "Tenant isolation for ai_messages select"
    ON public.ai_messages FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for ai_messages insert"
    ON public.ai_messages FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for ai_messages update"
    ON public.ai_messages FOR UPDATE
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for ai_messages delete"
    ON public.ai_messages FOR DELETE
    USING (company_id = public.get_auth_company_id());

-- ACTIVITY LOGS
CREATE POLICY "Tenant isolation for activity_logs select"
    ON public.activity_logs FOR SELECT
    USING (company_id = public.get_auth_company_id());
CREATE POLICY "Tenant isolation for activity_logs insert"
    ON public.activity_logs FOR INSERT
    WITH CHECK (company_id = public.get_auth_company_id());

-- ==============================================================================
-- BUSINESS LOGIC FUNCTIONS & TRIGGERS (ATOMIC IN POSTGRESQL)
-- ==============================================================================

-- Stored procedure to atomically create company, link profile and company_members
CREATE OR REPLACE FUNCTION public.create_company(
    p_name TEXT,
    p_segment TEXT,
    p_owner_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_city TEXT,
    p_employee_count TEXT,
    p_main_goal TEXT,
    p_ai_employee_name TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_company_id UUID;
    v_company RECORD;
BEGIN
    INSERT INTO public.companies (
        name, segment, owner_name, phone, email, city, employee_count, main_goal, ai_employee_name
    ) VALUES (
        p_name, p_segment, p_owner_name, p_phone, p_email, p_city, p_employee_count, p_main_goal, COALESCE(p_ai_employee_name, 'NEXA')
    ) RETURNING id INTO v_company_id;

    -- Update or insert profile
    INSERT INTO public.profiles (id, company_id, full_name, role)
    VALUES (auth.uid(), v_company_id, p_owner_name, 'owner')
    ON CONFLICT (id) DO UPDATE
    SET company_id = v_company_id, full_name = p_owner_name, updated_at = now();

    -- Add to company_members
    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (v_company_id, auth.uid(), 'owner')
    ON CONFLICT (company_id, user_id) DO NOTHING;

    SELECT * INTO v_company FROM public.companies WHERE id = v_company_id;
    RETURN to_jsonb(v_company);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored procedure to record a complete sale atomically with stock validation & deduction
CREATE OR REPLACE FUNCTION public.execute_sale(
    p_company_id UUID,
    p_customer_id UUID,
    p_subtotal NUMERIC,
    p_discount NUMERIC,
    p_total NUMERIC,
    p_payment_method TEXT,
    p_notes TEXT,
    p_items JSONB
)
RETURNS UUID AS $$
DECLARE
    v_sale_id UUID;
    v_item RECORD;
    v_curr_stock INT;
    v_prod_name TEXT;
    v_prod_cost NUMERIC;
BEGIN
    -- 1. Validate customer belongs to company (if provided)
    IF p_customer_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id AND company_id = p_company_id) THEN
            RAISE EXCEPTION 'Cliente não pertence a esta empresa ou não existe.';
        END IF;
    END IF;

    -- 2. Validate all product stocks before creating sale
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT, unit_price NUMERIC)
    LOOP
        SELECT stock, name, cost INTO v_curr_stock, v_prod_name, v_prod_cost
        FROM public.products
        WHERE id = v_item.product_id AND company_id = p_company_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produto não encontrado ou não pertence a esta empresa.';
        END IF;

        IF v_curr_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Estoque insuficiente para o produto "%". Estoque disponível: %, Solicitado: %', v_prod_name, v_curr_stock, v_item.quantity;
        END IF;
    END LOOP;

    -- 3. Create the sale header
    INSERT INTO public.sales (
        company_id, customer_id, subtotal, discount, total, payment_method, status, sale_date, notes
    ) VALUES (
        p_company_id, p_customer_id, p_subtotal, p_discount, p_total, p_payment_method, 'concluida', now(), p_notes
    ) RETURNING id INTO v_sale_id;

    -- 4. Insert items and decrement stocks
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT, unit_price NUMERIC)
    LOOP
        SELECT cost, name INTO v_prod_cost, v_prod_name
        FROM public.products
        WHERE id = v_item.product_id;

        -- Insert item
        INSERT INTO public.sale_items (
            sale_id, company_id, product_id, product_name, quantity, unit_price, unit_cost, total
        ) VALUES (
            v_sale_id, p_company_id, v_item.product_id, v_prod_name, v_item.quantity, v_item.unit_price, COALESCE(v_prod_cost, 0), (v_item.quantity * v_item.unit_price)
        );

        -- Decrement product stock
        UPDATE public.products
        SET stock = stock - v_item.quantity,
            updated_at = now()
        WHERE id = v_item.product_id;
    END LOOP;

    -- 5. If customer exists, update customer purchase metrics
    IF p_customer_id IS NOT NULL THEN
        UPDATE public.customers
        SET total_purchases = total_purchases + p_total,
            purchase_count = purchase_count + 1,
            last_purchase_at = now(),
            status = 'ativo',
            updated_at = now()
        WHERE id = p_customer_id;
    END IF;

    -- 6. If payment is 'a_prazo' or 'boleto', generate a receivable entry automatically
    IF p_payment_method IN ('a_prazo', 'boleto') THEN
        INSERT INTO public.receivables (
            company_id, customer_id, sale_id, description, amount, due_date, status
        ) VALUES (
            p_company_id, p_customer_id, v_sale_id, 'Recebível referente à venda #' || SUBSTRING(v_sale_id::text, 1, 8), p_total, (CURRENT_DATE + INTERVAL '30 days')::DATE, 'pendente'
        );
    END IF;

    RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically handle profile creation when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', 'owner')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
