-- GAMA Ops Hub — schema inicial: papéis, perfis e tabelas de dados (Fase 2 do plano de migração)
-- Rodar no SQL Editor do Supabase (ou via CLI) num projeto novo, nesta ordem.

create extension if not exists pgcrypto;

-- ── Papéis ─────────────────────────────────────────────────────────────────

create type public.app_role as enum ('comando', 'membro', 'visitante');

-- ── Perfis (1:1 com auth.users) ──────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel public.app_role not null default 'visitante',
  login_id text not null unique,
  created_at timestamptz not null default now()
);

-- Popula profiles automaticamente quando uma conta é criada (a Edge Function da Fase 4
-- passa nome/papel/login_id nos metadados do usuário no momento da criação).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, papel, login_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce((new.raw_user_meta_data->>'papel')::public.app_role, 'visitante'),
    coalesce(new.raw_user_meta_data->>'login_id', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Função auxiliar usada pelas policies abaixo para checar o papel do usuário logado.
-- security definer: ignora a RLS de profiles ao consultar, evitando recursão.
create or replace function public.current_papel()
returns public.app_role
language sql
security definer
stable
set search_path = public
as $$
  select papel from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_self" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_select_comando" on public.profiles
  for select to authenticated using (public.current_papel() = 'comando');

-- Sem policy de insert/update/delete: só a Edge Function (service role) mexe em profiles.

-- ── Tabelas de dados ──────────────────────────────────────────────────────

create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  data text not null,
  texto text not null,
  created_at timestamptz not null default clock_timestamp()
);

create table public.manual_secoes (
  id text primary key,
  titulo text not null,
  conteudo text not null
);

create table public.cursos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  aplicador text not null,
  descricao text not null default '',
  video_url text not null default ''
);

create table public.membros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cargo text not null,
  classe text not null check (classe in ('Oficial', 'Graduado', 'Praça'))
);

create table public.inscricoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  id_policial text not null,
  tempo text not null,
  disponibilidade text not null,
  experiencia text not null,
  motivacao text not null,
  data text not null,
  created_at timestamptz not null default clock_timestamp()
);

create table public.galeria_fotos (
  id uuid primary key default gen_random_uuid(),
  src text not null,
  categoria text not null,
  titulo text not null
);

create table public.viatura_posicoes (
  id text primary key,
  role text not null,
  descricao text not null,
  x text not null,
  y text not null
);

create table public.tatica_steps (
  id uuid primary key default gen_random_uuid(),
  icon_key text not null,
  titulo text not null,
  descricao text not null,
  created_at timestamptz not null default clock_timestamp()
);

-- ── RLS ────────────────────────────────────────────────────────────────────

alter table public.avisos enable row level security;
alter table public.manual_secoes enable row level security;
alter table public.cursos enable row level security;
alter table public.membros enable row level security;
alter table public.inscricoes enable row level security;
alter table public.galeria_fotos enable row level security;
alter table public.viatura_posicoes enable row level security;
alter table public.tatica_steps enable row level security;

-- avisos / cursos / galeria_fotos / tatica_steps: leitura pra qualquer autenticado, escrita só comando
create policy "avisos_select" on public.avisos for select to authenticated using (true);
create policy "avisos_insert" on public.avisos for insert to authenticated with check (public.current_papel() = 'comando');
create policy "avisos_update" on public.avisos for update to authenticated using (public.current_papel() = 'comando') with check (public.current_papel() = 'comando');
create policy "avisos_delete" on public.avisos for delete to authenticated using (public.current_papel() = 'comando');

create policy "cursos_select" on public.cursos for select to authenticated using (true);
create policy "cursos_insert" on public.cursos for insert to authenticated with check (public.current_papel() = 'comando');
create policy "cursos_update" on public.cursos for update to authenticated using (public.current_papel() = 'comando') with check (public.current_papel() = 'comando');
create policy "cursos_delete" on public.cursos for delete to authenticated using (public.current_papel() = 'comando');

create policy "galeria_fotos_select" on public.galeria_fotos for select to authenticated using (true);
create policy "galeria_fotos_insert" on public.galeria_fotos for insert to authenticated with check (public.current_papel() = 'comando');
create policy "galeria_fotos_update" on public.galeria_fotos for update to authenticated using (public.current_papel() = 'comando') with check (public.current_papel() = 'comando');
create policy "galeria_fotos_delete" on public.galeria_fotos for delete to authenticated using (public.current_papel() = 'comando');

create policy "tatica_steps_select" on public.tatica_steps for select to authenticated using (true);
create policy "tatica_steps_insert" on public.tatica_steps for insert to authenticated with check (public.current_papel() = 'comando');
create policy "tatica_steps_update" on public.tatica_steps for update to authenticated using (public.current_papel() = 'comando') with check (public.current_papel() = 'comando');
create policy "tatica_steps_delete" on public.tatica_steps for delete to authenticated using (public.current_papel() = 'comando');

-- manual_secoes: leitura também liberada pra anon (rota pública /manual existe sem login), escrita só comando
create policy "manual_secoes_select_authenticated" on public.manual_secoes for select to authenticated using (true);
create policy "manual_secoes_select_anon" on public.manual_secoes for select to anon using (true);
create policy "manual_secoes_update" on public.manual_secoes for update to authenticated using (public.current_papel() = 'comando') with check (public.current_papel() = 'comando');

-- membros: leitura só comando+membro (visitante não vê, replica bloqueio de rota atual), escrita só comando
create policy "membros_select" on public.membros for select to authenticated using (public.current_papel() in ('comando', 'membro'));
create policy "membros_insert" on public.membros for insert to authenticated with check (public.current_papel() = 'comando');
create policy "membros_update" on public.membros for update to authenticated using (public.current_papel() = 'comando') with check (public.current_papel() = 'comando');
create policy "membros_delete" on public.membros for delete to authenticated using (public.current_papel() = 'comando');

-- inscricoes: insert liberado pra anon + autenticados (formulário público continua funcionando);
-- select/delete só comando+membro (replica a rota protegida de hoje); sem update (não existe edição)
create policy "inscricoes_insert_anon" on public.inscricoes for insert to anon with check (true);
create policy "inscricoes_insert_authenticated" on public.inscricoes for insert to authenticated with check (true);
create policy "inscricoes_select" on public.inscricoes for select to authenticated using (public.current_papel() in ('comando', 'membro'));
create policy "inscricoes_delete" on public.inscricoes for delete to authenticated using (public.current_papel() in ('comando', 'membro'));

-- viatura_posicoes: leitura pra autenticados; update só comando; sem insert/delete (lista fixa, só edita)
create policy "viatura_posicoes_select" on public.viatura_posicoes for select to authenticated using (true);
create policy "viatura_posicoes_update" on public.viatura_posicoes for update to authenticated using (public.current_papel() = 'comando') with check (public.current_papel() = 'comando');

-- ── Seed: mesmos dados hoje hardcoded como DEFAULT_* em cada página ────────
-- (Galeria e Inscrições começam vazias, igual hoje — Galeria porque as 6 fotos padrão
-- usam imagens locais do bundle sem URL pública estável; re-adicionar pela UI depois.)

insert into public.avisos (data, texto) values
  ('12/04/2026', 'Treinamento tático agendado para sábado 0600h.'),
  ('10/04/2026', 'Novas diretrizes de abordagem publicadas no manual.'),
  ('08/04/2026', 'Operação Tempestade Árida concluída com êxito.');

insert into public.manual_secoes (id, titulo, conteudo) values
('sobre', 'Sobre a GAMA', 'O Grupamento de Ações em Montanha e Ambiente Árido (GAMA) é uma unidade tática de elite da Polícia, especializada em operações em terrenos extremos. Criada com o objetivo de atuar em regiões montanhosas e áridas, a GAMA conta com operadores altamente treinados em sobrevivência, combate tático e resgate em condições adversas.'),
('atribuicoes', 'Atribuições', '• Operações táticas em terreno montanhoso e desértico
• Resgate de reféns em áreas remotas
• Patrulhamento e vigilância em regiões de difícil acesso
• Apoio a operações especiais de outras unidades
• Treinamento e capacitação de efetivo policial
• Escolta tática de alto risco'),
('hierarquia', 'Hierarquia', 'COMANDANTE — Oficial responsável pela unidade
SUBCOMANDANTE — Segundo em comando
CHEFE DE OPERAÇÕES — Coordena missões táticas
LÍDER DE EQUIPE — Comanda grupos operacionais
OPERADOR SÊNIOR — Experiência avançada
OPERADOR — Membro efetivo da unidade
ASPIRANTE — Em período de avaliação'),
('regras', 'Regras', '1. Obediência à cadeia de comando
2. Sigilo operacional absoluto
3. Pontualidade em todas as convocações
4. Manutenção rigorosa de equipamentos
5. Proibido uso de informações operacionais fora do sistema
6. Respeito mútuo entre todos os membros
7. Participação obrigatória em treinamentos semanais'),
('viatura', 'Sistema de Viatura', 'A GAMA opera com viaturas táticas 4x4 preparadas para terrenos extremos. Cada viatura comporta até 6 operadores com funções definidas (P1 a P6). As viaturas são equipadas com comunicação criptografada, kit de primeiros socorros avançado e armamento tático.'),
('abordagem', 'Abordagem Tática', 'O protocolo de abordagem tática segue uma sequência operacional rigorosa:

1. Reconhecimento do terreno
2. Posicionamento da equipe
3. Comunicação com central
4. Aproximação controlada
5. Contenção e neutralização
6. Verificação de segurança
7. Relatório pós-operação'),
('responsabilidades', 'Responsabilidades', 'Cada membro da GAMA carrega a responsabilidade de representar a unidade com excelência. Isso inclui: manter a forma física em nível operacional, cumprir escalas de serviço, reportar irregularidades, zelar pelo patrimônio e contribuir para a evolução constante da unidade.');

insert into public.cursos (nome, aplicador, descricao, video_url) values
('Abordagem Tática em Terreno Urbano', 'Sgt. Lucas Ferreira', 'Técnicas de abordagem controlada em ambientes urbanos, cobertura mútua e comunicação entre operadores.', ''),
('Primeiros Socorros Táticos (TCCC)', 'Sd. Maria Oliveira', 'Protocolo de atendimento médico em campo de combate, controle de hemorragia e transporte de vítimas sob pressão.', '');

insert into public.membros (nome, cargo, classe) values
('Cpt. Rodrigo Almeida', 'Comandante', 'Oficial'),
('Ten. Marcos Vieira', 'Subcomandante', 'Oficial'),
('Sgt. Lucas Ferreira', 'Chefe de Operações', 'Graduado'),
('Sgt. Ana Torres', 'Líder de Equipe Alpha', 'Graduado'),
('Cb. Pedro Santos', 'Operador Sênior', 'Graduado'),
('Cb. Rafael Mendes', 'Operador Sênior', 'Graduado'),
('Sd. João Silva', 'Operador', 'Praça'),
('Sd. Maria Oliveira', 'Operadora', 'Praça'),
('Sd. Felipe Costa', 'Operador', 'Praça'),
('Sd. Bruno Lima', 'Aspirante', 'Praça');

insert into public.viatura_posicoes (id, role, descricao, x, y) values
('P1', 'Motorista', 'Conduz a viatura, responsável por manobras táticas e posicionamento.', '15%', '50%'),
('P2', 'Navegador', 'Coordena rotas e comunicação com a central.', '30%', '35%'),
('P3', 'Atirador 1', 'Cobertura lateral direita, primeiro a desembarcar.', '55%', '30%'),
('P4', 'Atirador 2', 'Cobertura lateral esquerda, proteção de retaguarda.', '55%', '70%'),
('P5', 'Médico Tático', 'Suporte médico e primeiros socorros em campo.', '75%', '35%'),
('P6', 'Líder de Equipe', 'Comando operacional, última decisão tática.', '75%', '65%');

insert into public.tatica_steps (icon_key, titulo, descricao) values
('Eye', 'Reconhecimento', 'Análise do terreno, identificação de ameaças e pontos de entrada.'),
('MapPin', 'Posicionamento', 'Equipe se posiciona de acordo com o protocolo de formação tática.'),
('Radio', 'Comunicação', 'Contato com a central, confirmação de parâmetros operacionais.'),
('Shield', 'Aproximação', 'Avanço controlado com cobertura mútua entre os operadores.'),
('Crosshair', 'Contenção', 'Neutralização de ameaças e contenção da área operacional.'),
('CheckCircle', 'Verificação', 'Checagem de segurança, contagem de pessoal e busca no perímetro.'),
('FileText', 'Relatório', 'Documentação completa da operação e debrief com a equipe.');
