import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import viaturaImg from "@/assets/viatura-ram.jpg";

interface Position { id: string; role: string; desc: string; x: string; y: string; }

async function fetchPositions(): Promise<Position[]> {
  const { data, error } = await supabase
    .from("viatura_posicoes")
    .select("id, role, descricao, x, y")
    .order("id");
  if (error) throw error;
  return data.map((p) => ({ id: p.id, role: p.role, desc: p.descricao, x: p.x, y: p.y }));
}

const Viatura = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "comando";
  const queryClient = useQueryClient();
  const { data: positions = [], isLoading } = useQuery({ queryKey: ["viatura_posicoes"], queryFn: fetchPositions });

  const updatePosition = useMutation({
    mutationFn: async ({ id, role, desc }: { id: string; role: string; desc: string }) => {
      const { error } = await supabase.from("viatura_posicoes").update({ role, descricao: desc }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["viatura_posicoes"] }),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState({ role: "", desc: "" });

  const openEdit = (p: Position) => {
    setEditing(p);
    setForm({ role: p.role, desc: p.desc });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.role.trim() || !form.desc.trim() || !editing) return;
    updatePosition.mutate({ id: editing.id, role: form.role, desc: form.desc });
    setDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider">Sistema de Viatura</h1>
          <p className="text-sm text-muted-foreground">Posições e funções na viatura tática</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wider">Sistema de Viatura</h1>
        <p className="text-sm text-muted-foreground">Posições e funções na viatura tática</p>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border">
        <img src={viaturaImg} alt="Viatura tática RAM 4x4" className="w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
        {positions.map((p, i) => (
          <motion.div
            key={p.id}
            className="group absolute"
            style={{ left: p.x, top: p.y }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <div className="flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-accent bg-accent/20 font-display text-xs font-bold text-accent transition-transform hover:scale-125">
              {p.id}
            </div>
            <div className="pointer-events-none absolute left-4 top-4 z-10 w-48 rounded-lg border border-border bg-card p-3 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
              <p className="font-display text-xs font-bold text-accent">{p.id} — {p.role}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {positions.map((p, i) => (
          <motion.div
            key={p.id}
            className="group rounded-xl border border-border bg-card p-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 font-display text-xs font-bold text-accent">
                {p.id}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{p.role}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => openEdit(p)}
                  className="shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Editar Posição {editing?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Função</Label>
              <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="bg-muted/50" />
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

export default Viatura;
