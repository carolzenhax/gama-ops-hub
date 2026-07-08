import { useState } from "react";
import { motion } from "framer-motion";
import { Send, ClipboardList, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface Candidatura {
  id: string;
  nome: string;
  id_policial: string;
  tempo: string;
  disponibilidade: string;
  experiencia: string;
  motivacao: string;
  data: string;
}

const EMPTY_FORM = { nome: "", id: "", tempo: "", experiencia: "", motivacao: "", disponibilidade: "" };

async function fetchCandidaturas(): Promise<Candidatura[]> {
  const { data, error } = await supabase
    .from("inscricoes")
    .select("id, nome, id_policial, tempo, disponibilidade, experiencia, motivacao, data")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

const Inscricoes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.papel === "comando";
  const queryClient = useQueryClient();
  const [adminView, setAdminView] = useState(false);

  const { data: candidaturas = [] } = useQuery({
    queryKey: ["inscricoes"],
    queryFn: fetchCandidaturas,
    enabled: isAdmin,
  });

  const addCandidatura = useMutation({
    mutationFn: async (payload: typeof EMPTY_FORM) => {
      const { error } = await supabase.from("inscricoes").insert({
        nome: payload.nome,
        id_policial: payload.id,
        tempo: payload.tempo,
        disponibilidade: payload.disponibilidade,
        experiencia: payload.experiencia,
        motivacao: payload.motivacao,
        data: new Date().toLocaleDateString("pt-BR"),
      });
      if (error) throw error;
    },
  });

  const deleteCandidatura = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inscricoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inscricoes"] }),
  });

  const [form, setForm] = useState(EMPTY_FORM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCandidatura.mutate(form, {
      onSuccess: () => {
        toast({ title: "Candidatura enviada!", description: "Aguarde o contato da coordenação." });
        setForm(EMPTY_FORM);
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível enviar a candidatura.", variant: "destructive" });
      },
    });
  };

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleDelete = (id: string) => deleteCandidatura.mutate(id);

  if (isAdmin && adminView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wider">Inscrições</h1>
            <p className="text-sm text-muted-foreground">{candidaturas.length} candidatura(s) recebida(s)</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAdminView(false)} className="text-xs">
            Ver Formulário
          </Button>
        </div>

        {candidaturas.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma candidatura recebida ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidaturas.map((c) => (
              <motion.div
                key={c.id}
                className="rounded-xl border border-border bg-card p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">ID: {c.id_policial} · Recebido em {c.data}</p>
                  </div>
                  <button onClick={() => handleDelete(c.id)} className="shrink-0 text-muted-foreground transition-colors hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tempo de polícia</p>
                    <p className="text-foreground">{c.tempo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Disponibilidade</p>
                    <p className="text-foreground">{c.disponibilidade}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Experiência prévia</p>
                    <p className="whitespace-pre-line text-foreground">{c.experiencia}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Motivação</p>
                    <p className="whitespace-pre-line text-foreground">{c.motivacao}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider">Inscrição</h1>
          <p className="text-sm text-muted-foreground">Preencha o formulário para candidatar-se à GAMA</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setAdminView(true)} className="gap-1.5 text-xs">
            <ClipboardList className="h-3.5 w-3.5" /> Ver Candidaturas ({candidaturas.length})
          </Button>
        )}
      </div>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-border bg-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome completo</Label>
            <Input value={form.nome} onChange={update("nome")} required className="bg-muted/50 border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">ID</Label>
            <Input value={form.id} onChange={update("id")} required className="bg-muted/50 border-border" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tempo de polícia</Label>
            <Input value={form.tempo} onChange={update("tempo")} required className="bg-muted/50 border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Disponibilidade</Label>
            <Input value={form.disponibilidade} onChange={update("disponibilidade")} required className="bg-muted/50 border-border" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Experiência prévia</Label>
          <Textarea value={form.experiencia} onChange={update("experiencia")} required className="bg-muted/50 border-border" rows={3} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Motivação</Label>
          <Textarea value={form.motivacao} onChange={update("motivacao")} required className="bg-muted/50 border-border" rows={3} />
        </div>
        <Button type="submit" className="glow-green w-full bg-primary font-display text-xs tracking-widest hover:bg-primary/80">
          <Send className="mr-2 h-4 w-4" /> ENVIAR CANDIDATURA
        </Button>
      </motion.form>
    </div>
  );
};

export default Inscricoes;
