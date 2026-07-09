-- GAMA Ops Hub — comando pode renomear álbuns da Galeria
-- (fotos já tinham policy de update desde a migration 0001; só faltava álbum)

create policy "galeria_albuns_update" on public.galeria_albuns
  for update to authenticated
  using (public.current_papel() = 'comando')
  with check (public.current_papel() = 'comando');
