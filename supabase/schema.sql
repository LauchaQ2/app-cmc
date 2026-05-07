-- CMC Turnos schema for Supabase Postgres
create extension if not exists "uuid-ossp";
create extension if not exists btree_gist;

create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  email text,
  notes text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.employees (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  active boolean not null default true,
  work_start_time time not null default '09:00',
  work_end_time time not null default '18:00',
  work_days text[] not null default array['lunes','martes','miercoles','jueves','viernes'],
  created_at timestamp with time zone not null default now()
);

create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  duration_minutes integer not null check (duration_minutes >= 15 and duration_minutes % 15 = 0),
  price numeric(10,2) not null default 0,
  description text,
  active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.employee_services (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  unique (employee_id, service_id)
);

create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id),
  employee_id uuid not null references public.employees(id),
  service_id uuid not null references public.services(id),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pendiente' check (status in ('pendiente','confirmado','completado','cancelado')),
  payment_status text not null default 'pendiente' check (payment_status in ('pendiente','pagado')),
  amount numeric(10,2) not null default 0,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  check (start_time < end_time)
);

create index if not exists idx_appointments_employee_date on public.appointments (employee_id, appointment_date);
create index if not exists idx_appointments_status on public.appointments (status);

-- Prevent overlapping appointments for the same employee while active
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    employee_id with =,
    tsrange(
      (appointment_date + start_time)::timestamp,
      (appointment_date + end_time)::timestamp,
      '[)'
    ) with &&
  ) where (status <> 'cancelado');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create or replace function public.set_appointment_end_time()
returns trigger
language plpgsql
as $$
declare
  service_duration int;
begin
  select duration_minutes into service_duration from public.services where id = new.service_id;
  if service_duration is null then
    raise exception 'Servicio no encontrado para calcular end_time';
  end if;

  new.end_time = (new.start_time + make_interval(mins => service_duration))::time;
  return new;
end;
$$;

drop trigger if exists trg_set_end_time on public.appointments;
create trigger trg_set_end_time
before insert or update of service_id, start_time
on public.appointments
for each row execute function public.set_appointment_end_time();

alter table public.clients enable row level security;
alter table public.employees enable row level security;
alter table public.services enable row level security;
alter table public.employee_services enable row level security;
alter table public.appointments enable row level security;

-- Basic policies for authenticated users (adapt to roles in production)
drop policy if exists "authenticated can read clients" on public.clients;
create policy "authenticated can read clients" on public.clients for select to authenticated using (true);
drop policy if exists "authenticated can mutate clients" on public.clients;
create policy "authenticated can mutate clients" on public.clients for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can read employees" on public.employees;
create policy "authenticated can read employees" on public.employees for select to authenticated using (true);
drop policy if exists "authenticated can mutate employees" on public.employees;
create policy "authenticated can mutate employees" on public.employees for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can read services" on public.services;
create policy "authenticated can read services" on public.services for select to authenticated using (true);
drop policy if exists "authenticated can mutate services" on public.services;
create policy "authenticated can mutate services" on public.services for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can read employee_services" on public.employee_services;
create policy "authenticated can read employee_services" on public.employee_services for select to authenticated using (true);
drop policy if exists "authenticated can mutate employee_services" on public.employee_services;
create policy "authenticated can mutate employee_services" on public.employee_services for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can read appointments" on public.appointments;
create policy "authenticated can read appointments" on public.appointments for select to authenticated using (true);
drop policy if exists "authenticated can mutate appointments" on public.appointments;
create policy "authenticated can mutate appointments" on public.appointments for all to authenticated using (true) with check (true);
