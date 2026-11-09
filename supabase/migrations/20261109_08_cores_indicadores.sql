-- Paleta compartilhada dos indicadores da Central de Materiais.
-- Alteração exclusiva de administradores; leitura permitida a usuários ativos.
begin;
create table if not exists public.cores_indicadores (
  indicador text primary key check (indicador in ('total','em_utilizacao','precisa_atualizar','precisa_gravar')),
  cor_hex text not null check (cor_hex ~ '^#[0-9a-fA-F]{6}$')
);
insert into public.cores_indicadores (indicador,cor_hex) values
 ('total','#E2FA00'),
 ('em_utilizacao','#36D6AD'),
 ('precisa_atualizar','#B598FF'),
 ('precisa_gravar','#FF9A60')
on conflict (indicador) do nothing;

alter table public.cores_indicadores enable row level security;
revoke all on public.cores_indicadores from public, anon, authenticated;
grant select on public.cores_indicadores to authenticated;
grant update (cor_hex) on public.cores_indicadores to authenticated;

drop policy if exists indicadores_ler on public.cores_indicadores;
create policy indicadores_ler on public.cores_indicadores
  for select to authenticated
  using ((select private.papel_atual()) is not null);

drop policy if exists indicadores_admin_atualizar on public.cores_indicadores;
create policy indicadores_admin_atualizar on public.cores_indicadores
  for update to authenticated
  using ((select private.papel_atual()) = 'admin'::public.papel_usuario)
  with check ((select private.papel_atual()) = 'admin'::public.papel_usuario);
commit;