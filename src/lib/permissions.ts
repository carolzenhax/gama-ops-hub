import type { Role } from "@/contexts/AuthContext";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  comando: [
    "/dashboard",
    "/dashboard/sobre",
    "/dashboard/manual",
    "/dashboard/membros",
    "/dashboard/inscricoes",
    "/dashboard/galeria",
    "/dashboard/curso",
    "/dashboard/operacoes",
    "/dashboard/usuarios",
  ],
  membro: [
    "/dashboard",
    "/dashboard/sobre",
    "/dashboard/manual",
    "/dashboard/membros",
    "/dashboard/inscricoes",
    "/dashboard/galeria",
    "/dashboard/curso",
    "/dashboard/operacoes",
  ],
  visitante: [
    "/dashboard",
    "/dashboard/sobre",
    "/dashboard/manual",
    "/dashboard/galeria",
    "/dashboard/curso",
    "/dashboard/inscricoes",
    "/dashboard/membros",
  ],
};

export function canAccess(role: Role, path: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(path) ?? false;
}
