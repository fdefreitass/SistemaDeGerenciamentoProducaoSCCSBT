-- SCC Produção: convites de ativação com prova de posse e expiração.
-- Nunca guardar token de convite em texto puro. Apenas SHA-256.
begin;
create table if not exists public.convites_ativacao (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  token_sha256 text not null check (token_sha256 ~ '^[0-9a-f]{64}$'),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null
);
alter table public.convites_ativacao enable row level security;
revoke all on public.convites_ativacao from public, anon, authenticated;
-- service_role utiliza a tabela exclusivamente no backend administrativo.
grant select, insert, update, delete on public.convites_ativacao to service_role;
commit;