-- =============================================
-- MIGRAÇÃO V2 — Execute no Supabase SQL Editor
-- =============================================

-- 1. Novos campos em students
alter table students
  add column if not exists status text not null default 'ativo'
    check (status in ('ativo', 'suspenso', 'cancelado', 'experimento')),
  add column if not exists responsible_name  text,
  add column if not exists responsible_phone text,
  add column if not exists responsible_email text,
  add column if not exists follow_up text not null default 'none'
    check (follow_up in ('none','next_week','jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez')),
  add column if not exists follow_up_notes text;

-- Sincroniza status com o campo active existente
update students set status = case when active = true then 'ativo' else 'cancelado' end;

-- 2. Tabela de lançamentos financeiros
create table if not exists financial_transactions (
  id               uuid primary key default gen_random_uuid(),
  type             text not null check (type in ('entrada', 'saida')),
  amount           numeric(10,2) not null,
  currency         text not null check (currency in ('BRL', 'EUR')),
  transaction_date date not null default current_date,
  description      text not null,
  student_id       uuid references students(id),
  responsible_name text,
  professor_id     uuid references professors(id),
  category         text check (category in ('mensalidade','avulsa','repasse','material','software','taxa','outros')),
  notes            text,
  created_at       timestamptz not null default now()
);

-- RLS
alter table financial_transactions enable row level security;
create policy "Authenticated users only" on financial_transactions
  for all using (auth.role() = 'authenticated');
