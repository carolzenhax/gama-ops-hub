import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Filter, Plus, Pencil, Trash2, Eye, IdCard, Award, Briefcase, CalendarDays, Check, X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface Membro {
  id: string; name: string; cargo: string; classe: string; fotoUrl: string;
  passaporte: string; patente: string; dataIngresso: string;
}

interface ChecklistItem { id: string; item: string; concluido: boolean; }

const CLASSE_ORDER = ["Comando", "Sub-comando", "Operador", "Estágio", "Chaveirinho"];
const classes = ["Todos", ...CLASSE_ORDER];
const classeOptions = CLASSE_ORDER;

const EMPTY_FORM = { name: "", cargo: "", classe: "Operador", fotoUrl: "", passaporte: "", patente: "", dataIngresso: "" };

// Extrai o número da "classe" dentro do cargo (ex: "Operador de 2ª Classe" → 2)
// pra ordenar 1ª, depois 2ª, depois 3ª. Cargos sem número (Comandante, Aspirante...) ficam por último.
function cargoRank(cargo: string): number {
  const match = cargo.match(/\d+/);
  return match ? parseInt(match[0], 10) : Infinity;
}

async function fetchMembers(): Promise<Membro[]> {
  const { data, error } = await supabase.from("membros").select("id, nome, cargo, classe, foto_url, passaporte, patente, data_ingresso");
  if (error) throw error;
  return data.map((m) => ({
    id: m.id, name: m.nome, cargo: m.cargo, classe: m.classe, fotoUrl: m.foto_url ?? "",
    passaporte: m.passaporte ?? "", patente: m.patente ?? "", dataIngresso: m.data_ingresso ?? "",
  }));
}

async function fetchChecklist(membroId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from("membros_checklist")
    .select("id, item, concluido")
    .eq("membro_id", membroId)
    .order("created_at");
  if (error) throw error;
  return data;
}

const Membros = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "comando";
  const canViewDetails = user?.papel === "comando" || user?.papel === "membro";
  const queryClient = useQueryClient();
  const { data: members = [], isLoading } = useQuery({ queryKey: ["membros"], queryFn: fetchMembers });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["membros"] });

  const saveMember = useMutation({
    mutationFn: async ({ id, ...form }: { id?: string } & typeof EMPTY_FORM) => {
      const payload = {
        nome: form.name, cargo: form.cargo, classe: form.classe, foto_url: form.fotoUrl || null,
        passaporte: form.passaporte || null, patente: form.patente || null, data_ingresso: form.dataIngresso || null,
      };
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
  const [detailsTarget, setDetailsTarget] = useState<Membro | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const sortMembers = (a: Membro, b: Membro) => cargoRank(a.cargo) - cargoRank(b.cargo) || a.name.localeCompare(b.name);
  const filtered = (filter === "Todos" ? members : members.filter((m) => m.classe === filter)).slice().sort(sortMembers);
  const grouped = CLASSE_ORDER
    .map((classe) => ({ classe, items: members.filter((m) => m.classe === classe).slice().sort(sortMembers) }))
    .filter((g) => g.items.length > 0);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (m: Membro) => {
    setEditing(m);
    setForm({
      name: m.name, cargo: m.cargo, classe: m.classe, fotoUrl: m.fotoUrl,
      passaporte: m.passaporte, patente: m.patente, dataIngresso: m.dataIngresso,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.cargo.trim()) return;
    saveMember.mutate({ id: editing?.id, ...form });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => deleteMember.mutate(id);

  const { data: checklist = [] } = useQuery({
    queryKey: ["membros_checklist", detailsTarget?.id],
    queryFn: () => fetchChecklist(detailsTarget!.id),
    enabled: !!detailsTarget,
  });

  const invalidateChecklist = () => queryClient.invalidateQueries({ queryKey: ["membros_checklist", detailsTarget?.id] });

  const addChecklistItem = useMutation({
    mutationFn: async (item: string) => {
      const { error } = await supabase.from("membros_checklist").insert({ membro_id: detailsTarget!.id, item, concluido: false });
      if (error) throw error;
    },
    onSuccess: invalidateChecklist,
  });

  const toggleChecklistItem = useMutation({
    mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
      const { error } = await supabase.from("membros_checklist").update({ concluido }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateChecklist,
  });

  const deleteChecklistItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("membros_checklist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateChecklist,
  });

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    addChecklistItem.mutate(newChecklistItem.trim());
    setNewChecklistItem("");
  };

  const renderCard = (m: Membro, i: number) => (
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
        <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          {canViewDetails && (
            <button onClick={() => setDetailsTarget(m)} className="text-muted-foreground transition-colors hover:text-foreground">
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          {isAdmin && (
            <>
              <button onClick={() => openEdit(m)} className="text-muted-foreground transition-colors hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleDelete(m.id)} className="text-muted-foreground transition-colors hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

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

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted/30" />)}
        </div>
      ) : filter === "Todos" ? (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.classe} className="space-y-3">
              <h2 className="font-display text-xs font-bold uppercase tracking-widest text-accent">
                {g.classe} <span className="text-muted-foreground">({g.items.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((m, i) => renderCard(m, i))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => renderCard(m, i))}
        </div>
      )}

      {/* Novo / Editar Membro */}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Passaporte (opcional)</Label>
                <Input value={form.passaporte} onChange={(e) => setForm((f) => ({ ...f, passaporte: e.target.value }))} placeholder="Ex: 1115" className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Patente (opcional)</Label>
                <Input value={form.patente} onChange={(e) => setForm((f) => ({ ...f, patente: e.target.value }))} placeholder="Ex: 2° Sargento" className="bg-muted/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data de Ingresso (opcional)</Label>
              <Input type="date" value={form.dataIngresso} onChange={(e) => setForm((f) => ({ ...f, dataIngresso: e.target.value }))} className="bg-muted/50" />
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

      {/* Ver Detalhes */}
      <Dialog open={!!detailsTarget} onOpenChange={(open) => !open && setDetailsTarget(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/20">
                {detailsTarget?.fotoUrl ? (
                  <img src={detailsTarget.fotoUrl} alt={detailsTarget.name} className="h-full w-full object-cover" />
                ) : (
                  <Users className="h-7 w-7 text-primary-foreground" />
                )}
              </div>
              <DialogTitle className="font-display tracking-wider">{detailsTarget?.name}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Informações</h3>
              <div className="flex items-center gap-2 text-sm">
                <IdCard className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">Passaporte —</span> {detailsTarget?.passaporte || "—"}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">Patente —</span> {detailsTarget?.patente || "—"}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">Cargo —</span> {detailsTarget?.cargo || "—"}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">Ingresso —</span>{" "}
                {detailsTarget?.dataIngresso ? new Date(detailsTarget.dataIngresso + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-accent">Checklist p/ Promoção</h3>
              <div className="space-y-2">
                {checklist.length === 0 && <p className="text-xs text-muted-foreground">Nenhum item ainda.</p>}
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <button
                      disabled={!isAdmin}
                      onClick={() => toggleChecklistItem.mutate({ id: item.id, concluido: !item.concluido })}
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        item.concluido ? "border-primary bg-primary/20 text-primary-foreground" : "border-border",
                        isAdmin && "cursor-pointer"
                      )}
                    >
                      {item.concluido && <Check className="h-3 w-3" />}
                    </button>
                    <span className={cn("flex-1 text-sm", item.concluido && "text-muted-foreground line-through")}>
                      {item.item}
                    </span>
                    {isAdmin && (
                      <button onClick={() => deleteChecklistItem.mutate(item.id)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div className="flex gap-2 pt-2">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                    placeholder="Novo item..."
                    className="h-8 bg-muted/50 text-sm"
                  />
                  <Button size="sm" onClick={handleAddChecklistItem} className="h-8 shrink-0 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsTarget(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Membros;
