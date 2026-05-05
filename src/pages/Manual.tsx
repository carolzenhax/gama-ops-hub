import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Section { id: string; title: string; content: string; }

const DEFAULT_SECTIONS: Section[] = [
  { id: "sobre", title: "Sobre a GAMA", content: "O Grupamento de Ações em Montanha e Ambiente Árido (GAMA) é uma unidade tática de elite da Polícia, especializada em operações em terrenos extremos. Criada com o objetivo de atuar em regiões montanhosas e áridas, a GAMA conta com operadores altamente treinados em sobrevivência, combate tático e resgate em condições adversas." },
  { id: "atribuicoes", title: "Atribuições", content: "• Operações táticas em terreno montanhoso e desértico\n• Resgate de reféns em áreas remotas\n• Patrulhamento e vigilância em regiões de difícil acesso\n• Apoio a operações especiais de outras unidades\n• Treinamento e capacitação de efetivo policial\n• Escolta tática de alto risco" },
  { id: "hierarquia", title: "Hierarquia", content: "COMANDANTE — Oficial responsável pela unidade\nSUBCOMANDANTE — Segundo em comando\nCHEFE DE OPERAÇÕES — Coordena missões táticas\nLÍDER DE EQUIPE — Comanda grupos operacionais\nOPERADOR SÊNIOR — Experiência avançada\nOPERADOR — Membro efetivo da unidade\nASPIRANTE — Em período de avaliação" },
  { id: "regras", title: "Regras", content: "1. Obediência à cadeia de comando\n2. Sigilo operacional absoluto\n3. Pontualidade em todas as convocações\n4. Manutenção rigorosa de equipamentos\n5. Proibido uso de informações operacionais fora do sistema\n6. Respeito mútuo entre todos os membros\n7. Participação obrigatória em treinamentos semanais" },
  { id: "viatura", title: "Sistema de Viatura", content: "A GAMA opera com viaturas táticas 4x4 preparadas para terrenos extremos. Cada viatura comporta até 6 operadores com funções definidas (P1 a P6). As viaturas são equipadas com comunicação criptografada, kit de primeiros socorros avançado e armamento tático." },
  { id: "abordagem", title: "Abordagem Tática", content: "O protocolo de abordagem tática segue uma sequência operacional rigorosa:\n\n1. Reconhecimento do terreno\n2. Posicionamento da equipe\n3. Comunicação com central\n4. Aproximação controlada\n5. Contenção e neutralização\n6. Verificação de segurança\n7. Relatório pós-operação" },
  { id: "responsabilidades", title: "Responsabilidades", content: "Cada membro da GAMA carrega a responsabilidade de representar a unidade com excelência. Isso inclui: manter a forma física em nível operacional, cumprir escalas de serviço, reportar irregularidades, zelar pelo patrimônio e contribuir para a evolução constante da unidade." },
];

const Manual = () => {
  const { user } = useAuth();
  const isAdmin = user?.papel === "admin";
  const [sections, setSections] = useLocalStorage<Section[]>("gama-manual", DEFAULT_SECTIONS);
  const [active, setActive] = useState("sobre");
  const [editingContent, setEditingContent] = useState(false);
  const [draft, setDraft] = useState("");

  const current = sections.find((s) => s.id === active) ?? sections[0];

  const startEdit = () => {
    setDraft(current.content);
    setEditingContent(true);
  };

  const saveEdit = () => {
    setSections((prev) => prev.map((s) => (s.id === active ? { ...s, content: draft } : s)));
    setEditingContent(false);
  };

  const cancelEdit = () => setEditingContent(false);

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
