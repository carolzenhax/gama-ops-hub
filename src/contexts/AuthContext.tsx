import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Role = "comando" | "membro" | "visitante";

export interface AuthUser {
  id: string; // login_id curto (ex: op02) — não é o uuid do Supabase Auth
  nome: string;
  papel: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (id: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function emailFromLoginId(id: string) {
  return `${id}@gama.local`;
}

async function loadProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("login_id, nome, papel")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return { id: data.login_id, nome: data.nome, papel: data.papel as Role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ? await loadProfile(session.user.id) : null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ? await loadProfile(session.user.id) : null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (id: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: emailFromLoginId(id),
      password: senha,
    });
    if (error) return { success: false, error: "Credenciais inválidas." };
    return { success: true };
  };

  const logout = () => {
    supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
