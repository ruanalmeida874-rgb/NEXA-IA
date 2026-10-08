# NEXA — Funcionário de IA para Pequenas Empresas

Um SaaS moderno e completo para gestão empresarial com um **assistente inteligente de IA** integrado diretamente à base de dados da empresa.

---

## 🚀 Funcionalidades Principais

1. **Dashboard Executivo:**
   - Métricas de faturamento do mês, total de vendas, clientes ativos e inativos (>60 dias sem compras).
   - Contas a receber vs contas a pagar.
   - Gráfico de evolução de vendas nos últimos 14 dias (Recharts).
   - Comparativo mensal de Receita x Despesas.
   - Painel de alertas críticos em tempo real.

2. **Funcionário de IA (`/ia`):**
   - Agente inteligente com ferramentas internas seguras conectadas ao banco de dados:
     - `get_sales`, `get_customers`, `get_inactive_customers`, `get_products`, `get_low_stock_products`, `get_expenses`, `get_receivables`, `get_payables`, `get_tasks`.
   - **Confirmação Obrigatória de Ações:** Operações mutativas (cadastrar cliente, criar tarefas, registrar despesas) geram um card de confirmação com `[Confirmar]` e `[Cancelar]`, nunca alterando o banco antes do aval do usuário.
   - Respostas humanas, concisas e em português brasileiro.

3. **Clientes (`/clientes`):**
   - CRUD completo, busca por múltiplos campos e filtros por status (Ativo, Inativo, Potencial).
   - Indicador automático de inatividade ("Inativo há X dias").
   - Histórico consolidado de compras e total transacionado.

4. **Produtos & Estoque (`/produtos`):**
   - Controle de inventário com SKU, categoria, preço de venda e custo de aquisição.
   - Alertas visuais de estoque baixo (<= estoque mínimo) e sem estoque.

5. **Vendas (`/vendas`):**
   - Baixa atômica de estoque em tempo real (proíbe estoque negativo).
   - Atualização automática das métricas do cliente (última compra, ticket acumulado).
   - Geração automática de Contas a Receber para vendas a prazo ou boleto bancário.

6. **Financeiro (`/financeiro`):**
   - Controle segmentado de Despesas, Contas a Receber e Contas a Pagar.
   - Cálculo automático de saldo projetado.

7. **Tarefas (`/tarefas`):**
   - Gestão de compromissos com prioridades, prazos, responsáveis e status.
   - Criação manual ou via comandos para o NEXA.

8. **CRM (`/crm`):**
   - Funil Kanban com 6 estágios: *Novo Lead* ➔ *Contato Realizado* ➔ *Interessado* ➔ *Proposta* ➔ *Negociação* ➔ *Fechado/Ganho*.
   - Movimentação ágil de cards e conversão automática para cliente.

9. **Relatórios & Insights (`/relatorios`, `/insights`):**
   - Filtros de período (Hoje, 7 dias, 30 dias, 90 dias, Este ano).
   - Top 5 produtos em faturamento e distribuição por forma de pagamento.
   - Diagnósticos automáticos (Oportunidades, Alertas e Recomendações).

10. **Modo Demonstração (Demo Mode):**
    - A aplicação inicia **100% vazia**.
    - No cabeçalho, o botão **"Modo Demonstração"** permite carregar com 1 clique:
      - 20 clientes
      - 15 produtos
      - 30 vendas
      - 10 despesas
      - 10 tarefas
      - 10 leads no CRM
    - Opção de **"Limpar dados"** para retornar a empresa ao estado vazio a qualquer momento.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 18, TypeScript, Vite
- **Estilização:** Tailwind CSS, Lucide Icons, Plus Jakarta Sans
- **Gráficos:** Recharts
- **Banco de Dados & Auth:** Supabase (PostgreSQL com Row Level Security)
- **Testes:** Vitest (13 testes automatizados cobrindo regras de negócio, isolamento multi-tenant e confirmação da IA)
- **Linter:** ESLint 9 + TypeScript-ESLint

---

## 📦 Como Rodar Localmente

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Rodar em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:5173`.

3. **Rodar os testes automatizados:**
   ```bash
   npm test
   ```

4. **Gerar build de produção:**
   ```bash
   npm run build
   ```

---

## 🔐 Configuração do Supabase (Opcional)

Por padrão, a aplicação inclui um mecanismo de persistência seguro no navegador para testes imediatos sem necessidade de credenciais externas.

Para conectar à sua nuvem Supabase:
1. Crie um projeto em [supabase.com](https://supabase.com).
2. Execute o script contido em `supabase/schema.sql` no **SQL Editor** do Supabase.
3. Crie um arquivo `.env` na raiz do projeto com:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```
