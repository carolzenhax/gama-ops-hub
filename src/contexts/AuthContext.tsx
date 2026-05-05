import { createContext, useContext, useState, ReactNode } from "react";

export type Role = "admin" | "operador" | "visitante";

export interface AuthUser {
  id: string;
  nome: string;
  papel: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  adminSenha: string | null;
  login: (id: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  confirmSenha: (senha: string) => Promise<boolean>;
  logout: () => void;
}

const VALID_ROLES: Role[] = ["admin", "operador", "visitante"];
const STORAGE_KEY = "gama-auth";

function loadUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.id === "string" &&
      typeof parsed.nome === "string" &&
      VALID_ROLES.includes(parsed.papel)
    ) {
      return parsed as AuthUser;
    }
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

async function callApi(params: Record<string, string>) {
  const url = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!url) throw new Error("URL do servidor não configurada.");
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${query}`);
  return res.json();
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUserFromStorage());
  // Senha kept in memory only — never persisted to localStorage
  const [adminSenha, setAdminSenha] = useState<string | null>(null);

  const login = async (id: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await callApi({ action: "login", id, senha });

      if (data.success && VALID_ROLES.includes(data.papel)) {
        const authUser: AuthUser = { id, nome: data.nome, papel: data.papel };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
        setUser(authUser);
        setAdminSenha(senha);
        return { success: true };
      }

      return { success: false, error: data.error ?? "Credenciais inválidas." };
    } catch {
      return { success: false, error: "Erro de conexão. Tente novamente." };
    }
  };

  // Used after a page refresh when adminSenha was lost from memory
  const confirmSenha = async (senha: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const data = await callApi({ action: "login", id: user.id, senha });
      if (data.success) {
        setAdminSenha(senha);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAdminSenha(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, adminSenha, login, confirmSenha, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

export { callApi };
