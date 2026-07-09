-- GAMA Ops Hub — nova página "Sobre o Grupamento": História e Como Começou
-- (texto + foto, editável só por comando, igual Manual) e Honraria (lista de
-- homenagens com foto + texto, comando adiciona/edita/remove quantas quiser).

create table public.sobre_secoes (
  id text primary key,
  titulo text not null,
  conteudo text not null default '',
  foto_url text
);

insert into public.sobre_secoes (id, titulo, conteudo) values
  ('historia', 'História', ''),
  ('como_comecou', 'Como Começou', '');

alter table public.sobre_secoes enable row level security;

create policy "sobre_secoes_select" on public.sobre_secoes for select to authenticated using (true);
create policy "sobre_secoes_update" on public.sobre_secoes for update to authenticated using (public.current_papel() = 'comando') with check (public.current_papel() = 'comando');

create table public.honrarias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  foto_url text,
  texto text not null default '',
  created_at timestamptz not null default now()
);

alter table public.honrarias enable row level security;

create policy "honrarias_select" on public.honrarias for select to authenticated using (true);
create policy "honrarias_insert" on public.honrarias for insert to authenticated with check (public.current_papel() = 'comando');
create policy "honrarias_update" on public.honrarias for update to authenticated using (public.current_papel() = 'comando') with check (public.current_papel() = 'comando');
create policy "honrarias_delete" on public.honrarias for delete to authenticated using (public.current_papel() = 'comando');
