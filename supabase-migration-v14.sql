-- Avisos da gestão para professores
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  active     boolean not null default true,
  pinned     boolean not null default false,  -- aviso fixado no topo
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table announcements enable row level security;

-- Admin (autenticado via Supabase) pode tudo
create policy "admin_all_announcements"
  on announcements for all using (auth.role() = 'authenticated');
