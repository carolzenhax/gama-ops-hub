import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Target, Send, Download, FileDown, Pencil, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { CreatableSelect } from "@/components/CreatableSelect";
import { MultiSelect } from "@/components/MultiSelect";

interface Option { id: string; nome: string; }

interface Observacao {
  id: string;
  texto: string;
  createdAt: string;
  autor: string | null;
}

interface Operacao {
  id: string;
  data: string;
  resultado: string;
  detalhes: string;
  created_at: string;
  acao: Option | null;
  loja: Option | null;
  comandos: Option[];
  comandosExternos: Option[];
  gangues: Option[];
  participantes: Option[];
  criadoPor: string | null;
  observacoes: Observacao[];
}

const RESULTADOS = ["Vitória", "Derrota", "Empate"];
const RESULTADO_COLORS: Record<string, string> = {
  "Vitória": "hsl(var(--primary))",
  "Derrota": "hsl(var(--accent))",
  "Empate": "hsl(var(--tactical-blue))",
};

const PALETTE = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--tactical-blue))",
  "#eab308", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16", "#06b6d4", "#f43f5e", "#a3a3a3",
];

// Cores fixas por gangue (pedido da Ana) — gangues fora dessa lista caem no PALETTE cíclico.
const GANGUE_COLORS: Record<string, string> = {
  "Nox": "#a30000",
  "Hydra": "#a30000",
  "Nekutai": "#a30000",
  "Void": "#3b82f6",
  "Hells": "#ec4899",
  "Águias": "#9ca3af",
  "Meraki": "#eab308",
  "Vagos": "#eab308",
  "Vendetta": "#f97316",
  "Ballas": "#a855f7",
  "La Guardia": "#a855f7",
  "Aura": "#a855f7",
  "Domus": "#9ca3af",
  "Pista": "#9ca3af",
  "Black Heart": "#4b5563",
  "Families": "#22c55e",
  "Cartel": "#f5f5f5",
  "Ruptura": "#f97316",
  "Leviată": "#06b6d4",
  "Legacy": "#3b82f6",
};

const EMPTY_FORM = {
  data: new Date().toISOString().slice(0, 10),
  acaoId: null as string | null,
  lojaId: null as string | null,
  resultado: "Vitória",
  comandoIds: [] as string[],
  comandoExternoIds: [] as string[],
  participanteIds: [] as string[],
  gangueIds: [] as string[],
  detalhes: "",
};

async function fetchLookup(table: "acoes_tipos" | "lojas" | "gangues" | "comandos_externos"): Promise<Option[]> {
  const { data, error } = await supabase.from(table).select("id, nome").order("nome");
  if (error) throw error;
  return data;
}

async function fetchMembroOptions(): Promise<Option[]> {
  const { data, error } = await supabase.from("membros").select("id, nome").order("nome");
  if (error) throw error;
  return data;
}

async function fetchOperacoes(): Promise<Operacao[]> {
  const { data, error } = await supabase
    .from("operacoes")
    .select(`
      id, data, resultado, detalhes, created_at,
      acao:acoes_tipos(id, nome),
      loja:lojas(id, nome),
      criado_por_perfil:profiles!operacoes_criado_por_fkey(nome),
      operacoes_gangues(gangue:gangues(id, nome)),
      operacoes_participantes(membro:membros!operacoes_participantes_membro_id_fkey(id, nome)),
      operacoes_comandos(membro:membros!operacoes_comandos_membro_id_fkey(id, nome)),
      operacoes_comandos_externos(comandoExterno:comandos_externos(id, nome)),
      operacoes_observacoes(id, texto, created_at, autor:profiles!operacoes_observacoes_autor_id_fkey(nome))
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data as unknown as Array<{
    id: string; data: string; resultado: string; detalhes: string; created_at: string;
    acao: Option | null; loja: Option | null;
    criado_por_perfil: { nome: string } | null;
    operacoes_gangues: { gangue: Option }[];
    operacoes_participantes: { membro: Option }[];
    operacoes_comandos: { membro: Option }[];
    operacoes_comandos_externos: { comandoExterno: Option }[];
    operacoes_observacoes: { id: string; texto: string; created_at: string; autor: { nome: string } | null }[];
  }>).map((row) => ({
    id: row.id, data: row.data, resultado: row.resultado, detalhes: row.detalhes, created_at: row.created_at,
    acao: row.acao, loja: row.loja,
    gangues: row.operacoes_gangues.map((g) => g.gangue),
    participantes: row.operacoes_participantes.map((p) => p.membro),
    comandos: row.operacoes_comandos.map((c) => c.membro),
    comandosExternos: row.operacoes_comandos_externos.map((c) => c.comandoExterno),
    criadoPor: row.criado_por_perfil?.nome ?? null,
    observacoes: row.operacoes_observacoes
      .map((o) => ({ id: o.id, texto: o.texto, createdAt: o.created_at, autor: o.autor?.nome ?? null }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));
}

function DonutChart({ title, data, colors }: { title: string; data: { name: string; value: number }[]; colors?: string[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {total === 0 ? (
        <p className="py-16 text-center text-xs text-muted-foreground">Sem dados.</p>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                  {data.map((d, i) => <Cell key={d.name} fill={colors ? colors[i] : PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold">{total}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {data.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors ? colors[i] : PALETTE[i % PALETTE.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CategoryBarChart({ title, data, dataKeyName = "nome" }: { title: string; data: { nome: string; total: number }[]; dataKeyName?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {data.length === 0 ? (
        <p className="py-16 text-center text-xs text-muted-foreground">Sem dados.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={dataKeyName} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={50} />
            <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => <Cell key={d.nome} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ObservacoesSection({
  operacao, onSubmit, isPending,
}: {
  operacao: Operacao; onSubmit: (operacaoId: string, texto: string) => void; isPending: boolean;
}) {
  const [texto, setTexto] = useState("");
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {operacao.observacoes.length > 0 && (
        <div className="space-y-2">
          {operacao.observacoes.map((ob) => (
            <div key={ob.id} className="rounded-lg bg-muted/30 px-3 py-2">
              <p className="text-xs text-foreground/90">{ob.texto}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                {ob.autor ?? "—"} · {format(parseISO(ob.createdAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Deixe uma observação..."
          className="bg-muted/50 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 text-xs"
          disabled={!texto.trim() || isPending}
          onClick={() => { onSubmit(operacao.id, texto.trim()); setTexto(""); }}
        >
          Comentar
        </Button>
      </div>
    </div>
  );
}

const Operacoes = () => {
  const { user } = useAuth();
  const isComando = user?.papel === "comando";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: acoesTipos = [] } = useQuery({ queryKey: ["acoes_tipos"], queryFn: () => fetchLookup("acoes_tipos") });
  const { data: lojas = [] } = useQuery({ queryKey: ["lojas"], queryFn: () => fetchLookup("lojas") });
  const { data: gangues = [] } = useQuery({ queryKey: ["gangues"], queryFn: () => fetchLookup("gangues") });
  const { data: comandosExternos = [] } = useQuery({ queryKey: ["comandos_externos"], queryFn: () => fetchLookup("comandos_externos") });
  const { data: membrosOptions = [] } = useQuery({ queryKey: ["membros_options"], queryFn: fetchMembroOptions });
  const { data: operacoes = [], isLoading: loadingOperacoes } = useQuery({
    queryKey: ["operacoes"],
    queryFn: fetchOperacoes,
    enabled: user?.papel === "comando" || user?.papel === "membro",
  });

  const createLookup = (table: "acoes_tipos" | "lojas" | "gangues" | "comandos_externos") => async (nome: string): Promise<Option> => {
    const { data, error } = await supabase.from(table).insert({ nome }).select("id, nome").single();
    if (error) throw error;
    queryClient.setQueryData<Option[]>([table], (prev = []) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  };

  const createMembro = async (nome: string): Promise<Option> => {
    const { data, error } = await supabase
      .from("membros")
      .insert({ nome, cargo: "Estágio", classe: "Estágio" })
      .select("id, nome")
      .single();
    if (error) throw error;
    queryClient.setQueryData<Option[]>(["membros_options"], (prev = []) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  };

  const renameComandoExterno = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase.from("comandos_externos").update({ nome }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comandos_externos"] });
      queryClient.invalidateQueries({ queryKey: ["operacoes"] });
    },
  });

  const deleteComandoExterno = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comandos_externos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comandos_externos"] });
      queryClient.invalidateQueries({ queryKey: ["operacoes"] });
    },
  });

  const createOperacao = useMutation({
    mutationFn: async (form: typeof EMPTY_FORM) => {
      const operacaoId = crypto.randomUUID();
      const { error } = await supabase.from("operacoes").insert({
        id: operacaoId,
        data: form.data,
        acao_id: form.acaoId,
        loja_id: form.lojaId,
        resultado: form.resultado,
        detalhes: form.detalhes,
      });
      if (error) throw error;

      if (form.comandoIds.length) {
        const { error: cError } = await supabase
          .from("operacoes_comandos")
          .insert(form.comandoIds.map((membro_id) => ({ operacao_id: operacaoId, membro_id })));
        if (cError) throw cError;
      }
      if (form.comandoExternoIds.length) {
        const { error: ceError } = await supabase
          .from("operacoes_comandos_externos")
          .insert(form.comandoExternoIds.map((comando_externo_id) => ({ operacao_id: operacaoId, comando_externo_id })));
        if (ceError) throw ceError;
      }
      if (form.participanteIds.length) {
        const { error: pError } = await supabase
          .from("operacoes_participantes")
          .insert(form.participanteIds.map((membro_id) => ({ operacao_id: operacaoId, membro_id })));
        if (pError) throw pError;
      }
      if (form.gangueIds.length) {
        const { error: gError } = await supabase
          .from("operacoes_gangues")
          .insert(form.gangueIds.map((gangue_id) => ({ operacao_id: operacaoId, gangue_id })));
        if (gError) throw gError;
      }
    },
    onSuccess: () => {
      toast({ title: "Ação registrada!", description: "Obrigado por registrar essa operação." });
      queryClient.invalidateQueries({ queryKey: ["operacoes"] });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível registrar a ação.", variant: "destructive" });
    },
  });

  const updateOperacao = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: typeof EMPTY_FORM }) => {
      const { error } = await supabase.from("operacoes").update({
        data: form.data,
        acao_id: form.acaoId,
        loja_id: form.lojaId,
        resultado: form.resultado,
        detalhes: form.detalhes,
      }).eq("id", id);
      if (error) throw error;

      const { error: delCError } = await supabase.from("operacoes_comandos").delete().eq("operacao_id", id);
      if (delCError) throw delCError;
      if (form.comandoIds.length) {
        const { error: cError } = await supabase
          .from("operacoes_comandos")
          .insert(form.comandoIds.map((membro_id) => ({ operacao_id: id, membro_id })));
        if (cError) throw cError;
      }

      const { error: delCEError } = await supabase.from("operacoes_comandos_externos").delete().eq("operacao_id", id);
      if (delCEError) throw delCEError;
      if (form.comandoExternoIds.length) {
        const { error: ceError } = await supabase
          .from("operacoes_comandos_externos")
          .insert(form.comandoExternoIds.map((comando_externo_id) => ({ operacao_id: id, comando_externo_id })));
        if (ceError) throw ceError;
      }

      const { error: delPError } = await supabase.from("operacoes_participantes").delete().eq("operacao_id", id);
      if (delPError) throw delPError;
      if (form.participanteIds.length) {
        const { error: pError } = await supabase
          .from("operacoes_participantes")
          .insert(form.participanteIds.map((membro_id) => ({ operacao_id: id, membro_id })));
        if (pError) throw pError;
      }

      const { error: delGError } = await supabase.from("operacoes_gangues").delete().eq("operacao_id", id);
      if (delGError) throw delGError;
      if (form.gangueIds.length) {
        const { error: gError } = await supabase
          .from("operacoes_gangues")
          .insert(form.gangueIds.map((gangue_id) => ({ operacao_id: id, gangue_id })));
        if (gError) throw gError;
      }
    },
    onSuccess: () => {
      toast({ title: "Ação atualizada!" });
      queryClient.invalidateQueries({ queryKey: ["operacoes"] });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar a ação.", variant: "destructive" });
    },
  });

  const addObservacao = useMutation({
    mutationFn: async ({ operacaoId, texto }: { operacaoId: string; texto: string }) => {
      const { error } = await supabase.from("operacoes_observacoes").insert({ operacao_id: operacaoId, texto });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operacoes"] }),
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível enviar a observação.", variant: "destructive" });
    },
  });

  const deleteOperacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("operacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Ação excluída." });
      queryClient.invalidateQueries({ queryKey: ["operacoes"] });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível excluir a ação.", variant: "destructive" });
    },
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Operacao | null>(null);
  const [renameCETarget, setRenameCETarget] = useState<Option | null>(null);
  const [renameCEValue, setRenameCEValue] = useState("");
  const [deleteCETarget, setDeleteCETarget] = useState<Option | null>(null);
  const [mesFiltro, setMesFiltro] = useState("");
  const [operadorFiltro, setOperadorFiltro] = useState("");
  const [acaoFiltro, setAcaoFiltro] = useState("");
  const [gangueFiltro, setGangueFiltro] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  const acaoSelecionada = acoesTipos.find((a) => a.id === form.acaoId);
  const precisaLoja = acaoSelecionada?.nome === "Loja de Departamento";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data || !form.acaoId || !form.resultado) return;
    createOperacao.mutate(form, { onSuccess: () => setForm(EMPTY_FORM) });
  };

  const openEdit = (op: Operacao) => {
    setEditingId(op.id);
    setEditForm({
      data: op.data,
      acaoId: op.acao?.id ?? null,
      lojaId: op.loja?.id ?? null,
      resultado: op.resultado,
      comandoIds: op.comandos.map((c) => c.id),
      comandoExternoIds: op.comandosExternos.map((c) => c.id),
      participanteIds: op.participantes.map((p) => p.id),
      gangueIds: op.gangues.map((g) => g.id),
      detalhes: op.detalhes,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingId || !editForm.data || !editForm.acaoId || !editForm.resultado) return;
    updateOperacao.mutate({ id: editingId, form: editForm }, { onSuccess: () => setEditDialogOpen(false) });
  };

  const editAcaoSelecionada = acoesTipos.find((a) => a.id === editForm.acaoId);
  const editPrecisaLoja = editAcaoSelecionada?.nome === "Loja de Departamento";

  const operacoesFiltradas = useMemo(() => {
    return operacoes.filter((o) => {
      if (mesFiltro && !o.data.startsWith(mesFiltro)) return false;
      if (operadorFiltro && !o.participantes.some((p) => p.id === operadorFiltro)) return false;
      if (acaoFiltro && o.acao?.id !== acaoFiltro) return false;
      if (gangueFiltro && !o.gangues.some((g) => g.id === gangueFiltro)) return false;
      return true;
    });
  }, [operacoes, mesFiltro, operadorFiltro, acaoFiltro, gangueFiltro]);

  const acoesChartData = useMemo(() => {
    const counts = new Map<string, number>();
    operacoesFiltradas.forEach((o) => {
      const nome = o.acao?.nome ?? "—";
      counts.set(nome, (counts.get(nome) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [operacoesFiltradas]);

  const resultadoChartData = useMemo(
    () => RESULTADOS.map((r) => ({ name: r, value: operacoesFiltradas.filter((o) => o.resultado === r).length })).filter((d) => d.value > 0),
    [operacoesFiltradas]
  );

  const participacoesChartData = useMemo(() => {
    const counts = new Map<string, number>();
    operacoesFiltradas.forEach((o) => o.participantes.forEach((p) => counts.set(p.nome, (counts.get(p.nome) ?? 0) + 1)));
    return Array.from(counts.entries()).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
  }, [operacoesFiltradas]);

  const comandosChartData = useMemo(() => {
    const counts = new Map<string, number>();
    operacoesFiltradas.forEach((o) => o.comandos.forEach((c) => counts.set(c.nome, (counts.get(c.nome) ?? 0) + 1)));
    return Array.from(counts.entries()).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
  }, [operacoesFiltradas]);

  const gangueChartData = useMemo(() => {
    const counts = new Map<string, number>();
    operacoesFiltradas.forEach((o) => o.gangues.forEach((g) => counts.set(g.nome, (counts.get(g.nome) ?? 0) + 1)));
    return Array.from(counts.entries()).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total).slice(0, 15);
  }, [operacoesFiltradas]);

  const lojaDeptChartData = useMemo(() => {
    const counts = new Map<string, number>();
    operacoesFiltradas
      .filter((o) => o.acao?.nome === "Loja de Departamento")
      .forEach((o) => {
        const nome = o.loja?.nome ?? "—";
        counts.set(nome, (counts.get(nome) ?? 0) + 1);
      });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [operacoesFiltradas]);

  const handleExport = () => {
    const rows = operacoesFiltradas.map((op) => ({
      Data: format(parseISO(op.data), "dd/MM/yyyy"),
      "Ação": op.acao?.nome ?? "",
      Loja: op.loja?.nome ?? "",
      Resultado: op.resultado,
      Comando: op.comandos.map((c) => c.nome).join(", "),
      "Comando Externo": op.comandosExternos.map((c) => c.nome).join(", "),
      Participantes: op.participantes.map((p) => p.nome).join(", "),
      Gangues: op.gangues.map((g) => g.nome).join(", "),
      Detalhes: op.detalhes,
      "Enviado por": op.criadoPor ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Operações");
    XLSX.writeFile(wb, mesFiltro ? `operacoes-${mesFiltro}.xlsx` : "operacoes-todas.xlsx");
  };

  const handleExportPdf = async () => {
    const el = chartsRef.current;
    if (!el) return;
    setExportingPdf(true);
    try {
      const bg = `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--background").trim()})`;
      const scale = 2;
      const gridRect = el.getBoundingClientRect();

      // html2canvas mishandles CSS Grid when capturing multiple siblings at once (columns
      // after the first render blank). Capture each chart panel separately instead and
      // composite them onto one canvas at their real relative positions.
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(gridRect.width * scale);
      canvas.height = Math.ceil(gridRect.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const child of Array.from(el.children)) {
        const rect = child.getBoundingClientRect();
        const panelCanvas = await html2canvas(child as HTMLElement, { backgroundColor: null, scale });
        ctx.drawImage(panelCanvas, (rect.left - gridRect.left) * scale, (rect.top - gridRect.top) * scale);
      }

      const imgData = canvas.toDataURL("image/png");
      // jsPDF's "px" unit is unreliable across versions — convert to points (72/96 px) instead,
      // which is jsPDF's native, well-supported unit.
      const pdfWidth = canvas.width * 0.75;
      const pdfHeight = canvas.height * 0.75;
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
        unit: "pt",
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(mesFiltro ? `operacoes-graficos-${mesFiltro}.pdf` : "operacoes-graficos.pdf");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wider">Operações</h1>
        <p className="text-sm text-muted-foreground">Registro de ações táticas executadas pela unidade</p>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-border bg-card p-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-accent">Nova Ação</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data</Label>
            <Input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} className="bg-muted/50" required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ação</Label>
            <CreatableSelect
              options={acoesTipos}
              value={form.acaoId}
              onChange={(id) => setForm((f) => ({ ...f, acaoId: id, lojaId: null }))}
              placeholder="Selecione a ação"
            />
          </div>
        </div>

        {precisaLoja && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Qual Loja?</Label>
            <CreatableSelect
              options={lojas}
              value={form.lojaId}
              onChange={(id) => setForm((f) => ({ ...f, lojaId: id }))}
              placeholder="Selecione a loja"
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Resultado</Label>
            <select
              value={form.resultado}
              onChange={(e) => setForm((f) => ({ ...f, resultado: e.target.value }))}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
            >
              {RESULTADOS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Comando da Ação</Label>
            <MultiSelect
              options={membrosOptions}
              value={form.comandoIds}
              onChange={(ids) => setForm((f) => ({ ...f, comandoIds: ids }))}
              placeholder="Selecione quem comandou"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Comando Externo (não é da GAMA)</Label>
          <MultiSelect
            options={comandosExternos}
            value={form.comandoExternoIds}
            onChange={(ids) => setForm((f) => ({ ...f, comandoExternoIds: ids }))}
            onCreate={createLookup("comandos_externos")}
            onRename={isComando ? (o) => { setRenameCETarget(o); setRenameCEValue(o.nome); } : undefined}
            onDelete={isComando ? (o) => setDeleteCETarget(o) : undefined}
            placeholder="Selecione ou crie um nome"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Participantes</Label>
            <MultiSelect
              options={membrosOptions}
              value={form.participanteIds}
              onChange={(ids) => setForm((f) => ({ ...f, participanteIds: ids }))}
              onCreate={createMembro}
              placeholder="Selecione ou crie um participante"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Gangues Envolvidas</Label>
            <MultiSelect
              options={gangues}
              value={form.gangueIds}
              onChange={(ids) => setForm((f) => ({ ...f, gangueIds: ids }))}
              onCreate={createLookup("gangues")}
              placeholder="Selecione ou crie uma gangue"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Detalhes</Label>
          <Textarea
            value={form.detalhes}
            onChange={(e) => setForm((f) => ({ ...f, detalhes: e.target.value }))}
            className="bg-muted/50"
            rows={3}
            placeholder="Descreva como a ação aconteceu..."
          />
        </div>

        <Button type="submit" disabled={createOperacao.isPending} className="glow-green w-full bg-primary font-display text-xs tracking-widest hover:bg-primary/80">
          <Send className="mr-2 h-4 w-4" /> {createOperacao.isPending ? "REGISTRANDO..." : "REGISTRAR AÇÃO"}
        </Button>
      </motion.form>

      {user?.papel === "membro" && (
        <div className="space-y-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider">Relatórios</h2>
          {loadingOperacoes ? (
            <div className="h-24 animate-pulse rounded-xl border border-border bg-muted/30" />
          ) : operacoes.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Target className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum relatório seu ou de ações que você participou ainda.</p>
            </div>
          ) : (
            operacoes.map((op) => (
              <div key={op.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs text-accent">{format(parseISO(op.data), "dd/MM/yyyy")}</span>
                    <span className="font-display text-sm font-bold">{op.acao?.nome}{op.loja ? ` — ${op.loja.nome}` : ""}</span>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                    style={{ backgroundColor: `${RESULTADO_COLORS[op.resultado]}33`, color: RESULTADO_COLORS[op.resultado] }}
                  >
                    {op.resultado}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Comando: {[...op.comandos, ...op.comandosExternos].map((c) => c.nome).join(", ") || "—"} · Participantes: {op.participantes.map((p) => p.nome).join(", ") || "—"}
                </p>
                {op.gangues.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">Gangues: {op.gangues.map((g) => g.nome).join(", ")}</p>
                )}
                {op.detalhes && <p className="mt-2 text-sm text-foreground/90">{op.detalhes}</p>}
                <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  Enviado por: {op.criadoPor ?? "—"}
                </p>
                <ObservacoesSection
                  operacao={op}
                  onSubmit={(id, texto) => addObservacao.mutate({ operacaoId: id, texto })}
                  isPending={addObservacao.isPending}
                />
              </div>
            ))
          )}
        </div>
      )}

      {isComando && (
        <>
          {loadingOperacoes ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />)}
            </div>
          ) : operacoes.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Filtrar por mês</Label>
                  <Input
                    type="month"
                    value={mesFiltro}
                    onChange={(e) => setMesFiltro(e.target.value)}
                    className="w-auto bg-muted/50 text-sm"
                  />
                  {mesFiltro && (
                    <button
                      onClick={() => setMesFiltro("")}
                      className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExport}
                    disabled={operacoesFiltradas.length === 0}
                    className="gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" /> Exportar XLSX
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportPdf}
                    disabled={operacoesFiltradas.length === 0 || exportingPdf}
                    className="gap-1.5 text-xs"
                  >
                    <FileDown className="h-3.5 w-3.5" /> {exportingPdf ? "Gerando..." : "Exportar PDF"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Filtrar gráficos</Label>
                <select
                  value={operadorFiltro}
                  onChange={(e) => setOperadorFiltro(e.target.value)}
                  className="rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="">Todos os operadores</option>
                  {membrosOptions.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                <select
                  value={acaoFiltro}
                  onChange={(e) => setAcaoFiltro(e.target.value)}
                  className="rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="">Todas as ações</option>
                  {acoesTipos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
                <select
                  value={gangueFiltro}
                  onChange={(e) => setGangueFiltro(e.target.value)}
                  className="rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="">Todas as gangues</option>
                  {gangues.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
                {(operadorFiltro || acaoFiltro || gangueFiltro) && (
                  <button
                    onClick={() => { setOperadorFiltro(""); setAcaoFiltro(""); setGangueFiltro(""); }}
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              {operacoesFiltradas.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center">
                  <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Nenhuma ação registrada nesse mês.</p>
                </div>
              ) : (
                <>
                  <div ref={chartsRef} className="grid gap-4 lg:grid-cols-2 bg-background p-1">
                    <DonutChart title="N° Ações" data={acoesChartData} />
                    <DonutChart
                      title="Resultado"
                      data={resultadoChartData}
                      colors={resultadoChartData.map((d) => RESULTADO_COLORS[d.name])}
                    />
                    <CategoryBarChart title="N° Participações" data={participacoesChartData} />
                    <CategoryBarChart title="Comandos" data={comandosChartData} />

                    <div className="rounded-xl border border-border bg-card p-5">
                      <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Gangues</h3>
                      <ResponsiveContainer width="100%" height={Math.max(220, gangueChartData.length * 26)}>
                        <BarChart data={gangueChartData} layout="vertical" margin={{ left: 16 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <YAxis type="category" dataKey="nome" width={90} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                            {gangueChartData.map((d, i) => <Cell key={d.nome} fill={GANGUE_COLORS[d.nome] ?? PALETTE[i % PALETTE.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <DonutChart title="Loja de Departamento" data={lojaDeptChartData} />
                  </div>

                  <div className="space-y-3">
                    <h2 className="font-display text-sm font-bold uppercase tracking-wider">Histórico de Ações</h2>
                    {operacoesFiltradas.map((op) => (
                      <div key={op.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-xs text-accent">{format(parseISO(op.data), "dd/MM/yyyy")}</span>
                            <span className="font-display text-sm font-bold">{op.acao?.nome}{op.loja ? ` — ${op.loja.nome}` : ""}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
                              style={{ backgroundColor: `${RESULTADO_COLORS[op.resultado]}33`, color: RESULTADO_COLORS[op.resultado] }}
                            >
                              {op.resultado}
                            </span>
                            <button onClick={() => openEdit(op)} className="text-muted-foreground transition-colors hover:text-foreground">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget(op)} className="text-muted-foreground transition-colors hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Comando: {[...op.comandos, ...op.comandosExternos].map((c) => c.nome).join(", ") || "—"} · Participantes: {op.participantes.map((p) => p.nome).join(", ") || "—"}
                        </p>
                        {op.gangues.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">Gangues: {op.gangues.map((g) => g.nome).join(", ")}</p>
                        )}
                        {op.detalhes && <p className="mt-2 text-sm text-foreground/90">{op.detalhes}</p>}
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          Enviado por: {op.criadoPor ?? "—"}
                        </p>
                        <ObservacoesSection
                          operacao={op}
                          onSubmit={(id, texto) => addObservacao.mutate({ operacaoId: id, texto })}
                          isPending={addObservacao.isPending}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Editar Ação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data</Label>
                <Input type="date" value={editForm.data} onChange={(e) => setEditForm((f) => ({ ...f, data: e.target.value }))} className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ação</Label>
                <CreatableSelect
                  options={acoesTipos}
                  value={editForm.acaoId}
                  onChange={(id) => setEditForm((f) => ({ ...f, acaoId: id, lojaId: null }))}
                  placeholder="Selecione a ação"
                />
              </div>
            </div>

            {editPrecisaLoja && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Qual Loja?</Label>
                <CreatableSelect
                  options={lojas}
                  value={editForm.lojaId}
                  onChange={(id) => setEditForm((f) => ({ ...f, lojaId: id }))}
                  placeholder="Selecione a loja"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Resultado</Label>
                <select
                  value={editForm.resultado}
                  onChange={(e) => setEditForm((f) => ({ ...f, resultado: e.target.value }))}
                  className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
                >
                  {RESULTADOS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Comando da Ação</Label>
                <MultiSelect
                  options={membrosOptions}
                  value={editForm.comandoIds}
                  onChange={(ids) => setEditForm((f) => ({ ...f, comandoIds: ids }))}
                  placeholder="Selecione quem comandou"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Comando Externo (não é da GAMA)</Label>
              <MultiSelect
                options={comandosExternos}
                value={editForm.comandoExternoIds}
                onChange={(ids) => setEditForm((f) => ({ ...f, comandoExternoIds: ids }))}
                onCreate={createLookup("comandos_externos")}
                onRename={isComando ? (o) => { setRenameCETarget(o); setRenameCEValue(o.nome); } : undefined}
                onDelete={isComando ? (o) => setDeleteCETarget(o) : undefined}
                placeholder="Selecione ou crie um nome"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Participantes</Label>
                <MultiSelect
                  options={membrosOptions}
                  value={editForm.participanteIds}
                  onChange={(ids) => setEditForm((f) => ({ ...f, participanteIds: ids }))}
                  onCreate={createMembro}
                  placeholder="Selecione ou crie um participante"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Gangues Envolvidas</Label>
                <MultiSelect
                  options={gangues}
                  value={editForm.gangueIds}
                  onChange={(ids) => setEditForm((f) => ({ ...f, gangueIds: ids }))}
                  onCreate={createLookup("gangues")}
                  placeholder="Selecione ou crie uma gangue"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Detalhes</Label>
              <Textarea
                value={editForm.detalhes}
                onChange={(e) => setEditForm((f) => ({ ...f, detalhes: e.target.value }))}
                className="bg-muted/50"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSubmit} disabled={updateOperacao.isPending}>
              {updateOperacao.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Excluir Ação</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a ação <span className="font-medium text-foreground">{deleteTarget?.acao?.nome}</span> de{" "}
            {deleteTarget && format(parseISO(deleteTarget.data), "dd/MM/yyyy")}? Essa ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteOperacao.isPending}
              onClick={() => deleteOperacao.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
            >
              {deleteOperacao.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameCETarget} onOpenChange={(open) => !open && setRenameCETarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Renomear Comando Externo</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
            <Input value={renameCEValue} onChange={(e) => setRenameCEValue(e.target.value)} className="bg-muted/50" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameCETarget(null)}>Cancelar</Button>
            <Button
              disabled={renameComandoExterno.isPending || !renameCEValue.trim()}
              onClick={() => renameComandoExterno.mutate(
                { id: renameCETarget!.id, nome: renameCEValue.trim() },
                { onSuccess: () => setRenameCETarget(null) }
              )}
            >
              {renameComandoExterno.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteCETarget} onOpenChange={(open) => !open && setDeleteCETarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Excluir Comando Externo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <span className="font-medium text-foreground">{deleteCETarget?.nome}</span>?
            Ele é removido das ações que o usavam, mas as ações continuam existindo.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCETarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteComandoExterno.isPending}
              onClick={() => deleteComandoExterno.mutate(deleteCETarget!.id, { onSuccess: () => setDeleteCETarget(null) })}
            >
              {deleteComandoExterno.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Operacoes;
