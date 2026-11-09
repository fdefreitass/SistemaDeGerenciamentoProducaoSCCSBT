-- SCC Produção | Migração 02 - edição completa e exclusão auditável.
-- IMPORTANTE: execute somente após backup e revisão no Supabase SQL Editor.
-- Sem execução automática no banco por este commit.
--
-- 1. Editor/admin podem alterar código e seção, sempre sob RLS já existente.
-- 2. Exclusão permanente é exclusiva do administrador ativo.
-- 3. Histórico original mantém material_id, timestamps e snapshots.
-- Aplicar apenas com backup verificado: a exclusão física não possui desfazer.

begin;

grant update (codigo, secao_id) on public.materiais to authenticated;

-- A restrição original impedia exclusões para preservar o histórico.
-- O histórico conserva o UUID original mesmo depois da exclusão.
-- Removemos a FK que impedia a operação, mas NÃO anulamos material_id.
-- O snapshot completo do material permanece em 'antes' na linha de exclusão.
alter table public.historico_materiais
  alter column depois drop not null;

alter table public.historico_materiais
  drop constraint if exists historico_materiais_material_id_fkey;

alter table public.historico_materiais
  drop constraint if exists historico_materiais_acao_check;

alter table public.historico_materiais
  add constraint historico_materiais_acao_check
  check (acao in ('criado', 'atualizado', 'excluido'));

-- Registra quem excluiu, quando e qual era o estado completo do material.
create or replace function private.auditar_exclusao_material()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.historico_materiais
    (material_id, acao, usuario_id, antes, depois)
  values
    (old.id, 'excluido', auth.uid(), to_jsonb(old), null);
  return old;
end;
$$;

revoke all on function private.auditar_exclusao_material()
  from public, anon, authenticated;

drop trigger if exists depois_excluir_material on public.materiais;

create trigger depois_excluir_material
  after delete on public.materiais
  for each row execute function private.auditar_exclusao_material();

grant delete on public.materiais to authenticated;

drop policy if exists materiais_excluir on public.materiais;
create policy materiais_excluir on public.materiais
for delete to authenticated
using ((select private.papel_atual()) = 'admin');

commit;

-- Confira a política depois de aplicar:
-- select policyname, cmd from pg_policies
-- where schemaname = 'public' and tablename = 'materiais';
