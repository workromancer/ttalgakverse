-- (선택) 구역별 방문자 수: 브라우저 익명 ID 해시를 시간 단위로 기록, 8일 보관
create table if not exists public.zone_visits (
  zone text not null check (char_length(zone) between 1 and 80),
  vid text not null check (char_length(vid) = 32),
  hour timestamptz not null,
  primary key (zone, hour, vid)
);
alter table public.zone_visits enable row level security;
create or replace function public.visit(p_zone text, p_vid text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if char_length(p_vid) between 6 and 64 then
    insert into public.zone_visits values (p_zone, md5('mv:' || p_vid), date_trunc('hour', now())) on conflict do nothing;
  end if;
  if random() < 0.02 then delete from public.zone_visits where hour < now() - interval '8 days'; end if;
end $$;
create or replace function public.zone_traffic()
returns jsonb language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_object_agg(zone, n), '{}'::jsonb) from (
    select zone, count(distinct vid)::int n from public.zone_visits where hour >= now() - interval '24 hours' group by zone) t
$$;
revoke all on function public.visit(text, text), public.zone_traffic() from public;
grant execute on function public.visit(text, text), public.zone_traffic() to anon, authenticated;
