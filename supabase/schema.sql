create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  email_verified_at timestamptz,
  height integer,
  weight integer,
  age integer,
  biological_sex text,
  target_weight integer,
  goal text,
  activity_level text,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.users add column if not exists age integer;
alter table public.users add column if not exists biological_sex text;

alter table public.users alter column height drop not null;
alter table public.users alter column weight drop not null;
alter table public.users alter column age drop not null;
alter table public.users alter column biological_sex drop not null;
alter table public.users alter column target_weight drop not null;
alter table public.users alter column goal drop not null;
alter table public.users alter column activity_level drop not null;

alter table public.users alter column height drop default;
alter table public.users alter column weight drop default;
alter table public.users alter column age drop default;
alter table public.users alter column biological_sex drop default;
alter table public.users alter column target_weight drop default;
alter table public.users alter column goal drop default;
alter table public.users alter column activity_level drop default;

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

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_tokens_token_hash
  on public.password_reset_tokens(token_hash);

create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_verification_codes_user_id
  on public.email_verification_codes(user_id);

create index if not exists idx_email_verification_codes_code_hash
  on public.email_verification_codes(code_hash);

alter table public.users enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.email_verification_codes enable row level security;
