import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Curso { id: string; nome: string; aplicador: string; descricao: string; videoUrl: string; }

const DEFAULT_CURSOS: Curso[] = [
  { id: "1", nome: "Abordagem Tática em Terreno Urbano", aplicador: "Sgt. Lucas Ferreira", descricao: "Técnicas de abordagem controlada em ambientes urbanos, cobertura mútua e comunicação entre operadores.", videoUrl: "" },
  { id: "2", nome: "Primeiros Socorros Táticos (TCCC)", aplicador: "Sd. Maria Oliveira", descricao: "Protocolo de atendimento médico em campo de combate, controle de hemorragia e transporte de vítimas sob pressão.", videoUrl: "" },
];

const EMPTY_FORM = { nome: "", aplicador: "", descricao: "", videoUrl: "" };

const Curso = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "admin";
  const [cursos, setCursos] = useLocalStorage<Curso[]>("gama-cursos", DEFAULT_CURSOS);
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
    setForm({ nome: c.nome, aplicador: c.aplicador, descricao: c.descricao, videoUrl: c.videoUrl });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.aplicador.trim()) return;
    if (editing) {
      setCursos((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
    } else {
      setCursos((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => setCursos((prev) => prev.filter((c) => c.id !== id));

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cursos.map((curso, i) => (
          <motion.div
            key={curso.id}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              {isAdmin && (
                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(curso)} className="text-muted-foreground transition-colors hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(curso.id)} className="text-muted-foreground transition-colors hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <h3 className="font-display text-sm font-bold tracking-wide text-foreground">{curso.nome}</h3>
            <p className="mt-0.5 text-xs text-accent">Aplicador: {curso.aplicador}</p>

            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{curso.descricao}</p>

            {curso.videoUrl && (
              <a
                href={curso.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Assistir vídeo do curso
              </a>
            )}
          </motion.div>
        ))}
      </div>

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
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Aplicador</Label>
              <Input value={form.aplicador} onChange={(e) => setForm((f) => ({ ...f, aplicador: e.target.value }))} placeholder="Ex: Sgt. João Silva" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descreva o conteúdo do curso..." className="bg-muted/50" rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Link do Vídeo (opcional)</Label>
              <Input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/..." className="bg-muted/50" />
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
