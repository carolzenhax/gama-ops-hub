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
  ],
  operador: [
    "/dashboard",
    "/dashboard/manual",
    "/dashboard/membros",
    "/dashboard/inscricoes",
    "/dashboard/galeria",
    "/dashboard/viatura",
    "/dashboard/tatica",
  ],
  visitante: [
    "/dashboard",
    "/dashboard/manual",
    "/dashboard/galeria",
  ],
};

export function canAccess(role: Role, path: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(path) ?? false;
}
