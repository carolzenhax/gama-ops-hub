import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, X, Plus, Trash2, Award } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface Secao { id: string; titulo: string; conteudo: string; fotoUrl: string | null; }
interface Honraria { id: string; nome: string; fotoUrl: string | null; texto: string; }

const SECAO_ORDER = ["historia", "como_comecou"];
const EMPTY_HONRARIA_FORM = { nome: "", fotoUrl: "", texto: "" };

async function fetchSecoes(): Promise<Secao[]> {
  const { data, error } = await supabase.from("sobre_secoes").select("id, titulo, conteudo, foto_url");
  if (error) throw error;
  return data
    .map((s) => ({ id: s.id, titulo: s.titulo, conteudo: s.conteudo, fotoUrl: s.foto_url }))
    .sort((a, b) => SECAO_ORDER.indexOf(a.id) - SECAO_ORDER.indexOf(b.id));
}

async function fetchHonrarias(): Promise<Honraria[]> {
  const { data, error } = await supabase.from("honrarias").select("id, nome, foto_url, texto").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((h) => ({ id: h.id, nome: h.nome, fotoUrl: h.foto_url, texto: h.texto }));
}

const Sobre = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "comando";
  const queryClient = useQueryClient();

  const { data: secoes = [], isLoading: loadingSecoes } = useQuery({ queryKey: ["sobre_secoes"], queryFn: fetchSecoes });
  const { data: honrarias = [], isLoading: loadingHonrarias } = useQuery({ queryKey: ["honrarias"], queryFn: fetchHonrarias });

  const updateSecao = useMutation({
    mutationFn: async ({ id, conteudo, fotoUrl }: { id: string; conteudo: string; fotoUrl: string }) => {
      const { error } = await supabase.from("sobre_secoes").update({ conteudo, foto_url: fotoUrl || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sobre_secoes"] }),
  });

  const invalidateHonrarias = () => queryClient.invalidateQueries({ queryKey: ["honrarias"] });

  const saveHonraria = useMutation({
    mutationFn: async ({ id, ...form }: { id?: string } & typeof EMPTY_HONRARIA_FORM) => {
      const payload = { nome: form.nome, foto_url: form.fotoUrl || null, texto: form.texto };
      if (id) {
        const { error } = await supabase.from("honrarias").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("honrarias").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: invalidateHonrarias,
  });

  const deleteHonraria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("honrarias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateHonrarias,
  });

  const [active, setActive] = useState("historia");
  const [editingContent, setEditingContent] = useState(false);
  const [draft, setDraft] = useState({ conteudo: "", fotoUrl: "" });

  const [honrariaDialogOpen, setHonrariaDialogOpen] = useState(false);
  const [editingHonraria, setEditingHonraria] = useState<Honraria | null>(null);
  const [honrariaForm, setHonrariaForm] = useState(EMPTY_HONRARIA_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Honraria | null>(null);

  const currentSecao = secoes.find((s) => s.id === active);

  const startEdit = () => {
    if (!currentSecao) return;
    setDraft({ conteudo: currentSecao.conteudo, fotoUrl: currentSecao.fotoUrl ?? "" });
    setEditingContent(true);
  };

  const saveEdit = () => {
    updateSecao.mutate({ id: active, conteudo: draft.conteudo, fotoUrl: draft.fotoUrl });
    setEditingContent(false);
  };

  const cancelEdit = () => setEditingContent(false);

  const openAddHonraria = () => {
    setEditingHonraria(null);
    setHonrariaForm(EMPTY_HONRARIA_FORM);
    setHonrariaDialogOpen(true);
  };

  const openEditHonraria = (h: Honraria) => {
    setEditingHonraria(h);
    setHonrariaForm({ nome: h.nome, fotoUrl: h.fotoUrl ?? "", texto: h.texto });
    setHonrariaDialogOpen(true);
  };

  const handleSaveHonraria = () => {
    if (!honrariaForm.nome.trim()) return;
    saveHonraria.mutate({ id: editingHonraria?.id, ...honrariaForm });
    setHonrariaDialogOpen(false);
  };

  const tabs = [
    ...secoes.map((s) => ({ id: s.id, label: s.titulo })),
    { id: "honraria", label: "Honraria" },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <nav className="shrink-0 space-y-1 lg:w-56">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActive(t.id); setEditingContent(false); }}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
              active === t.id
                ? "bg-primary/20 font-medium text-foreground border-l-2 border-accent"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {active === "honraria" ? (
        <motion.div
          key="honraria"
          className="flex-1 space-y-4"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold tracking-wider">Honraria</h2>
              <p className="text-sm text-muted-foreground">Homenagens e conquistas da unidade</p>
            </div>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={openAddHonraria} className="shrink-0 gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            )}
          </div>

          {loadingHonrarias ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />)}
            </div>
          ) : honrarias.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Award className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma honraria registrada ainda.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {honrarias.map((h, i) => (
                <motion.div
                  key={h.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="relative aspect-video overflow-hidden bg-muted/30">
                    {h.fotoUrl ? (
                      <img src={h.fotoUrl} alt={h.nome} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Award className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    {isAdmin && (
                      <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => openEditHonraria(h)}
                          className="rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(h)}
                          className="rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <h3 className="font-display text-sm font-bold tracking-wide text-foreground">{h.nome}</h3>
                    {h.texto && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.texto}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ) : loadingSecoes || !currentSecao ? (
        <div className="h-64 flex-1 animate-pulse rounded-xl border border-border bg-muted/30" />
      ) : (
        <motion.div
          key={active}
          className="flex-1 rounded-xl border border-border bg-card p-6"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="font-display text-lg font-bold tracking-wider">{currentSecao.titulo}</h2>
            {isAdmin && !editingContent && (
              <Button size="sm" variant="outline" onClick={startEdit} className="shrink-0 gap-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
            )}
            {isAdmin && editingContent && (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1 text-xs">
                  <X className="h-3.5 w-3.5" /> Cancelar
                </Button>
                <Button size="sm" onClick={saveEdit} className="gap-1 text-xs">
                  <Check className="h-3.5 w-3.5" /> Salvar
                </Button>
              </div>
            )}
          </div>

          {editingContent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL da Foto (opcional)</Label>
                <Input
                  value={draft.fotoUrl}
                  onChange={(e) => setDraft((f) => ({ ...f, fotoUrl: e.target.value }))}
                  placeholder="https://..."
                  className="bg-muted/50"
                />
              </div>
              <Textarea
                value={draft.conteudo}
                onChange={(e) => setDraft((f) => ({ ...f, conteudo: e.target.value }))}
                className="min-h-[300px] bg-muted/50 text-sm leading-relaxed"
              />
            </div>
          ) : (
            <>
              {currentSecao.fotoUrl && (
                <img
                  src={currentSecao.fotoUrl}
                  alt={currentSecao.titulo}
                  className="mb-4 max-h-80 w-full rounded-lg object-cover"
                />
              )}
              <div className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {currentSecao.conteudo || "Nenhum conteúdo ainda."}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Add/edit honraria dialog */}
      <Dialog open={honrariaDialogOpen} onOpenChange={setHonrariaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">{editingHonraria ? "Editar Honraria" : "Nova Honraria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
              <Input
                value={honrariaForm.nome}
                onChange={(e) => setHonrariaForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Sgt. João Silva"
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL da Foto (opcional)</Label>
              <Input
                value={honrariaForm.fotoUrl}
                onChange={(e) => setHonrariaForm((f) => ({ ...f, fotoUrl: e.target.value }))}
                placeholder="https://..."
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Texto</Label>
              <Textarea
                value={honrariaForm.texto}
                onChange={(e) => setHonrariaForm((f) => ({ ...f, texto: e.target.value }))}
                placeholder="Descreva o motivo da honraria..."
                className="bg-muted/50"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHonrariaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveHonraria} disabled={saveHonraria.isPending}>
              {saveHonraria.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete honraria confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Excluir Honraria</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a honraria de <span className="font-medium text-foreground">{deleteTarget?.nome}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteHonraria.isPending}
              onClick={() => deleteHonraria.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
            >
              {deleteHonraria.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sobre;
