-- Setup the storage bucket for files
insert into storage.buckets (id, name, public) values ('vault', 'vault', false) on conflict do nothing;

-- Create Folders Table
create table public.folders (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    parent_id uuid references public.folders(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Files Table
create table public.files (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    folder_id uuid references public.folders(id) on delete cascade,
    storage_path text not null,
    size bigint not null,
    type text not null,
    is_starred boolean default false,
    is_trashed boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.folders enable row level security;
alter table public.files enable row level security;

-- Policies for Folders
create policy "Users can view their own folders." on public.folders
    for select using (auth.uid() = user_id);

create policy "Users can insert their own folders." on public.folders
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own folders." on public.folders
    for update using (auth.uid() = user_id);

create policy "Users can delete their own folders." on public.folders
    for delete using (auth.uid() = user_id);

-- Policies for Files
create policy "Users can view their own files." on public.files
    for select using (auth.uid() = user_id);

create policy "Users can insert their own files." on public.files
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own files." on public.files
    for update using (auth.uid() = user_id);

create policy "Users can delete their own files." on public.files
    for delete using (auth.uid() = user_id);

-- Policies for Storage (Bucket: vault)
create policy "Users can view their own files in storage"
on storage.objects for select
using ( bucket_id = 'vault' and auth.uid() = owner );

create policy "Users can upload files to their storage"
on storage.objects for insert
with check ( bucket_id = 'vault' and auth.uid() = owner );

create policy "Users can update their own files in storage"
on storage.objects for update
using ( bucket_id = 'vault' and auth.uid() = owner );

create policy "Users can delete their own files in storage"
on storage.objects for delete
using ( bucket_id = 'vault' and auth.uid() = owner );
