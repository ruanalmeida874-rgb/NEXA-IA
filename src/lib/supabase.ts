import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://xyzcompany.supabase.co' &&
  !supabaseUrl.includes('example')
);

// Create the real Supabase client if configured, otherwise provide a typed placeholder
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient('https://placeholder-domain-nexa.supabase.co', 'placeholder-anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

export type ConnectionStatus = 'connected' | 'local' | 'error';

export async function testSupabaseConnection(): Promise<{
  status: ConnectionStatus;
  message: string;
  details?: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      status: 'local',
      message: 'Modo local ativo — Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não preenchidas no .env.',
    };
  }

  try {
    const { error } = await supabase.from('companies').select('id').limit(1);
    if (error && error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      return {
        status: 'error',
        message: 'Erro de conexão com os servidores do Supabase. Verifique sua URL e conexão com a internet.',
        details: error.message,
      };
    }
    return {
      status: 'connected',
      message: 'Banco conectado ao PostgreSQL do Supabase.',
    };
  } catch (err: any) {
    return {
      status: 'error',
      message: 'Erro de conexão com o Supabase.',
      details: err?.message || 'Erro inesperado de rede',
    };
  }
}
