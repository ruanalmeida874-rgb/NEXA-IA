import React from 'react';
import { HelpCircle, Bot, Database, Shield, Zap, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const HelpPage: React.FC = () => {
  const { company } = useAuth();
  const aiName = company?.ai_employee_name || 'NEXA';

  const topics = [
    {
      icon: Bot,
      title: `Como interagir com o ${aiName}`,
      desc: 'O assistente compreende linguagem natural em português. Você pode fazer perguntas como "Quanto vendemos este mês?", "Quais clientes preciso recuperar?" ou solicitar mutações como "Cadastre o cliente Empresa ABC telefone 99999-9999".',
    },
    {
      icon: Shield,
      title: 'Confirmação Obrigatória de Ações',
      desc: 'Para garantir total segurança patrimonial e operacional da sua empresa, nenhuma ação que cadastre ou altere dados é feita sem que você clique expressamente no botão [Confirmar] gerado pelo assistente.',
    },
    {
      icon: Database,
      title: 'Modo Demonstração vs Banco Real',
      desc: 'No topo da tela você encontra o botão "Modo Demonstração". Ele permite carregar 20 clientes, 15 produtos, 30 vendas e despesas em um clique para fins de apresentação, e limpá-los a qualquer momento para voltar ao estado vazio.',
    },
    {
      icon: Zap,
      title: 'Controle de Estoque Atômico',
      desc: 'Ao concluir uma venda, o estoque do produto é deduzido imediatamente e não permite valores negativos. O total comprado pelo cliente e a data da última compra são atualizados automaticamente.',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-brand-600" />
          Guia do Usuário & Central de Ajuda
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Aprenda a extrair o máximo do NEXA para alavancar a produtividade e o controle da sua empresa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* SQL Setup Instructions Box */}
      <div className="bg-slate-900 text-slate-200 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 text-brand-400 font-bold text-sm mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Configuração do Banco de Dados no Supabase</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Para conectar um novo projeto Supabase em nuvem:
        </p>
        <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
          <li>Crie um projeto no Supabase (supabase.com).</li>
          <li>Acesse a aba <strong>SQL Editor</strong> no painel do Supabase.</li>
          <li>Cole e execute o script contido em <code className="text-brand-300">supabase/schema.sql</code> deste projeto.</li>
          <li>Copie sua URL e chave anon pública para o arquivo <code className="text-brand-300">.env</code>.</li>
        </ol>
      </div>
    </div>
  );
};
