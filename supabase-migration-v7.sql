-- Liga aulas recorrentes em uma série
alter table classes
  add column if not exists series_id uuid;

create index if not exists classes_series_id_idx on classes(series_id);
