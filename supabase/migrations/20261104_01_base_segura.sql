-- SCC Produção — etapa 3: base inicial protegida.
-- Execute uma única vez em um projeto Supabase DE DESENVOLVIMENTO vazio.
-- Guarde este arquivo versionado no Git. Não contém dados reais nem segredos.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.papel_usuario as enum ('admin', 'editor', 'leitor');
create type public.status_grade as enum (
  'em_utilizacao', 'fora_da_grade', 'aguardando_entrada', 'removido'
);
create type public.status_producao as enum (
  'em_dia', 'precisa_atualizar', 'precisa_gravar',
  'em_producao', 'aguardando_aprovacao', 'pronto_para_envio'
);

grant usage on type public.papel_usuario, public.status_grade, public.status_producao to authenticated;

create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  papel public.papel_usuario not null default 'leitor',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.secoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 100),
  nome_normalizado text generated always as (lower(btrim(nome))) stored unique,
  criado_por uuid not null default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now()
);

create table public.materiais (
  id uuid primary key default gen_random_uuid(),
  secao_id uuid not null references public.secoes(id) on delete restrict,
  codigo text not null check (codigo ~ '^[A-Za-z0-9._-]{1,20}$'),
  titulo text not null check (char_length(btrim(titulo)) between 2 and 180),
  duracao_segundos integer not null check (duracao_segundos between 1 and 36000),
  status_grade public.status_grade not null default 'aguardando_entrada',
  status_producao public.status_producao not null default 'precisa_gravar',
  link_externo text check (
    link_externo is null or
    (char_length(link_externo) <= 2048 and link_externo ~* '^https://[^[:space:]]+$')
  ),
  observacoes text check (observacoes is null or char_length(observacoes) <= 4000),
  criado_por uuid not null default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (secao_id, codigo)
);

create index idx_materiais_secao on public.materiais (secao_id);
create index idx_materiais_status_producao on public.materiais (status_producao);
create index idx_materiais_status_grade on public.materiais (status_grade);

create table public.historico_materiais (
  id bigint generated always as identity primary key,
  material_id uuid not null references public.materiais(id) on delete restrict,
  acao text not null check (acao in ('criado', 'atualizado')),
  usuario_id uuid references auth.users(id),
  antes jsonb,
  depois jsonb not null,
  ocorrido_em timestamptz not null default now()
);
create index idx_historico_material on public.historico_materiais (material_id, ocorrido_em desc);

-- Trigger de perfil: contas novas começam como leitores; NUNCA admin por padrão.
create function private.criar_perfil_usuario()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''),
             split_part(coalesce(new.email, ''), '@', 1))
  );
  return new;
end;
$$;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function private.criar_perfil_usuario();

-- Contas criadas antes desta migração também recebem perfil leitor.
insert into public.perfis (id, nome)
select id, split_part(coalesce(email, ''), '@', 1) from auth.users
on conflict (id) do nothing;

-- Função de autorização com privilégio controlado (evita RLS recursiva).
create function private.papel_atual()
returns public.papel_usuario
language sql stable security definer set search_path = ''
as $$
  select p.papel from public.perfis p
  where p.id = (select auth.uid()) and p.ativo = true
  limit 1;
$$;

-- Atualização de data e auditoria feitas pelo banco, nunca pelo navegador.
create function private.atualizar_data_material()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;
create trigger antes_editar_material
  before update on public.materiais
  for each row execute function private.atualizar_data_material();

create function private.auditar_material()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.historico_materiais
    (material_id, acao, usuario_id, antes, depois)
  values (
    new.id,
    case when tg_op = 'INSERT' then 'criado' else 'atualizado' end,
    auth.uid(),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new)
  );
  return new;
end;
$$;
create trigger depois_gravar_material
  after insert or update on public.materiais
  for each row execute function private.auditar_material();

-- Bloqueio explícito para acessos anônimos e concessão mínima por tabela.
alter table public.perfis enable row level security;
alter table public.secoes enable row level security;
alter table public.materiais enable row level security;
alter table public.historico_materiais enable row level security;

revoke all on table public.perfis, public.secoes,
  public.materiais, public.historico_materiais from anon, authenticated;

grant select on public.perfis to authenticated;
grant select, insert on public.secoes to authenticated;
grant update (nome) on public.secoes to authenticated;
grant select, insert on public.materiais to authenticated;
grant update (titulo, duracao_segundos, status_grade, status_producao,
  link_externo, observacoes) on public.materiais to authenticated;
grant select on public.historico_materiais to authenticated;

revoke all on function private.criar_perfil_usuario(),
  private.papel_atual(), private.atualizar_data_material(),
  private.auditar_material() from public, anon, authenticated;
grant execute on function private.papel_atual() to authenticated;

create policy perfis_ler_proprio_ou_admin on public.perfis
for select to authenticated
using (
  id = (select auth.uid())
  or (select private.papel_atual()) = 'admin'
);

create policy secoes_ler on public.secoes
for select to authenticated
using ((select private.papel_atual()) is not null);

create policy secoes_criar on public.secoes
for insert to authenticated
with check (
  (select private.papel_atual()) = 'admin'
  and criado_por = (select auth.uid())
);

create policy secoes_editar on public.secoes
for update to authenticated
using ((select private.papel_atual()) = 'admin')
with check ((select private.papel_atual()) = 'admin');

create policy materiais_ler on public.materiais
for select to authenticated
using ((select private.papel_atual()) is not null);

create policy materiais_criar on public.materiais
for insert to authenticated
with check (
  (select private.papel_atual()) in ('admin', 'editor')
  and criado_por = (select auth.uid())
);

create policy materiais_editar on public.materiais
for update to authenticated
using ((select private.papel_atual()) in ('admin', 'editor'))
with check ((select private.papel_atual()) in ('admin', 'editor'));

create policy historico_ler on public.historico_materiais
for select to authenticated
using ((select private.papel_atual()) is not null);

-- Sem políticas/grants de DELETE: material é removido da grade via status,
-- não destruído fisicamente. Histórico é somente leitura para clientes.
