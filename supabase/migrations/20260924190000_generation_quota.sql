-- JCAI-FIX-06/C1 — daily generation quota per cascade (S7; findings L3-06/L4-10).
--
-- NOT applied by the agent. Apply before deploying the generate-content build
-- from the same commit: that build calls public.reserve_generation() on every
-- request and fails with 500 until the function exists.
--
-- What changes:
--   * One quota unit = one button press ("batch"), not one model call. The
--     Studio sends the same batch_id on every call of a cascade (blog + N
--     derivatives), and the quota counts DISTINCT batch_id per UTC day.
--   * The check and the reservation are one atomic step. Before this, the
--     function counted rows, called Anthropic, then inserted — so parallel
--     derivative calls at 49/50 all passed.
--   * A reservation that produces nothing is released by the function
--     (it deletes the pending row), so empty or failed results do not count.

begin;

-- ── 1. batch_id on content_generations ──────────────────────────────────────
-- Nullable: rows written before this migration have no batch and are simply
-- not counted by the new quota.

alter table public.content_generations
  add column if not exists batch_id uuid;

create index if not exists content_generations_user_created_batch_idx
  on public.content_generations (user_id, created_at, batch_id);

-- ── 2. reserve_generation(batch_id) ─────────────────────────────────────────
-- Called by generate-content with the CALLER'S JWT (a supabase-js client built
-- with the request's Authorization header), never with the service role:
-- auth.uid() is the only source of the user id, so a caller cannot reserve
-- against someone else's quota, and a service-role call (auth.uid() null) is
-- rejected.
--
-- Returns the number of batches used today INCLUDING this one.
--   * First call of a batch: takes a per-user advisory lock, counts today's
--     distinct batches, inserts a pending placeholder row, returns count + 1 —
--     or raises 'quota_exceeded' when the user already has 50.
--   * Later calls of the same batch: the batch already has a row, so nothing
--     is reserved and the current count is returned.
-- The advisory lock is transaction-scoped and keyed on the user, so two
-- parallel first calls from one user serialize here and the 50th slot can
-- only be taken once. Different users never wait on each other.
--
-- The pending row (output_format = 'pending', generated_content = '') is
-- turned into the real row by the first successful call of the batch, or
-- deleted by the function if the batch produced nothing. The Studio history
-- hides pending rows.

create or replace function public.reserve_generation(p_batch_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_limit     constant int := 50;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_used      int;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_batch_id is null then
    raise exception 'batch_id_required' using errcode = '22004';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_uid::text));

  select count(distinct batch_id)
    into v_used
    from public.content_generations
   where user_id = v_uid
     and created_at >= v_day_start
     and batch_id is not null;

  if exists (
    select 1 from public.content_generations
     where user_id = v_uid and batch_id = p_batch_id
  ) then
    return v_used;
  end if;

  if v_used >= v_limit then
    raise exception 'quota_exceeded'
      using errcode = 'P0001',
            detail  = format('%s of %s batches used today (UTC)', v_used, v_limit);
  end if;

  insert into public.content_generations
    (user_id, batch_id, input_type, output_format, generated_content)
  values
    (v_uid, p_batch_id, 'pending', 'pending', '');

  return v_used + 1;
end;
$$;

-- Supabase grants EXECUTE to PUBLIC (and so anon) by default; only signed-in
-- users may call this.
revoke execute on function public.reserve_generation(uuid) from public;
revoke execute on function public.reserve_generation(uuid) from anon;
grant  execute on function public.reserve_generation(uuid) to authenticated;

commit;
