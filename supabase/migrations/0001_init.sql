-- ════════════════════════════════════════════════════════════════════
-- NEXUS · Migration inicial
-- Cria todas as tabelas com RLS ativado e policy auth.uid() = user_id.
-- Execute no SQL Editor do Supabase ou via `supabase db push`.
-- ════════════════════════════════════════════════════════════════════

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- Função utilitária para manter updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- ─────────────────────────────────────────────
-- peso_registros
-- ─────────────────────────────────────────────
create table if not exists public.peso_registros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  peso_kg numeric(5,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_peso_user_data on public.peso_registros (user_id, data);

-- ─────────────────────────────────────────────
-- treino_registros
-- ─────────────────────────────────────────────
create table if not exists public.treino_registros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  dia_semana text,
  concluido boolean not null default false,
  sem_treino boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, data)
);
create index if not exists idx_treino_user_data on public.treino_registros (user_id, data);

-- ─────────────────────────────────────────────
-- treino_series
-- ─────────────────────────────────────────────
create table if not exists public.treino_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  treino_id uuid not null references public.treino_registros(id) on delete cascade,
  exercicio text not null,
  series int,
  repeticoes text,
  carga_kg numeric(6,2),
  created_at timestamptz not null default now()
);
create index if not exists idx_series_user on public.treino_series (user_id);
create index if not exists idx_series_treino on public.treino_series (treino_id);

-- ─────────────────────────────────────────────
-- refeicoes_registros
-- ─────────────────────────────────────────────
create table if not exists public.refeicoes_registros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  refeicao text not null,
  concluida boolean not null default false,
  observacao text,
  calorias numeric(7,2),
  proteinas_g numeric(6,2),
  carboidratos_g numeric(6,2),
  fibras_g numeric(6,2),
  acucares_g numeric(6,2),
  gorduras_totais_g numeric(6,2),
  gordura_saturada_mg numeric(7,2),
  colesterol_mg numeric(7,2),
  sodio_mg numeric(7,2),
  potassio_mg numeric(7,2),
  created_at timestamptz not null default now(),
  unique (user_id, data, refeicao)
);
create index if not exists idx_refeicoes_user_data on public.refeicoes_registros (user_id, data);

-- ─────────────────────────────────────────────
-- suplementacao
-- ─────────────────────────────────────────────
create table if not exists public.suplementacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  whey boolean not null default false,
  creatina boolean not null default false,
  estoque_whey_doses int,
  estoque_creatina_dias int,
  created_at timestamptz not null default now(),
  unique (user_id, data)
);
create index if not exists idx_suplementacao_user_data on public.suplementacao (user_id, data);

-- ─────────────────────────────────────────────
-- gastos
-- ─────────────────────────────────────────────
create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  descricao text,
  valor numeric(10,2) not null,
  categoria text,
  origem text,
  parcelado boolean not null default false,
  num_parcelas int,
  parcela_atual int,
  gasto_pai_id uuid references public.gastos(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_gastos_user_data on public.gastos (user_id, data);

-- ─────────────────────────────────────────────
-- entradas
-- ─────────────────────────────────────────────
create table if not exists public.entradas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  descricao text,
  valor numeric(10,2) not null,
  tipo text,
  destino text,
  created_at timestamptz not null default now()
);
create index if not exists idx_entradas_user_data on public.entradas (user_id, data);

-- ─────────────────────────────────────────────
-- saldo_conta
-- ─────────────────────────────────────────────
create table if not exists public.saldo_conta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  saldo numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_saldo_conta_user_data on public.saldo_conta (user_id, data);

-- ─────────────────────────────────────────────
-- saldo_vr
-- ─────────────────────────────────────────────
create table if not exists public.saldo_vr (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mes int not null,
  ano int not null,
  saldo_inicial numeric(8,2),
  saldo_atual numeric(8,2),
  created_at timestamptz not null default now(),
  unique (user_id, mes, ano)
);

-- ─────────────────────────────────────────────
-- transferencias_vr
-- ─────────────────────────────────────────────
create table if not exists public.transferencias_vr (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  valor_bruto numeric(8,2) not null,
  taxa numeric(6,2) not null,
  valor_liquido numeric(8,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_transf_vr_user_data on public.transferencias_vr (user_id, data);

-- ─────────────────────────────────────────────
-- investimentos_aportes
-- ─────────────────────────────────────────────
create table if not exists public.investimentos_aportes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  destino text,
  valor numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_aportes_user_data on public.investimentos_aportes (user_id, data);

-- ─────────────────────────────────────────────
-- investimentos_saldos
-- ─────────────────────────────────────────────
create table if not exists public.investimentos_saldos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  reserva_emergencia numeric(10,2),
  fundo_casamento numeric(10,2),
  fiis numeric(10,2),
  created_at timestamptz not null default now()
);
create index if not exists idx_inv_saldos_user_data on public.investimentos_saldos (user_id, data);

-- ─────────────────────────────────────────────
-- proventos
-- ─────────────────────────────────────────────
create table if not exists public.proventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  origem text,
  valor numeric(8,2),
  projetado numeric(8,2),
  created_at timestamptz not null default now()
);
create index if not exists idx_proventos_user_data on public.proventos (user_id, data);

-- ─────────────────────────────────────────────
-- fornecedores_casamento
-- ─────────────────────────────────────────────
create table if not exists public.fornecedores_casamento (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text,
  servico text,
  valor_total numeric(10,2),
  valor_pago numeric(10,2) default 0,
  data_vencimento date,
  status text default 'pendente',
  created_at timestamptz not null default now()
);
create index if not exists idx_fornecedores_user on public.fornecedores_casamento (user_id);

-- ─────────────────────────────────────────────
-- configuracoes
-- ─────────────────────────────────────────────
create table if not exists public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data_casamento date default '2028-06-01',
  cdi_atual numeric(5,4) default 0.1225,
  tetos_categoria jsonb,
  estoque_whey_doses int,
  estoque_creatina_dias int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
drop trigger if exists trg_config_updated_at on public.configuracoes;
create trigger trg_config_updated_at
  before update on public.configuracoes
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- dias_sem_gasto
-- ─────────────────────────────────────────────
create table if not exists public.dias_sem_gasto (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  confirmado boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, data)
);

-- ════════════════════════════════════════════════════════════════════
-- RLS · ativa em todas as tabelas + policy auth.uid() = user_id
-- ════════════════════════════════════════════════════════════════════
do $$
declare
  t text;
  tabelas text[] := array[
    'profiles','peso_registros','treino_registros','treino_series',
    'refeicoes_registros','suplementacao','gastos','entradas','saldo_conta',
    'saldo_vr','transferencias_vr','investimentos_aportes','investimentos_saldos',
    'proventos','fornecedores_casamento','configuracoes','dias_sem_gasto'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table public.%I enable row level security;', t);

    -- SELECT
    execute format($f$
      drop policy if exists "%1$s_select" on public.%1$I;
      create policy "%1$s_select" on public.%1$I
        for select using (auth.uid() = user_id);
    $f$, t);

    -- INSERT
    execute format($f$
      drop policy if exists "%1$s_insert" on public.%1$I;
      create policy "%1$s_insert" on public.%1$I
        for insert with check (auth.uid() = user_id);
    $f$, t);

    -- UPDATE
    execute format($f$
      drop policy if exists "%1$s_update" on public.%1$I;
      create policy "%1$s_update" on public.%1$I
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
    $f$, t);

    -- DELETE
    execute format($f$
      drop policy if exists "%1$s_delete" on public.%1$I;
      create policy "%1$s_delete" on public.%1$I
        for delete using (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- Cria automaticamente um profile + configuracoes ao registrar usuário
-- ════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;

  insert into public.configuracoes (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
