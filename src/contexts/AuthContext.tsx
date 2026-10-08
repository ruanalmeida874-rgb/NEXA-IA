import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { storage } from '@/services/storage';
import { Company, Profile } from '@/types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
  updateCompany: (companyData: Partial<Company>) => Promise<Company>;
  bypassToLocalMode: (fallbackEmail?: string, fallbackName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCurrentSession = async () => {
    try {
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { profile: prof, company: comp } = await storage.getCurrentProfile();
          setProfile(prof);
          setCompany(comp);
        } else {
          setUser(null);
          setProfile(null);
          setCompany(null);
        }
      } else {
        // Local mode session persistence
        const localUserStr = localStorage.getItem('nexa_local_user');
        if (localUserStr) {
          const localUser = JSON.parse(localUserStr);
          setUser(localUser);
          const { profile: prof, company: comp } = await storage.getCurrentProfile();
          setProfile(prof);
          setCompany(comp);
        } else {
          setUser(null);
          setProfile(null);
          setCompany(null);
        }
      }
    } catch (err) {
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentSession();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { profile: prof, company: comp } = await storage.getCurrentProfile();
          setProfile(prof);
          setCompany(comp);
        } else {
          setUser(null);
          setProfile(null);
          setCompany(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            return {
              success: false,
              error: 'E-mail não confirmado. O Supabase exige confirmação por link enviado para o seu e-mail. Para pular isso, desative "Confirm email" em Authentication ➔ Providers no painel do Supabase.',
            };
          }
          if (error.message.includes('Invalid login credentials')) {
            return {
              success: false,
              error: 'E-mail ou senha incorretos.',
            };
          }
          return { success: false, error: error.message };
        }
        setUser(data.user);
        await loadCurrentSession();
        return { success: true };
      } else {
        // Local mock auth for dev/testing without active Supabase credentials
        const dummyUser = {
          id: 'user-' + btoa(email).slice(0, 8),
          email: email.trim(),
          user_metadata: { full_name: email.split('@')[0] },
        };
        localStorage.setItem('nexa_local_user', JSON.stringify(dummyUser));
        setUser(dummyUser);
        await loadCurrentSession();
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Falha ao autenticar.' };
    }
  };

  const signUp = async (email: string, pass: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          // If already registered, try immediate login
          if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already in use')) {
            const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: pass,
            });
            if (!signInErr && signInData?.session) {
              setUser(signInData.user);
              await loadCurrentSession();
              return { success: true };
            }
            return {
              success: false,
              error: 'Este e-mail já está cadastrado no Supabase. Faça login com sua senha existente.',
            };
          }
          return { success: false, error: error.message };
        }

        // If session returned, user is immediately authenticated
        if (data.session) {
          setUser(data.user);
          await loadCurrentSession();
          return { success: true };
        }

        // If session is null, Supabase sent a confirmation email
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (signInData?.session) {
          setUser(signInData.user);
          await loadCurrentSession();
          return { success: true };
        }

        return {
          success: false,
          error: 'Conta criada! O Supabase enviou um e-mail de confirmação para ' + email + '. Por favor, confirme o e-mail para ativar sua conta, ou desative a opção "Confirm email" em Authentication ➔ Providers no painel do Supabase.',
        };
      } else {
        const dummyUser = {
          id: 'user-' + btoa(email).slice(0, 8),
          email: email.trim(),
          user_metadata: { full_name: fullName.trim() },
        };
        localStorage.setItem('nexa_local_user', JSON.stringify(dummyUser));
        setUser(dummyUser);
        await loadCurrentSession();
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Falha ao registrar conta.' };
    }
  };

  const bypassToLocalMode = (fallbackEmail?: string, fallbackName?: string) => {
    const dummyUser = {
      id: 'local-' + (fallbackEmail ? btoa(fallbackEmail).slice(0, 8) : 'demo'),
      email: fallbackEmail || 'demo@nexa.com',
      user_metadata: { full_name: fallbackName || 'Gestor' },
    };
    localStorage.setItem('nexa_local_user', JSON.stringify(dummyUser));
    setUser(dummyUser);
    setProfile({
      id: dummyUser.id,
      full_name: fallbackName || 'Gestor',
      role: 'owner',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('nexa_local_user');
    }
    setUser(null);
    setProfile(null);
    setCompany(null);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + '/recuperar-senha',
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } else {
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Não foi possível solicitar a recuperação.' };
    }
  };

  const updateCompany = async (companyData: Partial<Company>): Promise<Company> => {
    const updated = await storage.saveCompany(companyData);
    setCompany(updated);
    return updated;
  };

  const refreshData = async () => {
    const { profile: prof, company: comp } = await storage.getCurrentProfile();
    setProfile(prof);
    setCompany(comp);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        company,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshData,
        updateCompany,
        bypassToLocalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
