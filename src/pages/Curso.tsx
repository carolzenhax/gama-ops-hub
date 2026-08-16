import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface Curso { id: string; nome: string; aplicador: string; descricao: string; videoUrl: string; fotoUrl: string | null; tipo: string | null; }

const TIPO_ORDER = ["Grande", "Média", "Pequena"];
const SEM_TIPO = "sem-tipo";

const EMPTY_FORM = { nome: "", aplicador: "", descricao: "", videoUrl: "", fotoUrl: "", tipo: "" };

async function fetchCursos(): Promise<Curso[]> {
  const { data, error } = await supabase.from("cursos").select("id, nome, aplicador, descricao, video_url, foto_url, tipo");
  if (error) throw error;
  return data.map((c) => ({ id: c.id, nome: c.nome, aplicador: c.aplicador, descricao: c.descricao, videoUrl: c.video_url, fotoUrl: c.foto_url, tipo: c.tipo }));
}

const Curso = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "comando";
  const queryClient = useQueryClient();
  const { data: cursos = [], isLoading } = useQuery({ queryKey: ["cursos"], queryFn: fetchCursos });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cursos"] });

  const saveCurso = useMutation({
    mutationFn: async ({ id, ...form }: { id?: string } & typeof EMPTY_FORM) => {
      const payload = { nome: form.nome, aplicador: form.aplicador, descricao: form.descricao, video_url: form.videoUrl, foto_url: form.fotoUrl || null, tipo: form.tipo || null };
      if (id) {
        const { error } = await supabase.from("cursos").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cursos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const deleteCurso = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Curso | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (c: Curso) => {
    setEditing(c);
    setForm({ nome: c.nome, aplicador: c.aplicador, descricao: c.descricao, videoUrl: c.videoUrl, fotoUrl: c.fotoUrl ?? "", tipo: c.tipo ?? "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.aplicador.trim()) return;
    saveCurso.mutate({ id: editing?.id, ...form });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => deleteCurso.mutate(id);

  const grouped = [
    ...TIPO_ORDER.map((tipo) => ({ tipo, items: cursos.filter((c) => c.tipo === tipo) })),
    { tipo: SEM_TIPO, items: cursos.filter((c) => !c.tipo) },
  ].filter((g) => g.items.length > 0);

  const renderCard = (curso: Curso, i: number) => (
    <motion.div
      key={curso.id}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
    >
      <div className="relative aspect-video overflow-hidden bg-muted/30">
        {curso.fotoUrl ? (
          <img src={curso.fotoUrl} alt={curso.nome} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {isAdmin && (
          <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => openEdit(curso)}
              className="rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(curso.id)}
              className="rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-sm font-bold tracking-wide text-foreground">{curso.nome}</h3>
        <p className="mt-0.5 text-xs text-accent">Autor: {curso.aplicador}</p>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{curso.descricao}</p>

        {curso.videoUrl && (
          <a
            href={curso.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Acessar documento
          </a>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider">Cursos</h1>
          <p className="text-sm text-muted-foreground">Capacitação e treinamentos da unidade</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={openAdd} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Novo Curso
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-muted/30" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.tipo} className="space-y-3">
              <h2 className="font-display text-xs font-bold uppercase tracking-widest text-accent">
                {g.tipo === SEM_TIPO ? "Sem Categoria" : g.tipo} <span className="text-muted-foreground">({g.items.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((curso, i) => renderCard(curso, i))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">{editing ? "Editar Curso" : "Novo Curso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome do Curso</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex: Abordagem Tática Avançada" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Autor</Label>
              <Input value={form.aplicador} onChange={(e) => setForm((f) => ({ ...f, aplicador: e.target.value }))} placeholder="Ex: Sgt. João Silva" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descreva o conteúdo do curso..." className="bg-muted/50" rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Link do Documento (opcional)</Label>
              <Input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://docs.google.com/..." className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL da Foto (opcional)</Label>
              <Input value={form.fotoUrl} onChange={(e) => setForm((f) => ({ ...f, fotoUrl: e.target.value }))} placeholder="https://..." className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo da Ação (opcional)</Label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
              >
                <option value="">Sem categoria</option>
                {TIPO_ORDER.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
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

export default Curso;
