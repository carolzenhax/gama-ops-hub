import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Filter, Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface Membro { id: string; name: string; cargo: string; classe: string; fotoUrl: string; }

const classes = ["Todos", "Comando", "Sub-comando", "Operador", "Estágio"];
const classeOptions = ["Comando", "Sub-comando", "Operador", "Estágio"];

const EMPTY_FORM = { name: "", cargo: "", classe: "Operador", fotoUrl: "" };

async function fetchMembers(): Promise<Membro[]> {
  const { data, error } = await supabase.from("membros").select("id, nome, cargo, classe, foto_url");
  if (error) throw error;
  return data.map((m) => ({ id: m.id, name: m.nome, cargo: m.cargo, classe: m.classe, fotoUrl: m.foto_url ?? "" }));
}

const Membros = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "comando";
  const queryClient = useQueryClient();
  const { data: members = [], isLoading } = useQuery({ queryKey: ["membros"], queryFn: fetchMembers });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["membros"] });

  const saveMember = useMutation({
    mutationFn: async ({ id, ...form }: { id?: string } & typeof EMPTY_FORM) => {
      const payload = { nome: form.name, cargo: form.cargo, classe: form.classe, foto_url: form.fotoUrl || null };
      if (id) {
        const { error } = await supabase.from("membros").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("membros").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("membros").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const [filter, setFilter] = useState("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Membro | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = filter === "Todos" ? members : members.filter((m) => m.classe === filter);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (m: Membro) => {
    setEditing(m);
    setForm({ name: m.name, cargo: m.cargo, classe: m.classe, fotoUrl: m.fotoUrl });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.cargo.trim()) return;
    saveMember.mutate({ id: editing?.id, ...form });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => deleteMember.mutate(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider">Membros</h1>
          <p className="text-sm text-muted-foreground">Efetivo da unidade GAMA</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {classes.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={openAdd} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Novo Membro
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted/30" />)
          : filtered.map((m, i) => (
          <motion.div
            key={m.id}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/20">
                {m.fotoUrl ? (
                  <img src={m.fotoUrl} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <Users className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.cargo}</p>
                <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {m.classe}
                </span>
              </div>
              {isAdmin && (
                <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(m)} className="text-muted-foreground transition-colors hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-muted-foreground transition-colors hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">{editing ? "Editar Membro" : "Novo Membro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Sgt. João Silva" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cargo</Label>
              <Input value={form.cargo} onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))} placeholder="Ex: Operador Sênior" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Classe</Label>
              <select
                value={form.classe}
                onChange={(e) => setForm((f) => ({ ...f, classe: e.target.value }))}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
              >
                {classeOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL da Foto (opcional)</Label>
              <Input value={form.fotoUrl} onChange={(e) => setForm((f) => ({ ...f, fotoUrl: e.target.value }))} placeholder="https://..." className="bg-muted/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Membros;
