import React, { useEffect, useState, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Plus, 
  Sparkles, 
  Check, 
  X, 
  Loader2, 
  MessageSquare, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import { aiService } from '@/services/aiService';
import { AIConversation, AIMessage, AIMessageActionData } from '@/types';
import { formatDateTime } from '@/utils/formatters';

export const AIAssistantPage: React.FC = () => {
  const { company } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiName = company?.ai_employee_name || 'NEXA';

  const suggestions = [
    'Como estão minhas vendas?',
    'Quais clientes preciso recuperar?',
    'Mostre meu faturamento.',
    'Tenho contas vencendo esta semana?',
    'Quais são os principais problemas da empresa?',
    'Cadastre o cliente João Silva telefone (75) 99999-9999',
    'Crie uma tarefa para ligar para Maria amanhã',
  ];

  // 1. Load conversations list
  useEffect(() => {
    const initConversations = async () => {
      if (!company?.id) return;
      const list = await storage.getAIConversations(company.id);
      setConversations(list);
      if (list.length > 0) {
        setActiveConvId(list[0].id);
      } else {
        // Create first conversation
        const created = await storage.createAIConversation(company.id, `Conversa com ${aiName}`);
        setConversations([created]);
        setActiveConvId(created.id);
      }
    };
    initConversations();
  }, [company?.id, aiName]);

  // 2. Load messages for active conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!company?.id || !activeConvId) return;
      const msgs = await storage.getAIMessages(company.id, activeConvId);
      
      // If conversation is brand new and has no messages, insert a greeting
      if (msgs.length === 0) {
        const welcome = await storage.saveAIMessage(company.id, {
          conversation_id: activeConvId,
          company_id: company.id,
          role: 'assistant',
          content: `Olá! Sou o **${aiName}**, seu funcionário de IA na **${company.name}**.\n\nEstou conectado aos dados da sua empresa em tempo real. Você pode me pedir relatórios de faturamento, consultar estoque, listar clientes inativos ou me pedir para cadastrar novos clientes e tarefas.\n\nComo posso ajudar você hoje?`,
        });
        setMessages([welcome]);
      } else {
        setMessages(msgs);
      }
    };
    loadMessages();
  }, [company?.id, activeConvId, aiName]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleCreateNewConversation = async () => {
    if (!company?.id) return;
    const count = conversations.length + 1;
    const created = await storage.createAIConversation(company.id, `Conversa #${count}`);
    setConversations([created, ...conversations]);
    setActiveConvId(created.id);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || !company?.id || !activeConvId || sending) return;

    setInputText('');
    setSending(true);

    try {
      // 1. Save user message
      const userMsg = await storage.saveAIMessage(company.id, {
        conversation_id: activeConvId,
        company_id: company.id,
        role: 'user',
        content: query.trim(),
      });
      setMessages((prev) => [...prev, userMsg]);

      // 2. Process with AI Agent & Database tools
      const response = await aiService.processUserMessage(company.id, query.trim(), aiName);

      // 3. Save assistant message
      const botMsg = await storage.saveAIMessage(company.id, {
        conversation_id: activeConvId,
        company_id: company.id,
        role: 'assistant',
        content: response.reply,
        action_data: response.actionData || null,
        action_status: response.actionData ? 'pending_confirmation' : null,
      });

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
      // Friendly fallback error
      const errReply = await storage.saveAIMessage(company.id, {
        conversation_id: activeConvId,
        company_id: company.id,
        role: 'assistant',
        content: 'Não consegui concluir essa ação agora. Seus dados continuam seguros. Tente novamente em instantes.',
      });
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setSending(false);
    }
  };

  const handleConfirmAction = async (msgId: string, actionData: AIMessageActionData) => {
    if (!company?.id) return;
    setExecutingActionId(msgId);

    try {
      const res = await aiService.confirmAndExecuteAction(company.id, actionData);
      
      const updatedMsg = await storage.saveAIMessage(company.id, {
        id: msgId,
        conversation_id: activeConvId!,
        company_id: company.id,
        role: 'assistant',
        content: res.success ? `✅ **Ação confirmada e executada:**\n\n${res.message}` : `⚠️ **Não foi possível executar:** ${res.message}`,
        action_status: res.success ? 'executed' : 'cancelled',
      });

      setMessages((prev) => prev.map((m) => (m.id === msgId ? updatedMsg : m)));
    } catch (e: any) {
      console.error(e);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleCancelAction = async (msgId: string) => {
    if (!company?.id) return;
    const updatedMsg = await storage.saveAIMessage(company.id, {
      id: msgId,
      conversation_id: activeConvId!,
      company_id: company.id,
      role: 'assistant',
      content: '❌ Ação cancelada pelo usuário. Nenhum registro foi alterado.',
      action_status: 'cancelled',
    });
    setMessages((prev) => prev.map((m) => (m.id === msgId ? updatedMsg : m)));
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col lg:flex-row gap-4">
      {/* Left Sidebar: Conversations History */}
      <div className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col p-3 shrink-0">
        <button
          onClick={handleCreateNewConversation}
          className="w-full py-2.5 px-3 rounded-xl bg-brand-50 hover:bg-brand-100/80 text-brand-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-brand-200/60 shadow-2xs mb-3"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conversa</span>
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Histórico de Conversas
          </p>
          {conversations.map((conv) => {
            const isActive = conv.id === activeConvId;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span className="truncate flex-1">{conv.title}</span>
              </button>
            );
          })}
        </div>

        <div className="p-2.5 mt-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px] font-medium text-slate-600">Ações seguras com confirmação</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800">{aiName}</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Consultando base real de {company?.name}</p>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                    isUser
                      ? 'bg-slate-800 text-white'
                      : 'bg-brand-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? 'Você' : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-2">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-brand-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/60'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>

                    {/* ACTION CONFIRMATION CARD (For mutating tools like create_customer, create_task) */}
                    {msg.action_data && (
                      <div className="mt-3.5 p-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-xs">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-700 mb-2">
                          <AlertCircle className="w-4 h-4 text-brand-600" />
                          <span>Confirmação Necessária — {msg.action_data.description}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1 mb-3">
                          {Object.entries(msg.action_data.summary).map(([key, val]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-slate-500 font-medium">{key}:</span>
                              <span className="text-slate-800 font-bold">{String(val)}</span>
                            </div>
                          ))}
                        </div>

                        {msg.action_status === 'pending_confirmation' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleConfirmAction(msg.id, msg.action_data!)}
                              disabled={executingActionId === msg.id}
                              className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                            >
                              {executingActionId === msg.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Confirmar</span>
                            </button>

                            <button
                              onClick={() => handleCancelAction(msg.id)}
                              disabled={executingActionId === msg.id}
                              className="py-2 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        ) : msg.action_status === 'executed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            <Check className="w-3 h-3" /> Ação executada com sucesso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                            Ação cancelada
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 px-1">
                    {formatDateTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex gap-3 mr-auto">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-500 text-xs flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>{aiName} está consultando o banco de dados da empresa...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-50/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-500" />
            Sugestões:
          </span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 text-[11px] text-slate-600 hover:text-brand-700 transition-all font-medium shadow-2xs"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pergunte qualquer coisa sobre sua empresa..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="p-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 transition-all active:scale-95 shadow-sm shadow-brand-500/20"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
