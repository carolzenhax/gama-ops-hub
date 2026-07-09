-- GAMA Ops Hub — visitante ganha acesso a Membros (leitura) e Galeria (já tinha);
-- comando ganha permissão de apagar álbuns da Galeria.

-- Membros: agora qualquer autenticado pode ler (visitante incluso).
-- "Ver Detalhes" (passaporte/patente/checklist) continua restrito na UI a comando+membro.
drop policy "membros_select" on public.membros;
create policy "membros_select" on public.membros
  for select to authenticated
  using (true);

-- Álbuns da Galeria: comando pode apagar (diferente das outras listas de lookup,
-- que são só-criação por design — aqui faz sentido poder limpar álbum indesejado).
create policy "galeria_albuns_delete" on public.galeria_albuns
  for delete to authenticated
  using (public.current_papel() = 'comando');

-- Ao apagar um álbum, as fotos dele não somem — ficam em "Sem Álbum" (já suportado na UI).
alter table public.galeria_fotos drop constraint galeria_fotos_album_id_fkey;
alter table public.galeria_fotos
  add constraint galeria_fotos_album_id_fkey foreign key (album_id) references public.galeria_albuns(id) on delete set null;
