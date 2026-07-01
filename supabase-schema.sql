-- =============================================
-- DESTTRA EDUCAÇÃO — Schema do Banco de Dados
-- Execute no Supabase SQL Editor
-- =============================================

-- Professores
create table professors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  bank_info text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Alunos
create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  country text not null check (country in ('BR', 'EU')),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Planos / Pacotes
create table plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  country text not null check (country in ('BR', 'EU')),
  currency text not null check (currency in ('BRL', 'EUR')),
  price numeric(10,2) not null,
  classes_per_month integer,
  type text not null check (type in ('avulsa', 'weekly_1x', 'weekly_2x', 'weekly_3x', 'custom')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Taxas de repasse por nível
create table teacher_rates (
  id uuid primary key default gen_random_uuid(),
  level text not null unique check (level in ('fundamental', 'medio', 'superior', 'internacional')),
  rate_brl numeric(10,2) not null,
  updated_at timestamptz not null default now()
);

-- Matrículas (aluno vinculado a um plano + professor)
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id),
  plan_id uuid not null references plans(id),
  teacher_id uuid not null references professors(id),
  start_date date not null default current_date,
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'cancelado')),
  custom_price numeric(10,2),
  custom_description text,
  created_at timestamptz not null default now()
);

-- Aulas
create table classes (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references enrollments(id),
  student_id uuid not null references students(id),
  teacher_id uuid not null references professors(id),
  scheduled_at timestamptz not null,
  level text not null check (level in ('fundamental', 'medio', 'superior', 'internacional')),
  status text not null default 'agendada' check (status in ('agendada', 'realizada', 'cancelada')),
  notes text,
  created_at timestamptz not null default now()
);

-- Cobranças (pagamentos dos alunos)
create table charges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id),
  enrollment_id uuid references enrollments(id),
  amount numeric(10,2) not null,
  currency text not null check (currency in ('BRL', 'EUR')),
  due_date date not null,
  period_reference text not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  payment_method text check (payment_method in ('pix', 'iban', 'wise', 'cora')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- Repasses para professores
create table teacher_payouts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references professors(id),
  period_month integer not null check (period_month between 1 and 12),
  period_year integer not null,
  total_classes integer not null default 0,
  amount_brl numeric(10,2) not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique(teacher_id, period_month, period_year)
);

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Taxas de repasse iniciais
insert into teacher_rates (level, rate_brl) values
  ('fundamental', 40.00),
  ('medio', 45.00),
  ('superior', 50.00),
  ('internacional', 50.00);

-- Planos Brasil
insert into plans (name, country, currency, price, classes_per_month, type) values
  ('Aula Avulsa Brasil', 'BR', 'BRL', 110.00, 1, 'avulsa'),
  ('Pacote 1x/semana Brasil', 'BR', 'BRL', 340.00, 4, 'weekly_1x'),
  ('Pacote 2x/semana Brasil', 'BR', 'BRL', 640.00, 8, 'weekly_2x'),
  ('Pacote 3x/semana Brasil', 'BR', 'BRL', 900.00, 12, 'weekly_3x');

-- Planos Europa
insert into plans (name, country, currency, price, classes_per_month, type) values
  ('Aula Avulsa Europa', 'EU', 'EUR', 20.00, 1, 'avulsa'),
  ('Pacote 1x/semana Europa', 'EU', 'EUR', 90.00, 4, 'weekly_1x'),
  ('Pacote 2x/semana Europa', 'EU', 'EUR', 150.00, 8, 'weekly_2x');

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Protege os dados — só usuários autenticados acessam
-- =============================================

alter table professors enable row level security;
alter table students enable row level security;
alter table plans enable row level security;
alter table teacher_rates enable row level security;
alter table enrollments enable row level security;
alter table classes enable row level security;
alter table charges enable row level security;
alter table teacher_payouts enable row level security;

create policy "Authenticated users only" on professors for all using (auth.role() = 'authenticated');
create policy "Authenticated users only" on students for all using (auth.role() = 'authenticated');
create policy "Authenticated users only" on plans for all using (auth.role() = 'authenticated');
create policy "Authenticated users only" on teacher_rates for all using (auth.role() = 'authenticated');
create policy "Authenticated users only" on enrollments for all using (auth.role() = 'authenticated');
create policy "Authenticated users only" on classes for all using (auth.role() = 'authenticated');
create policy "Authenticated users only" on charges for all using (auth.role() = 'authenticated');
create policy "Authenticated users only" on teacher_payouts for all using (auth.role() = 'authenticated');
