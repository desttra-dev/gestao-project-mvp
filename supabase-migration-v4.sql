-- Adiciona coluna subject na tabela classes
alter table classes
  add column if not exists subject text;

alter table classes
  drop constraint if exists classes_subject_check;

alter table classes
  add constraint classes_subject_check
  check (
    subject is null or subject in (
      'matematica','fisica','quimica','portugues',
      'historia','geografia','filosofia','redacao','sociologia'
    )
  );
