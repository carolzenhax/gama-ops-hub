import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Activity, Users, Radio, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const cards = [
  { title: "Status", value: "OPERACIONAL", icon: Activity, color: "text-green-500" },
  { title: "Efetivo Ativo", value: "28 / 32", icon: Users, color: "text-foreground" },
  { title: "Operações (Mês)", value: "12", icon: Radio, color: "text-tactical-blue" },
  { title: "Alertas", value: "2", icon: AlertTriangle, color: "text-accent" },
];

interface Notice { id: string; date: string; text: string; }

const DEFAULT_NOTICES: Notice[] = [
  { id: "1", date: "12/04/2026", text: "Treinamento tático agendado para sábado 0600h." },
  { id: "2", date: "10/04/2026", text: "Novas diretrizes de abordagem publicadas no manual." },
  { id: "3", date: "08/04/2026", text: "Operação Tempestade Árida concluída com êxito." },
];

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "admin";
  const [notices, setNotices] = useLocalStorage<Notice[]>("gama-notices", DEFAULT_NOTICES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState({ date: "", text: "" });

  const openAdd = () => {
    setEditing(null);
    setForm({ date: "", text: "" });
    setDialogOpen(true);
  };

  const openEdit = (n: Notice) => {
    setEditing(n);
    setForm({ date: n.date, text: n.text });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.date.trim() || !form.text.trim()) return;
    if (editing) {
      setNotices((prev) => prev.map((n) => (n.id === editing.id ? { ...n, ...form } : n)));
    } else {
      setNotices((prev) => [{ id: Date.now().toString(), ...form }, ...prev]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => setNotices((prev) => prev.filter((n) => n.id !== id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wider">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral operacional da GAMA</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            className="rounded-xl border border-border bg-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.title}</p>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="mt-2 font-display text-xl font-bold tracking-wider">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="rounded-xl border border-border bg-card p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider">Avisos Internos</h2>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={openAdd} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Novo Aviso
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n.id} className="flex items-start gap-4 rounded-lg border border-border bg-muted/30 p-3">
              <span className="shrink-0 font-display text-xs text-accent">{n.date}</span>
              <p className="flex-1 text-sm text-foreground">{n.text}</p>
              {isAdmin && (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => openEdit(n)} className="text-muted-foreground transition-colors hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(n.id)} className="text-muted-foreground transition-colors hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">{editing ? "Editar Aviso" : "Novo Aviso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data</Label>
              <Input value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} placeholder="DD/MM/AAAA" className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Texto</Label>
              <Input value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} placeholder="Texto do aviso..." className="bg-muted/50" />
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

export default Dashboard;
