-- GAMA Ops Hub — schema da página Operações (Fase 6 do plano de migração)
-- Pré-requisito: 0001_initial_schema.sql já aplicado (usa a função public.current_papel()
-- e a tabela public.membros criadas lá).

-- ── Tabelas de lookup editáveis (extensíveis direto pela UI) ───────────────

create table public.acoes_tipos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

create table public.lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

create table public.gangues (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

-- ── Tabela principal de operações ──────────────────────────────────────────

create table public.operacoes (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  acao_id uuid not null references public.acoes_tipos(id),
  loja_id uuid references public.lojas(id),
  resultado text not null check (resultado in ('Vitória', 'Derrota', 'Empate')),
  comando_id uuid references public.membros(id) on delete set null,
  detalhes text not null default '',
  created_at timestamptz not null default clock_timestamp()
);

create table public.operacoes_gangues (
  operacao_id uuid not null references public.operacoes(id) on delete cascade,
  gangue_id uuid not null references public.gangues(id),
  primary key (operacao_id, gangue_id)
);

create table public.operacoes_participantes (
  operacao_id uuid not null references public.operacoes(id) on delete cascade,
  membro_id uuid not null references public.membros(id),
  primary key (operacao_id, membro_id)
);

-- ── RLS ────────────────────────────────────────────────────────────────────

alter table public.acoes_tipos enable row level security;
alter table public.lojas enable row level security;
alter table public.gangues enable row level security;
alter table public.operacoes enable row level security;
alter table public.operacoes_gangues enable row level security;
alter table public.operacoes_participantes enable row level security;

-- Lookups: comando e membro podem ler (preencher o formulário) e criar opção nova
-- (combobox "criável" — ex: cadastrar uma gangue que ainda não existe na lista).
create policy "acoes_tipos_select" on public.acoes_tipos for select to authenticated using (public.current_papel() in ('comando', 'membro'));
create policy "acoes_tipos_insert" on public.acoes_tipos for insert to authenticated with check (public.current_papel() in ('comando', 'membro'));

create policy "lojas_select" on public.lojas for select to authenticated using (public.current_papel() in ('comando', 'membro'));
create policy "lojas_insert" on public.lojas for insert to authenticated with check (public.current_papel() in ('comando', 'membro'));

create policy "gangues_select" on public.gangues for select to authenticated using (public.current_papel() in ('comando', 'membro'));
create policy "gangues_insert" on public.gangues for insert to authenticated with check (public.current_papel() in ('comando', 'membro'));

-- Operações: comando e membro registram; só comando visualiza listagem/gráficos.
-- Sem policy de update/delete nesta versão (fora do escopo inicial).
create policy "operacoes_insert" on public.operacoes for insert to authenticated with check (public.current_papel() in ('comando', 'membro'));
create policy "operacoes_select" on public.operacoes for select to authenticated using (public.current_papel() = 'comando');

create policy "operacoes_gangues_insert" on public.operacoes_gangues for insert to authenticated with check (public.current_papel() in ('comando', 'membro'));
create policy "operacoes_gangues_select" on public.operacoes_gangues for select to authenticated using (public.current_papel() = 'comando');

create policy "operacoes_participantes_insert" on public.operacoes_participantes for insert to authenticated with check (public.current_papel() in ('comando', 'membro'));
create policy "operacoes_participantes_select" on public.operacoes_participantes for select to authenticated using (public.current_papel() = 'comando');

-- ── Seed das listas de opções ───────────────────────────────────────────────

insert into public.acoes_tipos (nome) values
  ('Açougue'), ('Aeroporto'), ('Banco Central'), ('Ferro Velho'), ('Fleeca'),
  ('Galinheiro'), ('Joalheria'), ('Loja de Armamento'), ('Loja de Departamento'),
  ('Madeireira'), ('Zancudo'), ('Dominação DP');

insert into public.lojas (nome) values
  ('Ark'), ('Ballas'), ('Central'), ('MecAnjos'), ('Vanilla'),
  ('Pops'), ('Mirror'), ('China'), ('Praia'), ('Grappe');

insert into public.gangues (nome) values
  ('Aura'), ('Águias'), ('Ballas'), ('Black Heart'), ('Blue Rose'), ('Cartel'),
  ('D13'), ('Domus'), ('Families'), ('Hells'), ('Hydra'), ('La Guardia'),
  ('Meraki'), ('Nekutai'), ('Nox'), ('Ruptura'), ('Umbra'), ('Vagos'),
  ('Valhalla'), ('Vendetta'), ('Void'), ('Pista'), ('Leviată'), ('Legacy');
