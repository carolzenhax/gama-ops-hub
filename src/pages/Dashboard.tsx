import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Activity, Users, Radio, Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const cards = [
  { title: "Status", value: "OPERACIONAL", icon: Activity, color: "text-green-500" },
  { title: "Efetivo Ativo", value: "28 / 32", icon: Users, color: "text-foreground" },
  { title: "Operações (Mês)", value: "12", icon: Radio, color: "text-tactical-blue" },
  { title: "Alertas", value: "2", icon: AlertTriangle, color: "text-accent" },
];

interface Notice { id: string; date: string; text: string; }

async function fetchNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("avisos")
    .select("id, data, texto")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((n) => ({ id: n.id, date: n.data, text: n.texto }));
}

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "comando";
  const queryClient = useQueryClient();
  const { data: notices = [], isLoading } = useQuery({ queryKey: ["avisos"], queryFn: fetchNotices });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["avisos"] });

  const saveNotice = useMutation({
    mutationFn: async ({ id, date, text }: { id?: string; date: string; text: string }) => {
      if (id) {
        const { error } = await supabase.from("avisos").update({ data: date, texto: text }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("avisos").insert({ data: date, texto: text });
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  const deleteNotice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("avisos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

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
    saveNotice.mutate({ id: editing?.id, date: form.date, text: form.text });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => deleteNotice.mutate(id);

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
          {isLoading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/30" />)
          ) : (
            notices.map((n) => (
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
            ))
          )}
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
