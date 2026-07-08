import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { UserCog, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

interface UserRow { id: string; nome: string; papel: string; }

const PAPEL_OPTIONS = ["comando", "membro", "visitante"];

const PAPEL_COLORS: Record<string, string> = {
  comando:   "bg-accent/20 text-accent",
  membro:    "bg-primary/20 text-primary-foreground",
  visitante: "bg-muted text-muted-foreground",
};

const EMPTY_FORM = { id: "", nome: "", papel: "membro", senha: "", confirmSenhaInput: "" };

async function callManageUsers(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("manage-users", { body: payload });
  if (error) return { success: false, error: "Erro de conexão." };
  return data;
}

const Usuarios = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const data = await callManageUsers({ action: "list" });
      if (data.success) setUsers(data.users);
      else setApiError(data.error ?? "Erro ao carregar usuários.");
    } catch {
      setApiError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Diálogo add/edit ─────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditing(u);
    setForm({ id: u.id, nome: u.nome, papel: u.papel, senha: "", confirmSenhaInput: "" });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim() || (!editing && !form.id.trim())) {
      setFormError("Preencha os campos obrigatórios.");
      return;
    }
    if (!editing && !form.senha.trim()) {
      setFormError("Senha obrigatória para novo usuário.");
      return;
    }
    setFormLoading(true);
    setFormError("");

    try {
      let data;
      if (editing) {
        const payload: Record<string, unknown> = {
          action: "update", targetId: editing.id, newNome: form.nome.trim(), newPapel: form.papel,
        };
        if (form.senha.trim()) payload.newSenha = form.senha.trim();
        data = await callManageUsers(payload);
      } else {
        data = await callManageUsers({
          action: "create",
          newId: form.id.trim(), newSenha: form.senha.trim(),
          newNome: form.nome.trim(), newPapel: form.papel,
        });
      }

      if (data.success) {
        setDialogOpen(false);
        loadUsers();
      } else {
        setFormError(data.error ?? "Erro ao salvar.");
      }
    } catch {
      setFormError("Erro de conexão.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Exclusão ─────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const data = await callManageUsers({ action: "delete", targetId: deleteTarget.id });
      if (data.success) {
        setDeleteTarget(null);
        loadUsers();
      } else {
        setApiError(data.error ?? "Erro ao excluir.");
        setDeleteTarget(null);
      }
    } catch {
      setApiError("Erro de conexão.");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerenciamento de acesso ao sistema</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadUsers} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Button size="sm" variant="outline" onClick={openAdd} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Novo Usuário
          </Button>
        </div>
      </div>

      {apiError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/30" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <UserCog className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{u.nome}</p>
                  <p className="text-xs text-muted-foreground">ID: {u.id}</p>
                  <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider", PAPEL_COLORS[u.papel] ?? PAPEL_COLORS.visitante)}>
                    {u.papel}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(u)} className="text-muted-foreground transition-colors hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {u.id !== user?.id && (
                    <button onClick={() => setDeleteTarget(u)} className="text-muted-foreground transition-colors hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">
              {editing ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">ID de Login</Label>
                <Input value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="Ex: op02" className="bg-muted/50" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome completo</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex: Sgt. João Silva" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Permissão</Label>
              <select
                value={form.papel}
                onChange={(e) => setForm((f) => ({ ...f, papel: e.target.value }))}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
              >
                {PAPEL_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {editing ? "Nova Senha (deixe em branco para manter)" : "Senha"}
              </Label>
              <Input
                type="password"
                value={form.senha}
                onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                placeholder={editing ? "••••••••" : "Senha de acesso"}
                className="bg-muted/50"
              />
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={formLoading}>
              {formLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Excluir Usuário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <span className="font-medium text-foreground">{deleteTarget?.nome}</span>?
            Esta ação remove o acesso ao sistema imediatamente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;
