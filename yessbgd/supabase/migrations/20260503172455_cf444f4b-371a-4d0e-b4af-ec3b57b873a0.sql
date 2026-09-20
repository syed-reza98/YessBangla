
-- Roles enum and user_roles table
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Admins can view all roles"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- Job applications table
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_slug text not null,
  job_title text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  linkedin text,
  cover_letter text not null,
  resume_path text not null,
  resume_name text not null,
  resume_size integer not null,
  resume_type text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.job_applications enable row level security;

create policy "Anyone can submit a job application"
  on public.job_applications for insert
  to anon, authenticated
  with check (
    length(full_name) between 2 and 100
    and length(email) between 3 and 255
    and length(phone) between 5 and 30
    and length(cover_letter) between 20 and 5000
    and length(job_slug) between 1 and 200
  );

create policy "Admins can view all applications"
  on public.job_applications for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete applications"
  on public.job_applications for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for resumes (private)
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false);

create policy "Anyone can upload a resume"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'resumes');

create policy "Admins can read resumes"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'resumes' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete resumes"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'resumes' and public.has_role(auth.uid(), 'admin'));
