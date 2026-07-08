import type { Role } from "@/contexts/AuthContext";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  comando: [
    "/dashboard",
    "/dashboard/manual",
    "/dashboard/membros",
    "/dashboard/inscricoes",
    "/dashboard/galeria",
    "/dashboard/viatura",
    "/dashboard/tatica",
    "/dashboard/curso",
    "/dashboard/operacoes",
    "/dashboard/usuarios",
  ],
  membro: [
    "/dashboard",
    "/dashboard/manual",
    "/dashboard/membros",
    "/dashboard/inscricoes",
    "/dashboard/galeria",
    "/dashboard/viatura",
    "/dashboard/tatica",
    "/dashboard/curso",
    "/dashboard/operacoes",
  ],
  visitante: [
    "/dashboard",
    "/dashboard/manual",
    "/dashboard/galeria",
    "/dashboard/curso",
  ],
};

export function canAccess(role: Role, path: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(path) ?? false;
}
