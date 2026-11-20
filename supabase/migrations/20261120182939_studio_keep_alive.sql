-- No table access or writes. This probe is only for the Studio uptime workflow.
create function public.studio_keep_alive()
returns table (ok boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select true;
$$;

revoke all on function public.studio_keep_alive() from public, anon, authenticated;
grant execute on function public.studio_keep_alive() to anon;
comment on function public.studio_keep_alive() is 'Returns one fixed row for the New City Wellness Studio keep-alive.';
notify pgrst, 'reload schema';
