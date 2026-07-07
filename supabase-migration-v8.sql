-- Armazena reunião Zoom vinculada à aula
alter table classes
  add column if not exists zoom_meeting_id text,
  add column if not exists zoom_join_url   text;
