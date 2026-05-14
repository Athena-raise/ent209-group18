alter table public.users alter column height drop not null;
alter table public.users alter column weight drop not null;
alter table public.users alter column target_weight drop not null;
alter table public.users alter column goal drop not null;
alter table public.users alter column activity_level drop not null;

alter table public.users alter column height drop default;
alter table public.users alter column weight drop default;
alter table public.users alter column target_weight drop default;
alter table public.users alter column goal drop default;
alter table public.users alter column activity_level drop default;
