import { storage } from './storage';
import { Customer, Product, LeadStage, TaskPriority } from '@/types';

export const demoService = {
  async loadDemoData(companyId: string): Promise<void> {
    // 1. Clear existing company data first so demo is clean
    await storage.clearAllCompanyData(companyId);

    // 2. Generate 15 Realistic Products with healthy stock
    const productsSeed = [
      { name: 'Notebook Pro 15 Ultra', sku: 'NOT-001', category: 'Informática', price: 4890.00, cost: 3200.00, stock: 45, min_stock: 5, supplier: 'Dell Distribuição' },
      { name: 'Monitor Gamer 27 165Hz', sku: 'MON-002', category: 'Monitores', price: 1450.00, cost: 950.00, stock: 50, min_stock: 8, supplier: 'LG Eletrônicos' },
      { name: 'Teclado Mecânico RGB Switch Brown', sku: 'PER-003', category: 'Periféricos', price: 340.00, cost: 180.00, stock: 65, min_stock: 10, supplier: 'Redragon Brasil' },
      { name: 'Mouse Sem Fio Ergonômico', sku: 'PER-004', category: 'Periféricos', price: 189.90, cost: 85.00, stock: 80, min_stock: 15, supplier: 'Logitech' },
      { name: 'Headset Profissional com Cancelamento', sku: 'AUD-005', category: 'Áudio', price: 420.00, cost: 240.00, stock: 45, min_stock: 5, supplier: 'JBL Pro' },
      { name: 'Cadeira Ergonômica Mesh Diretor', sku: 'MOV-006', category: 'Mobiliário', price: 1290.00, cost: 780.00, stock: 30, min_stock: 4, supplier: 'Flexform' },
      { name: 'Mesa Elevatória Elétrica 140cm', sku: 'MOV-007', category: 'Mobiliário', price: 2190.00, cost: 1450.00, stock: 25, min_stock: 3, supplier: 'GenioDesk' },
      { name: 'Webcam 4K Ultra Clear com Tripé', sku: 'VID-008', category: 'Vídeo', price: 580.00, cost: 310.00, stock: 35, min_stock: 6, supplier: 'Anker' },
      { name: 'Suporte Articulado a Gás para 2 Monitores', sku: 'SUP-009', category: 'Acessórios', price: 280.00, cost: 140.00, stock: 55, min_stock: 10, supplier: 'ELG' },
      { name: 'Dock Station USB-C Hub 10 em 1', sku: 'CAB-010', category: 'Acessórios', price: 320.00, cost: 160.00, stock: 50, min_stock: 8, supplier: 'Baseus' },
      { name: 'SSD NVMe M.2 1TB 7000MB/s', sku: 'ARM-011', category: 'Armazenamento', price: 520.00, cost: 340.00, stock: 40, min_stock: 6, supplier: 'Kingston' },
      { name: 'No-Break Senoidal 1500VA Bivolt', sku: 'ENE-012', category: 'Energia', price: 1100.00, cost: 720.00, stock: 25, min_stock: 3, supplier: 'SMS Legrand' },
      { name: 'Microfone Condensador USB Estúdio', sku: 'AUD-013', category: 'Áudio', price: 390.00, cost: 210.00, stock: 8, min_stock: 10, supplier: 'HyperX' }, // Low stock alert (stock 8 <= min 10)
      { name: 'Roteador Wi-Fi 6 Mesh Gigabit', sku: 'RED-014', category: 'Redes', price: 460.00, cost: 280.00, stock: 9, min_stock: 12, supplier: 'TP-Link' }, // Low stock alert (stock 9 <= min 12)
      { name: 'Cabo HDMI 2.1 8K Blindado 2m', sku: 'CAB-015', category: 'Acessórios', price: 65.00, cost: 25.00, stock: 90, min_stock: 15, supplier: 'UGreen' },
    ];

    const createdProducts: Product[] = [];
    for (const p of productsSeed) {
      const prod = await storage.saveProduct(companyId, p);
      createdProducts.push(prod);
    }

    // 2. Generate 20 Customers with varying activity
    const customersSeed = [
      { name: 'TecnoCorp Soluções Digitais', company_name: 'TecnoCorp Ltda', phone: '(11) 98765-4321', email: 'contato@tecnocorp.com.br', document: '12.345.678/0001-90', city: 'São Paulo', state: 'SP', status: 'ativo' as const },
      { name: 'Dra. Camila Vasconcelos', company_name: 'Clínica Vasconcelos', phone: '(21) 99876-5432', email: 'camila@clinica.med.br', document: '234.567.890-12', city: 'Rio de Janeiro', state: 'RJ', status: 'ativo' as const },
      { name: 'Roberto Alencar Consultoria', company_name: 'Alencar Gestão', phone: '(31) 97654-3210', email: 'roberto@alencar.com.br', document: '34.567.890/0001-12', city: 'Belo Horizonte', state: 'MG', status: 'ativo' as const },
      { name: 'Studio Criativo Chroma', company_name: 'Chroma Design ME', phone: '(41) 98123-4567', email: 'ola@chroma.art.br', document: '45.678.901/0001-23', city: 'Curitiba', state: 'PR', status: 'ativo' as const },
      { name: 'Engenharia & Obras Vanguarda', company_name: 'Vanguarda Construtora', phone: '(51) 99234-5678', email: 'suprimentos@vanguarda.eng.br', document: '56.789.012/0001-34', city: 'Porto Alegre', state: 'RS', status: 'ativo' as const },
      { name: 'Lucas Ferreira', company_name: null, phone: '(71) 98888-7777', email: 'lucas.ferreira@email.com', document: '456.789.012-34', city: 'Salvador', state: 'BA', status: 'ativo' as const },
      { name: 'Logística Rápida Brasil', company_name: 'Fast Cargo Ltda', phone: '(19) 98456-7890', email: 'adm@fastcargo.com.br', document: '67.890.123/0001-45', city: 'Campinas', state: 'SP', status: 'ativo' as const },
      { name: 'Escritório Contábil Alfa', company_name: 'Alfa Contabilidade', phone: '(61) 99123-9876', email: 'fiscal@alfacontabil.com.br', document: '78.901.234/0001-56', city: 'Brasília', state: 'DF', status: 'ativo' as const },
      { name: 'Mariana Duarte Arquitetura', company_name: 'MD Projetos', phone: '(85) 98777-6655', email: 'mariana@mdprojetos.com.br', document: '567.890.123-45', city: 'Fortaleza', state: 'CE', status: 'ativo' as const },
      { name: 'Academia Corpo & Vida', company_name: 'Corpo e Vida Fitness', phone: '(27) 99345-6789', email: 'financeiro@corpoevida.com.br', document: '89.012.345/0001-67', city: 'Vitória', state: 'ES', status: 'ativo' as const },
      
      // Inactive customers (>60 days without purchase)
      { name: 'Eduardo Silveira Advogados', company_name: 'Silveira Law', phone: '(11) 97111-2222', email: 'eduardo@silveiralaw.adv.br', document: '90.123.456/0001-78', city: 'São Paulo', state: 'SP', status: 'inativo' as const },
      { name: 'Restaurante Sabor & Arte', company_name: 'Gastronomia Nobre Ltda', phone: '(31) 98555-4433', email: 'gerencia@saborearte.com.br', document: '01.234.567/0001-89', city: 'Belo Horizonte', state: 'MG', status: 'inativo' as const },
      { name: 'Agência Digital Impulso', company_name: 'Impulso Marketing', phone: '(48) 99666-5544', email: 'contato@impulsomkt.com.br', document: '12.456.789/0001-90', city: 'Florianópolis', state: 'SC', status: 'inativo' as const },
      { name: 'Felipe Mendes Representações', company_name: null, phone: '(62) 98333-2211', email: 'felipe.mendes@rep.com.br', document: '678.901.234-56', city: 'Goiânia', state: 'GO', status: 'inativo' as const },
      { name: 'Farmácia Popular Saúde Já', company_name: 'Saúde Já Drogaria', phone: '(81) 99222-1100', email: 'compras@saudeja.com.br', document: '23.567.890/0001-01', city: 'Recife', state: 'PE', status: 'inativo' as const },

      // Potential leads / prospects
      { name: 'Colégio Nova Esperança', company_name: 'Instituto Educacional NE', phone: '(11) 96444-3322', email: 'ti@novaesperanca.edu.br', document: '34.678.901/0001-12', city: 'Santos', state: 'SP', status: 'potencial' as const },
      { name: 'Beatriz Martins Fotografia', company_name: 'BM Photo', phone: '(21) 97555-6677', email: 'contato@beatrizmartins.com', document: '789.012.345-67', city: 'Niterói', state: 'RJ', status: 'potencial' as const },
      { name: 'Distribuidora São Jorge', company_name: 'São Jorge Bebidas', phone: '(47) 98888-9900', email: 'vendas@saojorgebebidas.com', document: '45.789.012/0001-23', city: 'Joinville', state: 'SC', status: 'potencial' as const },
      { name: 'Carlos Henrique Consultores', company_name: null, phone: '(79) 99111-3344', email: 'carlos@chconsult.com', document: '890.123.456-78', city: 'Aracaju', state: 'SE', status: 'potencial' as const },
      { name: 'Mundo Pet Centro Veterinário', company_name: 'Pet Life Vet', phone: '(84) 98222-4455', email: 'atendimento@mundopetvet.com.br', document: '56.890.123/0001-34', city: 'Natal', state: 'RN', status: 'potencial' as const },
    ];

    const createdCustomers: Customer[] = [];
    for (const c of customersSeed) {
      const cust = await storage.saveCustomer(companyId, c);
      createdCustomers.push(cust);
    }

    // 3. Generate 30 Sales distributed across the past 30 days
    const paymentMethods: Array<any> = ['pix', 'cartao_credito', 'cartao_debito', 'boleto', 'a_prazo'];
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      // Pick a random customer (active or inactive)
      const customer = createdCustomers[i % 15];
      // Pick 1 to 3 items
      const p1 = createdProducts[i % createdProducts.length];
      const p2 = createdProducts[(i + 3) % createdProducts.length];
      
      // Calculate a date going back between 0 and 35 days
      const daysAgo = Math.floor(i * 1.1);
      const saleDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      await storage.createSale(companyId, {
        customer_id: customer.id,
        items: [
          { product_id: p1.id, quantity: 1, unit_price: p1.price },
          ...(i % 2 === 0 ? [{ product_id: p2.id, quantity: 1, unit_price: p2.price }] : []),
        ],
        discount: i % 4 === 0 ? 50 : 0,
        payment_method: paymentMethods[i % paymentMethods.length],
        sale_date: saleDate,
        notes: `Venda gerada para demonstração (#${i + 1})`,
      });
    }

    // 4. Generate 10 Expenses
    const expensesSeed = [
      { description: 'Aluguel do Escritório & Condomínio', category: 'Infraestrutura', amount: 3500.00, status: 'pago' as const, date: new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0] },
      { description: 'Energia Elétrica e Internet Fibra', category: 'Utilidades', amount: 680.00, status: 'pago' as const, date: new Date(now.getTime() - 8 * 86400000).toISOString().split('T')[0] },
      { description: 'Licenças de Softwares e Nuvem AWS', category: 'Tecnologia', amount: 1450.00, status: 'pago' as const, date: new Date(now.getTime() - 12 * 86400000).toISOString().split('T')[0] },
      { description: 'Honorários Contabilidade Mensal', category: 'Serviços', amount: 1200.00, status: 'pago' as const, date: new Date(now.getTime() - 15 * 86400000).toISOString().split('T')[0] },
      { description: 'Campanha de Marketing Google Ads', category: 'Marketing', amount: 2200.00, status: 'pago' as const, date: new Date(now.getTime() - 20 * 86400000).toISOString().split('T')[0] },
      { description: 'Material de Escritório e Café', category: 'Operacional', amount: 310.00, status: 'pago' as const, date: new Date(now.getTime() - 22 * 86400000).toISOString().split('T')[0] },
      { description: 'Manutenção de Ar-condicionado', category: 'Manutenção', amount: 450.00, status: 'pendente' as const, date: new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0], due_date: new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0] },
      { description: 'Seguro Empresarial Patrimonial', category: 'Seguros', amount: 890.00, status: 'pendente' as const, date: new Date(now.getTime() + 5 * 86400000).toISOString().split('T')[0], due_date: new Date(now.getTime() + 5 * 86400000).toISOString().split('T')[0] },
      { description: 'Serviço de Limpeza e Conservação', category: 'Serviços', amount: 750.00, status: 'pago' as const, date: new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0] },
      { description: 'Impostos Simples Nacional', category: 'Impostos', amount: 2890.00, status: 'vencido' as const, date: new Date(now.getTime() - 2 * 86400000).toISOString().split('T')[0], due_date: new Date(now.getTime() - 2 * 86400000).toISOString().split('T')[0] },
    ];

    for (const exp of expensesSeed) {
      await storage.saveExpense(companyId, exp);
    }

    // 5. Generate 10 Tasks
    const tasksSeed = [
      { title: 'Ligar para Dra. Camila para renovação de suprimentos', description: 'Verificar interesse no lote de monitores e suporte duplo.', assignee: 'Ana Paula', priority: 'alta' as TaskPriority, status: 'pendente' as const, due_date: new Date(now.getTime() + 1 * 86400000).toISOString().split('T')[0] },
      { title: 'Emitir nota fiscal e despachar pedido da TecnoCorp', description: 'Nota referente aos notebooks da equipe comercial.', assignee: 'Carlos', priority: 'alta' as TaskPriority, status: 'em_andamento' as const, due_date: new Date().toISOString().split('T')[0] },
      { title: 'Reabastecer estoque de Roteadores Wi-Fi 6', description: 'Estoque atingiu o nível crítico de 2 unidades.', assignee: 'Almoxarifado', priority: 'alta' as TaskPriority, status: 'pendente' as const, due_date: new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0] },
      { title: 'Reunião de alinhamento com fornecedor Dell', description: 'Negociar tabela de preços para fechamento do trimestre.', assignee: 'Diretoria', priority: 'media' as TaskPriority, status: 'pendente' as const, due_date: new Date(now.getTime() + 4 * 86400000).toISOString().split('T')[0] },
      { title: 'Revisar proposta comercial do Colégio Nova Esperança', description: 'Ajustar prazo de entrega para 15 dias úteis.', assignee: 'Mariana', priority: 'media' as TaskPriority, status: 'em_andamento' as const, due_date: new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0] },
      { title: 'Conciliação bancária das vendas via PIX e Boletos', description: 'Conferir extrato com relatório de recebíveis.', assignee: 'Financeiro', priority: 'media' as TaskPriority, status: 'concluida' as const, due_date: new Date().toISOString().split('T')[0] },
      { title: 'Organizar catálogo de fotos dos novos produtos', description: 'Subir imagens no padrão SaaS para o showroom.', assignee: 'Marketing', priority: 'baixa' as TaskPriority, status: 'concluida' as const, due_date: new Date(now.getTime() - 3 * 86400000).toISOString().split('T')[0] },
      { title: 'Enviar mensagem de reativação para clientes inativos', description: 'Oferecer condição especial de frete grátis.', assignee: 'Ana Paula', priority: 'alta' as TaskPriority, status: 'pendente' as const, due_date: new Date(now.getTime() + 1 * 86400000).toISOString().split('T')[0] },
      { title: 'Atualizar backup da base de dados', description: 'Verificar redundância semanal dos arquivos fiscais.', assignee: 'TI', priority: 'baixa' as TaskPriority, status: 'concluida' as const, due_date: new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0] },
      { title: 'Auditoria física de inventário do almoxarifado', description: 'Contagem geral de periféricos e fones.', assignee: 'Carlos', priority: 'media' as TaskPriority, status: 'pendente' as const, due_date: new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0] },
    ];

    for (const t of tasksSeed) {
      await storage.saveTask(companyId, t);
    }

    // 6. Generate 10 CRM Leads across pipeline stages
    const leadsSeed = [
      { name: 'Grupo Horizon Imóveis', company_name: 'Horizon Negócios', contact_name: 'Dr. Geraldo', email: 'geraldo@horizon.com.br', phone: '(11) 97777-8899', stage: 'novo' as LeadStage, estimated_value: 12500.00, source: 'Indicação' },
      { name: 'Rede Farma Mais', company_name: 'Farma Mais Drogarias', contact_name: 'Juliana', email: 'compras@farmamais.com', phone: '(21) 98888-2233', stage: 'novo' as LeadStage, estimated_value: 18400.00, source: 'Site' },
      { name: 'InovaTech Softwares', company_name: 'InovaTech Cloud', contact_name: 'Vinicius', email: 'vinicius@inovatech.io', phone: '(31) 99123-4567', stage: 'contato' as LeadStage, estimated_value: 8900.00, source: 'LinkedIn' },
      { name: 'Hospital Santa Clara', company_name: 'Associação Hospitalar', contact_name: 'Enf. Cristina', email: 'compras@santaclara.org.br', phone: '(41) 99555-1234', stage: 'contato' as LeadStage, estimated_value: 34000.00, source: 'Google Ads' },
      { name: 'Auto Peças Modelo', company_name: 'Modelo Peças Ltda', contact_name: 'Henrique', email: 'henrique@modelocas.com.br', phone: '(19) 98111-9988', stage: 'interessado' as LeadStage, estimated_value: 6700.00, source: 'Feira Comercial' },
      { name: 'Colégio Nova Esperança', company_name: 'Instituto Educacional', contact_name: 'Prof. Marcos', email: 'marcos@novaesperanca.edu.br', phone: '(11) 96444-3322', stage: 'proposta' as LeadStage, estimated_value: 15200.00, source: 'WhatsApp' },
      { name: 'Boutique do Aço Industrial', company_name: 'Aço Forte ME', contact_name: 'Rodrigo', email: 'diretoria@acoforte.ind.br', phone: '(27) 99777-6655', stage: 'proposta' as LeadStage, estimated_value: 22000.00, source: 'Indicação' },
      { name: 'Smart Coworking Hub', company_name: 'Smart Space', contact_name: 'Fernanda', email: 'fernanda@smartspace.com', phone: '(51) 99333-8877', stage: 'negociacao' as LeadStage, estimated_value: 19800.00, source: 'Instagram' },
      { name: 'Agência Criativa Ponto A', company_name: 'Ponto A Publicidade', contact_name: 'Tiago', email: 'tiago@pontoa.mkt.br', phone: '(85) 98666-4433', stage: 'cliente' as LeadStage, estimated_value: 9400.00, source: 'Google' },
      { name: 'Restaurante Varanda Gourmet', company_name: 'Varanda Gastronomia', contact_name: 'Patrícia', email: 'patricia@varandagourmet.com', phone: '(71) 98222-3311', stage: 'perdido' as LeadStage, estimated_value: 5300.00, source: 'Outro' },
    ];

    for (const l of leadsSeed) {
      await storage.saveLead(companyId, l);
    }

    // 7. Generate a few notifications
    await storage.createNotification(companyId, {
      title: 'Estoque Crítico',
      message: 'O produto "Roteador Wi-Fi 6 Mesh" está com apenas 2 unidades em estoque.',
      type: 'alerta',
      link: '/produtos',
    });
    await storage.createNotification(companyId, {
      title: 'Clientes Inativos',
      message: '5 clientes importantes não compram há mais de 60 dias.',
      type: 'aviso',
      link: '/clientes',
    });
    await storage.createNotification(companyId, {
      title: 'Boas-vindas ao NEXA',
      message: 'Dados de demonstração carregados com sucesso. Explore todas as telas ou converse com o NEXA!',
      type: 'sucesso',
      link: '/ia',
    });
  },

  async clearDemoData(companyId: string): Promise<void> {
    await storage.clearAllCompanyData(companyId);
  }
};
