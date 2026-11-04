-- 모든 접속자가 같은 시계를 쓰도록 서버 시각 (밀리초). 클라이언트 net.js 가 접속할 때 3번 불러 오차를 보정함
create or replace function public.server_time()
returns double precision
language sql stable security definer set search_path = ''
as $$ select extract(epoch from now()) * 1000 $$;
revoke all on function public.server_time() from public;
grant execute on function public.server_time() to anon, authenticated;
