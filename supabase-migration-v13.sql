-- Taxas de repasse por nível de ensino
create table if not exists teacher_rates (
  id         uuid primary key default gen_random_uuid(),
  level      text not null unique,  -- fundamental, medio, superior, internacional
  rate_brl   numeric(10,2) not null default 0,
  updated_at timestamptz default now()
);

-- Insere taxas padrão (R$ 0) se ainda não existirem
insert into teacher_rates (level, rate_brl)
values
  ('fundamental',   0),
  ('medio',         0),
  ('superior',      0),
  ('internacional', 0)
on conflict (level) do nothing;

-- Repasses mensais aos professores
create table if not exists teacher_payouts (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references professors(id) on delete cascade,
  period_month int  not null,   -- 1-12
  period_year  int  not null,
  total_classes int not null default 0,
  amount_brl   numeric(10,2) not null default 0,
  status       text not null default 'pendente',  -- pendente | pago
  paid_at      timestamptz,
  created_at   timestamptz default now(),
  unique (teacher_id, period_month, period_year)
);

-- RLS: professores não acessam diretamente (usamos service role no portal)
alter table teacher_rates   enable row level security;
alter table teacher_payouts enable row level security;

-- Admin (usuários autenticados Supabase) pode tudo
create policy "admin_all_rates"   on teacher_rates   for all using (auth.role() = 'authenticated');
create policy "admin_all_payouts" on teacher_payouts for all using (auth.role() = 'authenticated');
