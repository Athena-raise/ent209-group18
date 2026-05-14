alter table public.users add column if not exists age integer;
alter table public.users add column if not exists biological_sex text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_biological_sex_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_biological_sex_check
      check (biological_sex is null or biological_sex in ('female', 'male'));
  end if;
end $$;

notify pgrst, 'reload schema';
