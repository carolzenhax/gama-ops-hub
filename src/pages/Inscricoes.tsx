import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Inscricoes = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nome: "", id: "", tempo: "", experiencia: "", motivacao: "", disponibilidade: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Candidatura enviada!", description: "Aguarde o contato da coordenação." });
    setForm({ nome: "", id: "", tempo: "", experiencia: "", motivacao: "", disponibilidade: "" });
  };

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wider">Inscrição</h1>
        <p className="text-sm text-muted-foreground">Preencha o formulário para candidatar-se à GAMA</p>
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
