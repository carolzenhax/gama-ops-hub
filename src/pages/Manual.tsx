import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface Section { id: string; title: string; content: string; }

// Ordem de exibição no menu — a tabela não tem coluna de ordem própria,
// as 7 seções são fixas e nunca criadas/removidas pela UI.
const SECTION_ORDER = ["sobre", "atribuicoes", "hierarquia", "regras", "viatura", "abordagem", "responsabilidades"];

async function fetchSections(): Promise<Section[]> {
  const { data, error } = await supabase.from("manual_secoes").select("id, titulo, conteudo");
  if (error) throw error;
  return data
    .map((s) => ({ id: s.id, title: s.titulo, content: s.conteudo }))
    .sort((a, b) => SECTION_ORDER.indexOf(a.id) - SECTION_ORDER.indexOf(b.id));
}

const Manual = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "comando";
  const queryClient = useQueryClient();
  const { data: sections = [], isLoading } = useQuery({ queryKey: ["manual_secoes"], queryFn: fetchSections });

  const updateSection = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase.from("manual_secoes").update({ conteudo: content }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["manual_secoes"] }),
  });

  const [active, setActive] = useState("sobre");
  const [editingContent, setEditingContent] = useState(false);
  const [draft, setDraft] = useState("");

  const current = sections.find((s) => s.id === active) ?? sections[0];

  const startEdit = () => {
    setDraft(current.content);
    setEditingContent(true);
  };

  const saveEdit = () => {
    updateSection.mutate({ id: active, content: draft });
    setEditingContent(false);
  };

  const cancelEdit = () => setEditingContent(false);

  if (isLoading || !current) {
    return (
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="shrink-0 space-y-2 lg:w-56">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/30" />
          ))}
        </div>
        <div className="h-64 flex-1 animate-pulse rounded-xl border border-border bg-muted/30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <nav className="shrink-0 space-y-1 lg:w-56">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => { setActive(s.id); setEditingContent(false); }}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
              active === s.id
                ? "bg-primary/20 font-medium text-foreground border-l-2 border-accent"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {s.title}
          </button>
        ))}
      </nav>

      <motion.div
        key={active}
        className="flex-1 rounded-xl border border-border bg-card p-6"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-bold tracking-wider">{current.title}</h2>
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
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[300px] bg-muted/50 text-sm leading-relaxed"
            autoFocus
          />
        ) : (
          <div className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{current.content}</div>
        )}
      </motion.div>
    </div>
  );
};

export default Manual;
