-- Private Studio state. Only the publisher Edge Function (service role) accesses it.
create table public.studio_cloud_drafts (
  user_id uuid not null references auth.users (id) on delete cascade,
  page text not null check (page ~ '^[a-z0-9-]{1,80}$'),
  revision uuid not null,
  bytes integer not null check (bytes between 1 and 33554432),
  updated_at timestamptz not null default now(),
  primary key (user_id, page)
);

create table public.studio_publish_receipts (
  commit_sha text primary key check (commit_sha ~ '^[a-f0-9]{40}$'),
  page text not null check (page ~ '^[a-z0-9-]{1,80}$'),
  publisher text not null check (length(publisher) between 1 and 80)
);

alter table public.studio_cloud_drafts enable row level security;
alter table public.studio_publish_receipts enable row level security;
revoke all on public.studio_cloud_drafts, public.studio_publish_receipts from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.studio_cloud_drafts to service_role;
grant select, insert on public.studio_publish_receipts to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studio-private-drafts','studio-private-drafts',false,33554432,array['application/octet-stream']);
