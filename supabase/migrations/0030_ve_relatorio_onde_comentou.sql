-- GAMA Ops Hub — quem comentou num relatório passa a poder ver o relatório (só o
-- próprio comentário, os de outros continuam escondidos - policy separada). Sem
-- isso, quem comentou mas depois saiu do roster (ou nunca foi vinculado a um
-- membro) perdia acesso ao relatório inteiro e, com isso, ao próprio comentário
-- também - a policy "autor vê o próprio comentário" (0029) não bastava porque o
-- relatório em si (a linha em operacoes) já ficava invisível antes de chegar lá.

create or replace function public.pode_ver_operacao(op_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.operacoes o
    where o.id = op_id
    and (
      public.current_papel() = 'comando'
      or o.criado_por = auth.uid()
      or exists (
        select 1 from public.operacoes_participantes p
        join public.profiles pr on pr.membro_id = p.membro_id
        where p.operacao_id = o.id and pr.id = auth.uid()
      )
      or exists (
        select 1 from public.operacoes_comandos c
        join public.profiles pr on pr.membro_id = c.membro_id
        where c.operacao_id = o.id and pr.id = auth.uid()
      )
      or exists (
        select 1 from public.operacoes_observacoes ob
        where ob.operacao_id = o.id and ob.autor_id = auth.uid()
      )
    )
  );
$$;
