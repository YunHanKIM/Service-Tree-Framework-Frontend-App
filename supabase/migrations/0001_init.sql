-- 빌림 초기 스키마. 규칙 정본: docs/ai/06_domain_playbooks/rental-state.md
-- 같은 규칙의 데모 구현: src/api/demoApi.ts (시나리오: src/api/__tests__/demoApi.test.ts)
-- 상태 변경은 security definer RPC 함수로만 한다. requests·loans에는 클라이언트 쓰기 정책이 없다.

-- ─── 조직 ────────────────────────────────────────────────────────────────
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null
);
insert into public.organizations (id, name)
values ('00000000-0000-4000-8000-000000000001', '데모 동아리');

-- ─── 프로필 ──────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  organization_id uuid not null default '00000000-0000-4000-8000-000000000001'
    references public.organizations (id),
  created_at timestamptz not null default now()
);

-- 가입하면 회원 역할로 프로필을 만든다. 역할은 클라이언트가 정하지 않는다.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.current_org() returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- ─── 물품·신청·대여 ─────────────────────────────────────────────────────
create table public.items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.current_org() references public.organizations (id),
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  image_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id),
  user_id uuid not null references public.profiles (id),
  due_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reject_reason text,
  processed_by uuid references public.profiles (id),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
-- 회원·물품당 대기 신청 1건
create unique index requests_one_pending on public.requests (item_id, user_id) where status = 'pending';

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id),
  user_id uuid not null references public.profiles (id),
  request_id uuid not null unique references public.requests (id),
  due_date date not null,
  borrowed_at timestamptz not null default now(),
  return_requested_at timestamptz,
  returned_at timestamptz,
  return_confirmed_by uuid references public.profiles (id),
  status text not null default 'active' check (status in ('active', 'return_requested', 'returned'))
);
-- 물품당 열린 대여 1건 (동시 승인의 최종 방어선)
create unique index loans_one_open on public.loans (item_id) where status in ('active', 'return_requested');

create function public.item_has_open_loan(p_item_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.loans where item_id = p_item_id and status in ('active', 'return_requested')
  )
$$;

-- 대여 중인 물품은 사용 중지할 수 없다
create function public.guard_item_deactivate() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.is_active and not new.is_active and public.item_has_open_loan(new.id) then
    raise exception 'ITEM_ON_LOAN';
  end if;
  return new;
end $$;

create trigger items_guard_deactivate
before update on public.items
for each row execute function public.guard_item_deactivate();

-- ─── RLS ─────────────────────────────────────────────────────────────────
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.requests enable row level security;
alter table public.loans enable row level security;

create policy organizations_select on public.organizations
for select to authenticated using (id = public.current_org());

create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid() or (public.is_admin() and organization_id = public.current_org()));

-- 본인은 표시 이름만 바꿀 수 있다. role·organization_id는 컬럼 권한으로 막는다.
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;
create policy profiles_update_self on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy items_select on public.items
for select to authenticated using (organization_id = public.current_org());
create policy items_insert_admin on public.items
for insert to authenticated
with check (public.is_admin() and organization_id = public.current_org());
create policy items_update_admin on public.items
for update to authenticated
using (public.is_admin() and organization_id = public.current_org())
with check (public.is_admin() and organization_id = public.current_org());

-- 조회만 허용. 쓰기는 아래 RPC 함수가 한다.
create policy requests_select on public.requests
for select to authenticated
using (
  user_id = auth.uid()
  or (public.is_admin() and exists (
    select 1 from public.items i where i.id = item_id and i.organization_id = public.current_org()
  ))
);
create policy loans_select on public.loans
for select to authenticated
using (
  user_id = auth.uid()
  or (public.is_admin() and exists (
    select 1 from public.items i where i.id = item_id and i.organization_id = public.current_org()
  ))
);

-- ─── 뷰 (호출자 권한으로 RLS 적용) ──────────────────────────────────────
create view public.item_view with (security_invoker = true) as
select
  i.id,
  i.name,
  i.description,
  i.is_active,
  case
    when not i.is_active then 'inactive'
    -- 다른 회원의 대여는 RLS로 안 보이므로 definer 함수로 계산한다
    when public.item_has_open_loan(i.id) then 'on_loan'
    else 'available'
  end as status,
  exists (
    select 1 from public.requests r
    where r.item_id = i.id and r.user_id = auth.uid() and r.status = 'pending'
  ) as my_pending
from public.items i;

create view public.request_view with (security_invoker = true) as
select r.*, i.name as item_name, coalesce(p.display_name, '(알 수 없음)') as user_name
from public.requests r
join public.items i on i.id = r.item_id
left join public.profiles p on p.id = r.user_id;

create view public.loan_view with (security_invoker = true) as
select l.*, i.name as item_name, coalesce(p.display_name, '(알 수 없음)') as user_name
from public.loans l
join public.items i on i.id = l.item_id
left join public.profiles p on p.id = l.user_id;

-- ─── RPC ─────────────────────────────────────────────────────────────────
create function public.create_request(p_item_id uuid, p_due_date text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_item public.items;
  v_due date;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;

  select * into v_item from public.items
  where id = p_item_id and organization_id = public.current_org()
  for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  if p_due_date !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'INVALID_DATE'; end if;
  begin
    v_due := p_due_date::date;
  exception when others then
    raise exception 'INVALID_DATE';
  end;
  if v_due < (now() at time zone 'Asia/Seoul')::date then raise exception 'PAST_DATE'; end if;

  if not v_item.is_active or public.item_has_open_loan(p_item_id) then
    raise exception 'ITEM_UNAVAILABLE';
  end if;

  begin
    insert into public.requests (item_id, user_id, due_date)
    values (p_item_id, auth.uid(), v_due)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'DUPLICATE_PENDING';
  end;
  return v_id;
end $$;

create function public.cancel_request(p_request_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_req public.requests;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_req from public.requests where id = p_request_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_req.user_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if v_req.status <> 'pending' then raise exception 'ALREADY_PROCESSED'; end if;

  update public.requests set status = 'cancelled', processed_at = now() where id = p_request_id;
end $$;

create function public.approve_request(p_request_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_item_id uuid;
  v_req public.requests;
  v_loan_id uuid;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;

  select r.item_id into v_item_id
  from public.requests r join public.items i on i.id = r.item_id
  where r.id = p_request_id and i.organization_id = public.current_org();
  if not found then raise exception 'NOT_FOUND'; end if;

  -- 같은 물품에 대한 승인을 직렬화한다. 잠금을 얻은 뒤 신청 상태를 다시 읽는다.
  perform 1 from public.items where id = v_item_id for update;
  select * into v_req from public.requests where id = p_request_id for update;

  if v_req.status <> 'pending' then
    if public.item_has_open_loan(v_item_id) then raise exception 'CONFLICT'; end if;
    raise exception 'ALREADY_PROCESSED';
  end if;
  if public.item_has_open_loan(v_item_id) then raise exception 'CONFLICT'; end if;

  update public.requests
  set status = 'approved', processed_by = auth.uid(), processed_at = now()
  where id = p_request_id;

  update public.requests
  set status = 'rejected', reject_reason = '다른 신청이 승인되어 자동 거절되었습니다.',
      processed_by = auth.uid(), processed_at = now()
  where item_id = v_item_id and status = 'pending';

  begin
    insert into public.loans (item_id, user_id, request_id, due_date)
    values (v_item_id, v_req.user_id, v_req.id, v_req.due_date)
    returning id into v_loan_id;
  exception when unique_violation then
    raise exception 'CONFLICT';
  end;
  return v_loan_id;
end $$;

create function public.reject_request(p_request_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_req public.requests;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select r.* into v_req
  from public.requests r join public.items i on i.id = r.item_id
  where r.id = p_request_id and i.organization_id = public.current_org()
  for update of r;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_req.status <> 'pending' then raise exception 'ALREADY_PROCESSED'; end if;

  update public.requests
  set status = 'rejected', reject_reason = nullif(trim(p_reason), ''),
      processed_by = auth.uid(), processed_at = now()
  where id = p_request_id;
end $$;

create function public.request_return(p_loan_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_loan public.loans;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_loan.user_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if v_loan.status <> 'active' then raise exception 'ALREADY_PROCESSED'; end if;

  update public.loans set status = 'return_requested', return_requested_at = now() where id = p_loan_id;
end $$;

create function public.confirm_return(p_loan_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_loan public.loans;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select l.* into v_loan
  from public.loans l join public.items i on i.id = l.item_id
  where l.id = p_loan_id and i.organization_id = public.current_org()
  for update of l;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_loan.status <> 'return_requested' then raise exception 'ALREADY_PROCESSED'; end if;

  update public.loans
  set status = 'returned', returned_at = now(), return_confirmed_by = auth.uid()
  where id = p_loan_id;
end $$;

-- ─── 함수 실행 권한 ─────────────────────────────────────────────────────
revoke execute on function
  public.handle_new_user(), public.current_org(), public.is_admin(), public.item_has_open_loan(uuid),
  public.guard_item_deactivate(), public.create_request(uuid, text), public.cancel_request(uuid),
  public.approve_request(uuid), public.reject_request(uuid, text), public.request_return(uuid),
  public.confirm_return(uuid)
from public, anon;

grant execute on function
  public.current_org(), public.is_admin(), public.item_has_open_loan(uuid),
  public.create_request(uuid, text), public.cancel_request(uuid), public.approve_request(uuid),
  public.reject_request(uuid, text), public.request_return(uuid), public.confirm_return(uuid)
to authenticated;
