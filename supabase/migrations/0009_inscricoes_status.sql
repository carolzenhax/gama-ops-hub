-- GAMA Ops Hub — status aberto/fechado das Inscrições, controlável por comando
-- Tabela genérica de configurações (chave/valor), começa só com essa entrada.

create table public.configuracoes (
  chave text primary key,
  valor text not null
);

insert into public.configuracoes (chave, valor) values ('inscricoes_abertas', 'true');

alter table public.configuracoes enable row level security;

-- Leitura pública: a página /inscricoes é acessível sem login, então até quem
-- não está autenticado precisa saber se as inscrições estão abertas ou fechadas.
create policy "configuracoes_select_anon" on public.configuracoes
  for select to anon
  using (true);

create policy "configuracoes_select_authenticated" on public.configuracoes
  for select to authenticated
  using (true);

-- Escrita: só comando.
create policy "configuracoes_update" on public.configuracoes
  for update to authenticated
  using (public.current_papel() = 'comando')
  with check (public.current_papel() = 'comando');
