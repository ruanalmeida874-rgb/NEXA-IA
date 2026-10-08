import { storage } from './storage';
import { Customer, Task, AIMessageActionData } from '@/types';
import { formatCurrency, formatDaysInactiveText, getDaysInactive } from '@/utils/formatters';

export interface ToolResult {
  tool: string;
  data: any;
  summaryText?: string;
}

// ==============================================================================
// NEXA SECURE DATABASE TOOLS
// All tools enforce company_id scoping and isolation
// ==============================================================================
export const aiTools = {
  async get_company_info(_companyId: string) {
    const { company } = await storage.getCurrentProfile();
    return company;
  },

  async get_sales(companyId: string) {
    const sales = await storage.getSales(companyId);
    const total = sales.reduce((acc, s) => acc + Number(s.total || 0), 0);
    return {
      count: sales.length,
      totalRevenue: total,
      sales: sales.slice(0, 10),
    };
  },

  async get_customers(companyId: string) {
    const customers = await storage.getCustomers(companyId);
    return {
      total: customers.length,
      customers: customers.slice(0, 15),
    };
  },

  async get_inactive_customers(companyId: string) {
    const customers = await storage.getCustomers(companyId);
    const inactive = customers.filter(c => {
      if (c.status === 'inativo') return true;
      const days = getDaysInactive(c.last_purchase_at);
      return days !== null && days >= 60;
    });
    return {
      count: inactive.length,
      customers: inactive.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || c.whatsapp || 'Sem telefone',
        daysInactive: getDaysInactive(c.last_purchase_at),
        totalPurchases: c.total_purchases,
      })),
    };
  },

  async get_products(companyId: string) {
    const products = await storage.getProducts(companyId);
    return {
      total: products.length,
      products: products.slice(0, 15),
    };
  },

  async get_low_stock_products(companyId: string) {
    const products = await storage.getProducts(companyId);
    const lowStock = products.filter(p => p.stock <= p.min_stock && p.status === 'ativo');
    return {
      count: lowStock.length,
      products: lowStock.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        min_stock: p.min_stock,
        price: p.price,
      })),
    };
  },

  async get_expenses(companyId: string) {
    const expenses = await storage.getExpenses(companyId);
    const total = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    return {
      count: expenses.length,
      totalExpenses: total,
      expenses: expenses.slice(0, 10),
    };
  },

  async get_receivables(companyId: string) {
    const receivables = await storage.getReceivables(companyId);
    const pending = receivables.filter(r => r.status === 'pendente' || r.status === 'vencido');
    const total = pending.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    return {
      count: pending.length,
      totalReceivables: total,
      items: pending.slice(0, 10),
    };
  },

  async get_payables(companyId: string) {
    const payables = await storage.getPayables(companyId);
    const pending = payables.filter(p => p.status === 'pendente' || p.status === 'vencido');
    const total = pending.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    return {
      count: pending.length,
      totalPayables: total,
      items: pending.slice(0, 10),
    };
  },

  async get_tasks(companyId: string) {
    const tasks = await storage.getTasks(companyId);
    return {
      count: tasks.length,
      pending: tasks.filter(t => t.status !== 'concluida'),
      tasks: tasks.slice(0, 10),
    };
  },

  // Mutating Tools (Executed ONLY upon confirmed user action)
  async create_customer(companyId: string, params: Partial<Customer>) {
    return await storage.saveCustomer(companyId, params);
  },

  async update_customer(companyId: string, params: Partial<Customer>) {
    return await storage.saveCustomer(companyId, params);
  },

  async create_task(companyId: string, params: Partial<Task>) {
    return await storage.saveTask(companyId, params);
  },

  async create_sale(companyId: string, params: any) {
    return await storage.createSale(companyId, params);
  },

  async create_expense(companyId: string, params: any) {
    return await storage.saveExpense(companyId, params);
  },
};

// ==============================================================================
// AI AGENT RESPONSE ORCHESTRATOR
// ==============================================================================
export const aiService = {
  async processUserMessage(
    companyId: string,
    messageText: string,
    aiName = 'NEXA'
  ): Promise<{
    reply: string;
    actionData?: AIMessageActionData | null;
  }> {
    // 0. Optional Server-Side Backend AI Delegate (Keeps GEMINI_API_KEY on the server)
    try {
      if (typeof window !== 'undefined' && import.meta.env.VITE_AI_BACKEND_URL) {
        const backendRes = await fetch(import.meta.env.VITE_AI_BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId, message: messageText, aiName }),
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          if (data && data.reply) return data;
        }
      }
    } catch {
      // Graceful fallback: continue with internal secure tool orchestrator below
    }

    const q = messageText.toLowerCase().trim();

    // 1. MUTATING ACTIONS (Require confirmation card first)
    // A) Cadastrar Cliente
    if (q.includes('cadastr') && (q.includes('cliente') || q.includes('lead') || q.includes('contato'))) {
      let extractedName = 'Novo Cliente';
      let extractedPhone = '';
      let extractedEmail = '';

      const clean = messageText.replace(/^(?:cadastre|cadastrar|adicione|criar|novo|nova)\s+(?:um\s+|uma\s+)?(?:cliente|contato|lead)?\s*(?:chamado|chamada|com nome|de nome|de|:)?\s*/i, '');
      const rawName = clean.split(/(?:telefone|tel|fone|celular|whatsapp|email|e-mail|com)/i)[0].trim().replace(/[.,;]$/, '');
      if (rawName && rawName.toLowerCase() !== 'cliente' && rawName.length > 1) {
        extractedName = rawName;
      }

      const phoneMatch = messageText.match(/(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-\s]?\d{4}/);
      if (phoneMatch) {
        extractedPhone = phoneMatch[0].trim();
      }

      const emailMatch = messageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        extractedEmail = emailMatch[0].trim();
      }

      return {
        reply: `Preparei o cadastro do cliente com os dados fornecidos. Como esta ação modifica os registros da sua empresa, por favor confirme abaixo para prosseguir:`,
        actionData: {
          tool: 'create_customer',
          description: `Cadastrar novo cliente no sistema`,
          parameters: {
            name: extractedName,
            phone: extractedPhone || null,
            email: extractedEmail || null,
            status: 'ativo',
          },
          summary: {
            'Nome': extractedName,
            'Telefone': extractedPhone || 'Não informado',
            'E-mail': extractedEmail || 'Não informado',
            'Status': 'Ativo',
          },
        },
      };
    }

    // B) Criar Tarefa
    if ((q.includes('crie') || q.includes('criar') || q.includes('agende') || q.includes('lembre')) && (q.includes('tarefa') || q.includes('lembrete'))) {
      let taskTitle = messageText
        .replace(/(?:crie|criar|agende|adicione)\s+(?:uma\s+|a\s+)?tarefa\s*(?:para\s+|de\s+)?/i, '')
        .trim();
      if (!taskTitle) taskTitle = 'Nova tarefa corporativa';

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        reply: `Entendido! Deseja que eu crie esta tarefa em sua agenda?`,
        actionData: {
          tool: 'create_task',
          description: `Criar nova tarefa`,
          parameters: {
            title: taskTitle,
            priority: 'alta',
            due_date: tomorrow.toISOString().split('T')[0],
            status: 'pendente',
          },
          summary: {
            'Título': taskTitle,
            'Prioridade': 'Alta',
            'Prazo': 'Amanhã',
            'Status': 'Pendente',
          },
        },
      };
    }

    // C) Criar Despesa
    if ((q.includes('registre') || q.includes('lance') || q.includes('cadastre')) && (q.includes('despesa') || q.includes('gasto') || q.includes('conta'))) {
      const valMatch = messageText.match(/\d+([.,]\d{1,2})?/);
      const val = valMatch ? parseFloat(valMatch[0].replace(',', '.')) : 100.00;

      return {
        reply: `Identifiquei uma solicitação de lançamento financeiro. Confirme os dados abaixo:`,
        actionData: {
          tool: 'create_expense',
          description: `Registrar despesa no financeiro`,
          parameters: {
            description: 'Despesa solicitada via NEXA',
            amount: val,
            category: 'Operacional',
            status: 'pago',
          },
          summary: {
            'Descrição': 'Despesa solicitada via NEXA',
            'Valor': formatCurrency(val),
            'Categoria': 'Operacional',
            'Status': 'Pago',
          },
        },
      };
    }

    // 2. READ-ONLY QUERIES
    // A) Vendas & Faturamento
    if (q.includes('venda') || q.includes('fatur') || q.includes('quanto vend') || q.includes('receita')) {
      const data = await aiTools.get_sales(companyId);
      if (data.count === 0) {
        return {
          reply: `Ainda não temos registros de vendas cadastrados neste mês. Assim que você realizar a primeira venda ou carregar os dados de demonstração, poderei calcular métricas detalhadas.`,
        };
      }
      return {
        reply: `Suas vendas totalizam **${formatCurrency(data.totalRevenue)}** distribuídas em **${data.count} transações** concluídas.\n\n📈 O ticket médio atual é de **${formatCurrency(data.totalRevenue / data.count)}**.\n💡 Gostaria de ver os produtos mais vendidos ou clientes de maior destaque?`,
      };
    }

    // A2) Listagem Geral de Clientes
    if (q.includes('meus clientes') || q.includes('quais são meus clientes') || q.includes('quais são os clientes') || (q.includes('cliente') && (q.includes('quais') || q.includes('listar') || q.includes('todos')) && !q.includes('inativ') && !q.includes('cadastr'))) {
      const data = await aiTools.get_customers(companyId);
      if (data.total === 0) {
        return {
          reply: `Você ainda não possui clientes cadastrados no sistema.`,
        };
      }
      const topList = data.customers.slice(0, 5).map((c, i) => `${i + 1}º **${c.name}** (${c.status.toUpperCase()})`).join('\n');
      return {
        reply: `Você possui **${data.total} cliente(s)** cadastrado(s) na sua base:\n\n${topList}\n\n💡 Deseja que eu analise os clientes inativos para recuperação?`,
      };
    }

    // B) Clientes Inativos / Recuperação
    if (q.includes('inativ') || q.includes('recuperar') || q.includes('sem compra')) {
      const data = await aiTools.get_inactive_customers(companyId);
      if (data.count === 0) {
        return {
          reply: `Excelente notícia! Não há clientes inativos há mais de 60 dias no sistema no momento. Sua base está saudável.`,
        };
      }
      const top3 = data.customers.slice(0, 3).map(c => `• **${c.name}** (${formatDaysInactiveText(c.daysInactive)})`).join('\n');
      return {
        reply: `Identifiquei **${data.count} cliente(s) inativo(s)** sem efetuar compras há mais de 60 dias.\n\nPrincipais contatos prioritários para recuperação:\n${top3}\n\n💡 Recomendo entrar em contato via WhatsApp oferecendo uma condição especial ou novidades do estoque.`,
      };
    }

    // C) Melhores Clientes
    if (q.includes('melhores clientes') || q.includes('maiores clientes') || q.includes('top clientes')) {
      const customers = await storage.getCustomers(companyId);
      if (customers.length === 0) {
        return {
          reply: `Ainda não temos clientes com histórico de compras cadastrados.`,
        };
      }
      const topCustomers = [...customers].sort((a, b) => (b.total_purchases || 0) - (a.total_purchases || 0)).slice(0, 3);
      const listText = topCustomers.map((c, i) => `${i + 1}º **${c.name}** — Total de ${formatCurrency(c.total_purchases)} (${c.purchase_count} compras)`).join('\n');
      return {
        reply: `Aqui estão seus principais clientes por volume histórico de compras:\n\n${listText}\n\n🏆 Esses clientes representam as contas estratégicas da sua empresa.`,
      };
    }

    // D) Estoque Baixo / Produtos
    if (q.includes('estoque') || q.includes('produto') || q.includes('acabando')) {
      const lowStockData = await aiTools.get_low_stock_products(companyId);
      if (lowStockData.count === 0) {
        const prodData = await aiTools.get_products(companyId);
        return {
          reply: `Todos os seus produtos cadastrados (${prodData.total} itens) estão com níveis de estoque acima do limite mínimo estabelecido. Situação regular!`,
        };
      }
      const itemsList = lowStockData.products.slice(0, 3).map(p => `• **${p.name}**: apenas ${p.stock} unid. (mínimo sugerido: ${p.min_stock})`).join('\n');
      return {
        reply: `⚠️ Atenção: Temos **${lowStockData.count} produto(s) com estoque baixo** que precisam de reposição:\n\n${itemsList}\n\n💡 Deseja que eu crie uma tarefa para emissão de ordem de compra aos fornecedores?`,
      };
    }

    // E) Contas Vencendo / Financeiro / Pagar / Receber
    if (q.includes('conta') || q.includes('venc') || q.includes('pagar') || q.includes('receber') || q.includes('financeir')) {
      const pay = await aiTools.get_payables(companyId);
      const rec = await aiTools.get_receivables(companyId);

      return {
        reply: `Resumo financeiro das obrigações pendentes:\n\n` +
          `💳 **Contas a Pagar:** ${pay.count} contas pendentes totalizando **${formatCurrency(pay.totalPayables)}**.\n` +
          `💰 **Contas a Receber:** ${rec.count} títulos pendentes totalizando **${formatCurrency(rec.totalReceivables)}**.\n\n` +
          `Saldo projetado de curto prazo: **${formatCurrency(rec.totalReceivables - pay.totalPayables)}**.`,
      };
    }

    // F) Tarefas
    if (q.includes('tarefa') || q.includes('pendên') || q.includes('afazer')) {
      const data = await aiTools.get_tasks(companyId);
      if (data.pending.length === 0) {
        return {
          reply: `Você não possui tarefas pendentes no momento. Todas estão em dia!`,
        };
      }
      const list = data.pending.slice(0, 3).map(t => `• **${t.title}** (${t.priority.toUpperCase()})`).join('\n');
      return {
        reply: `Você tem **${data.pending.length} tarefa(s) pendente(s)**:\n\n${list}\n\nPosso cadastrar uma nova tarefa a qualquer momento, basta me solicitar!`,
      };
    }

    // G) Principais Problemas / Diagnóstico
    if (q.includes('problema') || q.includes('atenção') || q.includes('diagnóstic') || q.includes('como está a empresa')) {
      const [lowStock, inactive, pay] = await Promise.all([
        aiTools.get_low_stock_products(companyId),
        aiTools.get_inactive_customers(companyId),
        aiTools.get_payables(companyId),
      ]);

      const issues: string[] = [];
      if (lowStock.count > 0) issues.push(`⚠️ ${lowStock.count} produtos em nível crítico de estoque`);
      if (inactive.count > 0) issues.push(`⚠️ ${inactive.count} clientes sem compras há mais de 60 dias`);
      if (pay.count > 0) issues.push(`💳 ${pay.count} contas a pagar aguardando liquidação (${formatCurrency(pay.totalPayables)})`);

      if (issues.length === 0) {
        return {
          reply: `Analisando os registros do sistema, sua empresa está com os indicadores em dia! Sem alertas críticos de estoque, inadimplência ou clientes abandonados no momento.`,
        };
      }

      return {
        reply: `Principais pontos de atenção identificados nos dados da empresa:\n\n${issues.join('\n')}\n\n💡 Sugiro focar na recuperação dos clientes e na reposição dos estoques mínimos.`,
      };
    }

    // H) Fallback com dados da empresa
    const company = await aiTools.get_company_info(companyId);
    return {
      reply: `Olá! Sou o **${aiName}**, seu funcionário de IA na **${company?.name || 'sua empresa'}**.\n\nPosso analisar suas vendas, identificar clientes inativos, verificar o estoque, monitorar contas a pagar/receber e cadastrar novos clientes ou tarefas.\n\nComo posso ajudar você agora? Experimente perguntar: *"Quanto vendemos este mês?"* ou *"Quais clientes preciso recuperar?"*.`,
    };
  },

  async confirmAndExecuteAction(companyId: string, actionData: AIMessageActionData): Promise<{ success: boolean; message: string }> {
    try {
      const { tool, parameters } = actionData;
      switch (tool) {
        case 'create_customer':
          await aiTools.create_customer(companyId, parameters);
          return { success: true, message: `Cliente "${parameters.name}" cadastrado com sucesso no sistema!` };

        case 'create_task':
          await aiTools.create_task(companyId, parameters);
          return { success: true, message: `Tarefa "${parameters.title}" criada com sucesso na sua agenda!` };

        case 'create_expense':
          await aiTools.create_expense(companyId, parameters);
          return { success: true, message: `Despesa de ${formatCurrency(parameters.amount)} registrada com sucesso no financeiro!` };

        default:
          throw new Error(`Ferramenta ${tool} não suportada.`);
      }
    } catch (e: any) {
      console.error('Action execution error:', e);
      return { success: false, message: e.message || 'Não foi possível concluir a ação.' };
    }
  }
};
