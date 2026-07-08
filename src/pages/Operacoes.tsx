import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Target, Send } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { CreatableSelect } from "@/components/CreatableSelect";
import { MultiSelect } from "@/components/MultiSelect";

interface Option { id: string; nome: string; }

interface Operacao {
  id: string;
  data: string;
  resultado: string;
  detalhes: string;
  created_at: string;
  acao: Option | null;
  loja: Option | null;
  comando: Option | null;
  gangues: Option[];
  participantes: Option[];
}

const RESULTADOS = ["Vitória", "Derrota", "Empate"];
const RESULTADO_COLORS: Record<string, string> = {
  "Vitória": "hsl(var(--primary))",
  "Derrota": "hsl(var(--accent))",
  "Empate": "hsl(var(--tactical-blue))",
};

const EMPTY_FORM = {
  data: new Date().toISOString().slice(0, 10),
  acaoId: null as string | null,
  lojaId: null as string | null,
  resultado: "Vitória",
  comandoId: null as string | null,
  participanteIds: [] as string[],
  gangueIds: [] as string[],
  detalhes: "",
};

async function fetchLookup(table: "acoes_tipos" | "lojas" | "gangues"): Promise<Option[]> {
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
      comando:membros!operacoes_comando_id_fkey(id, nome),
      operacoes_gangues(gangue:gangues(id, nome)),
      operacoes_participantes(membro:membros!operacoes_participantes_membro_id_fkey(id, nome))
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data as unknown as Array<{
    id: string; data: string; resultado: string; detalhes: string; created_at: string;
    acao: Option | null; loja: Option | null; comando: Option | null;
    operacoes_gangues: { gangue: Option }[];
    operacoes_participantes: { membro: Option }[];
  }>).map((row) => ({
    id: row.id, data: row.data, resultado: row.resultado, detalhes: row.detalhes, created_at: row.created_at,
    acao: row.acao, loja: row.loja, comando: row.comando,
    gangues: row.operacoes_gangues.map((g) => g.gangue),
    participantes: row.operacoes_participantes.map((p) => p.membro),
  }));
}

const Operacoes = () => {
  const { user } = useAuth();
  const isComando = user?.papel === "comando";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: acoesTipos = [] } = useQuery({ queryKey: ["acoes_tipos"], queryFn: () => fetchLookup("acoes_tipos") });
  const { data: lojas = [] } = useQuery({ queryKey: ["lojas"], queryFn: () => fetchLookup("lojas") });
  const { data: gangues = [] } = useQuery({ queryKey: ["gangues"], queryFn: () => fetchLookup("gangues") });
  const { data: membrosOptions = [] } = useQuery({ queryKey: ["membros_options"], queryFn: fetchMembroOptions });
  const { data: operacoes = [], isLoading: loadingOperacoes } = useQuery({
    queryKey: ["operacoes"],
    queryFn: fetchOperacoes,
    enabled: isComando,
  });

  const createLookup = (table: "acoes_tipos" | "lojas" | "gangues") => async (nome: string): Promise<Option> => {
    const { data, error } = await supabase.from(table).insert({ nome }).select("id, nome").single();
    if (error) throw error;
    queryClient.setQueryData<Option[]>([table], (prev = []) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  };

  const createOperacao = useMutation({
    mutationFn: async (form: typeof EMPTY_FORM) => {
      const operacaoId = crypto.randomUUID();
      const { error } = await supabase.from("operacoes").insert({
        id: operacaoId,
        data: form.data,
        acao_id: form.acaoId,
        loja_id: form.lojaId,
        resultado: form.resultado,
        comando_id: form.comandoId,
        detalhes: form.detalhes,
      });
      if (error) throw error;

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

  const [form, setForm] = useState(EMPTY_FORM);

  const acaoSelecionada = acoesTipos.find((a) => a.id === form.acaoId);
  const precisaLoja = acaoSelecionada?.nome === "Loja de Departamento";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data || !form.acaoId || !form.resultado) return;
    createOperacao.mutate(form, { onSuccess: () => setForm(EMPTY_FORM) });
  };

  const resultadoChartData = useMemo(
    () => RESULTADOS.map((r) => ({ name: r, value: operacoes.filter((o) => o.resultado === r).length })).filter((d) => d.value > 0),
    [operacoes]
  );

  const gangueChartData = useMemo(() => {
    const counts = new Map<string, number>();
    operacoes.forEach((o) => o.gangues.forEach((g) => counts.set(g.nome, (counts.get(g.nome) ?? 0) + 1)));
    return Array.from(counts.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [operacoes]);

  const timelineChartData = useMemo(() => {
    const counts = new Map<string, number>();
    operacoes.forEach((o) => {
      const key = format(parseISO(o.data), "MM/yyyy");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([mes, total]) => ({ mes, total }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [operacoes]);

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
            <CreatableSelect
              options={membrosOptions}
              value={form.comandoId}
              onChange={(id) => setForm((f) => ({ ...f, comandoId: id }))}
              placeholder="Selecione quem comandou"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Participantes</Label>
            <MultiSelect
              options={membrosOptions}
              value={form.participanteIds}
              onChange={(ids) => setForm((f) => ({ ...f, participanteIds: ids }))}
              placeholder="Selecione os participantes"
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
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Resultado Geral</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={resultadoChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {resultadoChartData.map((d) => (
                          <Cell key={d.name} fill={RESULTADO_COLORS[d.name]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Gangues Mais Enfrentadas</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={gangueChartData} layout="vertical" margin={{ left: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis type="category" dataKey="nome" width={80} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Bar dataKey="total" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Ações por Mês</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={timelineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="font-display text-sm font-bold uppercase tracking-wider">Histórico de Ações</h2>
                {operacoes.map((op) => (
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
                      Comando: {op.comando?.nome ?? "—"} · Participantes: {op.participantes.map((p) => p.nome).join(", ") || "—"}
                    </p>
                    {op.gangues.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">Gangues: {op.gangues.map((g) => g.nome).join(", ")}</p>
                    )}
                    {op.detalhes && <p className="mt-2 text-sm text-foreground/90">{op.detalhes}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Operacoes;
