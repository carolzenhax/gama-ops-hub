import type { Role } from "@/contexts/AuthContext";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    "/dashboard",
    "/dashboard/manual",
    "/dashboard/membros",
    "/dashboard/inscricoes",
    "/dashboard/galeria",
    "/dashboard/viatura",
    "/dashboard/tatica",
    "/dashboard/curso",
  ],
  operador: [
    "/dashboard",
    "/dashboard/manual",
    "/dashboard/membros",
    "/dashboard/inscricoes",
    "/dashboard/galeria",
    "/dashboard/viatura",
    "/dashboard/tatica",
    "/dashboard/curso",
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
