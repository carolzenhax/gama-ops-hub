-- GAMA Ops Hub — álbuns de Galeria editáveis (em vez de 4 categorias fixas no código)

create table public.galeria_albuns (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

alter table public.galeria_albuns enable row level security;

create policy "galeria_albuns_select" on public.galeria_albuns
  for select to authenticated
  using (true);

create policy "galeria_albuns_insert" on public.galeria_albuns
  for insert to authenticated
  with check (public.current_papel() = 'comando');

-- Semeia com as 4 categorias que já existiam fixas no código.
insert into public.galeria_albuns (nome) values ('Operações'), ('Treinamentos'), ('Viaturas'), ('Equipe');

alter table public.galeria_fotos add column album_id uuid references public.galeria_albuns(id);

update public.galeria_fotos gf
set album_id = ga.id
from public.galeria_albuns ga
where gf.categoria = ga.nome;

alter table public.galeria_fotos drop column categoria;
