import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Radio, MapPin, Shield, Crosshair, CheckCircle, FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

type IconKey = "Eye" | "Radio" | "MapPin" | "Shield" | "Crosshair" | "CheckCircle" | "FileText";

const ICON_MAP: Record<IconKey, React.ElementType> = {
  Eye, Radio, MapPin, Shield, Crosshair, CheckCircle, FileText,
};

interface Step { id: string; iconKey: IconKey; title: string; desc: string; }

const EMPTY_FORM = { title: "", desc: "" };

async function fetchSteps(): Promise<Step[]> {
  const { data, error } = await supabase
    .from("tatica_steps")
    .select("id, icon_key, titulo, descricao")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((s) => ({ id: s.id, iconKey: s.icon_key as IconKey, title: s.titulo, desc: s.descricao }));
}

const Tatica = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "comando";
  const queryClient = useQueryClient();
  const { data: steps = [], isLoading } = useQuery({ queryKey: ["tatica_steps"], queryFn: fetchSteps });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tatica_steps"] });

  const saveStep = useMutation({
    mutationFn: async ({ id, title, desc }: { id?: string; title: string; desc: string }) => {
      if (id) {
        const { error } = await supabase.from("tatica_steps").update({ titulo: title, descricao: desc }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tatica_steps").insert({ titulo: title, descricao: desc, icon_key: "FileText" });
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tatica_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Step | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (s: Step) => {
    setEditing(s);
    setForm({ title: s.title, desc: s.desc });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.desc.trim()) return;
    saveStep.mutate({ id: editing?.id, title: form.title, desc: form.desc });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => deleteStep.mutate(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider">Abordagem Tática</h1>
          <p className="text-sm text-muted-foreground">Protocolo operacional padrão da GAMA</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={openAdd} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Nova Fase
          </Button>
        )}
      </div>

      <div className="relative ml-4 space-y-0 border-l-2 border-border pl-8">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="mb-4 h-20 animate-pulse rounded-xl bg-muted/30" />)
        ) : (
          steps.map((step, i) => {
            const Icon = ICON_MAP[step.iconKey] ?? FileText;
            return (
              <motion.div
                key={step.id}
                className="group relative pb-10 last:pb-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
              >
                <div className="absolute -left-[2.65rem] flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-card">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs text-accent">FASE {i + 1}</span>
                      <h3 className="font-display text-sm font-bold tracking-wider">{step.title}</h3>
                    </div>
                    {isAdmin && (
                      <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => openEdit(step)} className="text-muted-foreground transition-colors hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(step.id)} className="text-muted-foreground transition-colors hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">{editing ? "Editar Fase" : "Nova Fase"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
              <Textarea value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} className="bg-muted/50" rows={3} />
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

export default Tatica;
