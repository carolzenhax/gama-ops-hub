-- GAMA Ops Hub — permite criar um membro novo direto no campo "Participantes"
-- do formulário de Operações (igual já acontecia em Gangue). Só em Participantes,
-- não em "Comando da Ação" — pode ter gente comandando a ação que não é da GAMA.
-- Quem cria por esse atalho entra provisoriamente como "Estágio"; comando ajusta
-- depois pela página Membros.

drop policy "membros_insert" on public.membros;
create policy "membros_insert" on public.membros
  for insert to authenticated
  with check (public.current_papel() in ('comando', 'membro'));
