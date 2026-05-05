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
  login: (id: string, senha: string) => Promise<{ success: boolean; error?: string }>;
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

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUserFromStorage());

  const login = async (id: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    const url = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!url) {
      return { success: false, error: "URL do servidor não configurada." };
    }

    try {
      const res = await fetch(
        `${url}?id=${encodeURIComponent(id)}&senha=${encodeURIComponent(senha)}`
      );
      const data = await res.json();

      if (data.success && VALID_ROLES.includes(data.papel)) {
        const authUser: AuthUser = { id, nome: data.nome, papel: data.papel };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
        setUser(authUser);
        return { success: true };
      }

      return { success: false, error: data.error ?? "Credenciais inválidas." };
    } catch {
      return { success: false, error: "Erro de conexão. Tente novamente." };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
