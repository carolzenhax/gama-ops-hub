import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Radio, MapPin, Shield, Crosshair, CheckCircle, FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type IconKey = "Eye" | "Radio" | "MapPin" | "Shield" | "Crosshair" | "CheckCircle" | "FileText";

const ICON_MAP: Record<IconKey, React.ElementType> = {
  Eye, Radio, MapPin, Shield, Crosshair, CheckCircle, FileText,
};

interface Step { id: string; iconKey: IconKey; title: string; desc: string; }

const DEFAULT_STEPS: Step[] = [
  { id: "1", iconKey: "Eye", title: "Reconhecimento", desc: "Análise do terreno, identificação de ameaças e pontos de entrada." },
  { id: "2", iconKey: "MapPin", title: "Posicionamento", desc: "Equipe se posiciona de acordo com o protocolo de formação tática." },
  { id: "3", iconKey: "Radio", title: "Comunicação", desc: "Contato com a central, confirmação de parâmetros operacionais." },
  { id: "4", iconKey: "Shield", title: "Aproximação", desc: "Avanço controlado com cobertura mútua entre os operadores." },
  { id: "5", iconKey: "Crosshair", title: "Contenção", desc: "Neutralização de ameaças e contenção da área operacional." },
  { id: "6", iconKey: "CheckCircle", title: "Verificação", desc: "Checagem de segurança, contagem de pessoal e busca no perímetro." },
  { id: "7", iconKey: "FileText", title: "Relatório", desc: "Documentação completa da operação e debrief com a equipe." },
];

const EMPTY_FORM = { title: "", desc: "" };

const Tatica = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "admin";
  const [steps, setSteps] = useLocalStorage<Step[]>("gama-tatica", DEFAULT_STEPS);
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
    if (editing) {
      setSteps((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...form } : s)));
    } else {
      setSteps((prev) => [...prev, { id: Date.now().toString(), iconKey: "FileText", ...form }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));

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
        {steps.map((step, i) => {
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
        })}
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
