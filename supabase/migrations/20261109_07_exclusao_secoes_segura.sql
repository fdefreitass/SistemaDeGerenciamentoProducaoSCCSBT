-- SCC Produção | Exclusão de seções com transferência atômica de materiais.
-- Não remove materiais. Os históricos de alterações permanecem preservados.
-- Somente administradores ativos podem executar, via RLS e verificação explícita.

begin;

grant delete on public.secoes to authenticated;

drop policy if exists secoes_excluir_admin on public.secoes;
create policy secoes_excluir_admin on public.secoes
  for delete to authenticated
  using ((select private.papel_atual()) = 'admin'::public.papel_usuario);

create or replace function public.remover_secao_segura(
  p_secao_id uuid,
  p_destino_id uuid default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_nome text;
  v_destino text;
  v_quantidade integer;
  v_transferidos integer := 0;
begin
  if (select private.papel_atual()) is distinct from 'admin'::public.papel_usuario then
    raise exception 'Somente administradores podem excluir seções.'
      using errcode = '42501';
  end if;

  if p_secao_id is null or p_destino_id = p_secao_id then
    raise exception 'Selecione uma seção de origem válida e um destino diferente.'
      using errcode = '22023';
  end if;

  -- FOR UPDATE impede inserções concorrentes na origem durante a transferência,
  -- pois a FK do material obtém um lock de chave na seção de origem.
  select nome into v_nome from public.secoes where id = p_secao_id for update;
  if not found then
    raise exception 'Seção não encontrada.' using errcode = 'P0002';
  end if;

  if p_destino_id is not null then
    select nome into v_destino from public.secoes where id = p_destino_id for key share;
    if not found then
      raise exception 'Seção de destino não encontrada.' using errcode = 'P0002';
    end if;
  end if;

  select count(*) into v_quantidade from public.materiais where secao_id = p_secao_id;

  if v_quantidade > 0 and p_destino_id is null then
    raise exception 'Esta seção contém materiais. Selecione a seção de destino antes de excluir.'
      using errcode = '23503';
  end if;

  if v_quantidade > 0 then
    if exists (
      select 1 from public.materiais origem
      join public.materiais destino
        on destino.secao_id = p_destino_id and destino.codigo = origem.codigo
      where origem.secao_id = p_secao_id
    ) then
      raise exception 'Existem códigos iguais na seção de destino. Renomeie os códigos antes de transferir.'
        using errcode = '23505';
    end if;

    update public.materiais
      set secao_id = p_destino_id
      where secao_id = p_secao_id;
    get diagnostics v_transferidos = row_count;
    if v_transferidos <> v_quantidade then
      raise exception 'Não foi possível transferir todos os materiais. Nenhuma mudança foi salva.'
        using errcode = '40001';
    end if;
  end if;

  delete from public.secoes where id = p_secao_id;
  if not found then
    raise exception 'A seção não pôde ser excluída.' using errcode = '42501';
  end if;

  return v_transferidos;
end;
$$;

revoke all on function public.remover_secao_segura(uuid,uuid) from public, anon;
grant execute on function public.remover_secao_segura(uuid,uuid) to authenticated;

comment on function public.remover_secao_segura(uuid,uuid) is
  'Exclusão administrativa de seção, transferindo materiais numa transação única e sem perda de histórico.';

commit;
