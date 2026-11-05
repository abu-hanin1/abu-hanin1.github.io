-- =====================================================================
-- Miftah - database setup. Paste the whole file in Supabase > SQL Editor.
-- Safe to re-run: it only creates what is missing and refreshes functions.
-- =====================================================================

create extension if not exists http with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

-- ---------------------------------------------------------------- tables
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,60}$'),
  title       text not null default '',
  description text not null default '',
  cover_url   text not null default '',
  status      text not null default 'public' check (status in ('public','private','draft')),
  steps       jsonb not null default '[]'::jsonb,
  theme       jsonb not null default '{}'::jsonb,
  expires_at  timestamptz,
  views       bigint not null default 0,
  unlocks     bigint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- The locked content lives in its own table that visitors can never read.
create table if not exists public.post_content (
  post_id uuid primary key references public.posts(id) on delete cascade,
  items   jsonb not null default '[]'::jsonb
);

-- One row per browser + verified channel, so a returning subscriber
-- finds the lock already open without signing in with Google again.
create table if not exists public.subscriber_passes (
  pass        uuid not null,
  channel_key text not null,
  verified_at timestamptz not null default now(),
  primary key (pass, channel_key)
);

-- ------------------------------------------------------------------- RLS
alter table public.admins            enable row level security;
alter table public.posts             enable row level security;
alter table public.post_content      enable row level security;
alter table public.subscriber_passes enable row level security;

revoke all on public.admins, public.posts, public.post_content, public.subscriber_passes from anon, authenticated;
grant select on public.admins to authenticated;
grant select, insert, update, delete on public.posts, public.post_content to authenticated;

drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins for select to authenticated
  using (user_id = auth.uid());

drop policy if exists posts_admin on public.posts;
create policy posts_admin on public.posts for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists content_admin on public.post_content;
create policy content_admin on public.post_content for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- --------------------------------------------------------------- storage
-- Public bucket with random file names: a file URL is only ever handed out
-- after unlocking, and visitors have no permission to list the bucket.
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists media_admin_all on storage.objects;
create policy media_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'media' and exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (bucket_id = 'media' and exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ------------------------------------------------------- private helpers
-- '@Abu-Hanin', 'youtube.com/@Abu-Hanin' or 'UCxxxx' => 'UCxxxx' / '@abu-hanin'
create or replace function private.channel_ref(p_target text)
returns text language plpgsql immutable set search_path = '' as $$
declare v text := trim(coalesce(p_target, '')); m text[];
begin
  m := regexp_match(v, '(UC[A-Za-z0-9_-]{22})');
  if m is not null then return m[1]; end if;
  m := regexp_match(v, '@([^/?#\s]+)');
  if m is not null then return '@' || m[1]; end if;
  m := regexp_match(v, '^https?://');
  if m is null and v <> '' then return '@' || v; end if;
  return null;
end $$;

create or replace function private.yt_get(p_path text, p_token text)
returns jsonb language plpgsql volatile set search_path = '' as $$
declare r extensions.http_response;
begin
  select * into r from extensions.http((
    'GET',
    'https://www.googleapis.com/youtube/v3/' || p_path,
    array[extensions.http_header('Authorization', 'Bearer ' || p_token)],
    null, null
  )::extensions.http_request);
  return jsonb_build_object('status', r.status, 'body', r.content::jsonb);
exception when others then
  return jsonb_build_object('status', 0, 'body', '{}'::jsonb);
end $$;

-- Returns 'yes', 'no' or 'error' for the owner of p_token.
create or replace function private.is_subscribed(p_ref text, p_token text)
returns text language plpgsql volatile set search_path = '' as $$
declare v_channel text := p_ref; v_res jsonb;
begin
  if v_channel is null then return 'error'; end if;
  if left(v_channel, 1) = '@' then
    v_res := private.yt_get('channels?part=id&forHandle=' || extensions.urlencode(v_channel), p_token);
    if (v_res->>'status')::int <> 200 then return 'error'; end if;
    v_channel := v_res #>> '{body,items,0,id}';
    if v_channel is null then return 'error'; end if;
  end if;
  v_res := private.yt_get('subscriptions?part=id&mine=true&forChannelId=' || extensions.urlencode(v_channel), p_token);
  if (v_res->>'status')::int = 200 then
    return case when jsonb_array_length(coalesce(v_res #> '{body,items}', '[]'::jsonb)) > 0 then 'yes' else 'no' end;
  end if;
  -- A Google account with no YouTube channel cannot be subscribed to anything.
  if (v_res->>'status')::int = 404 then return 'no'; end if;
  return 'error';
end $$;

-- ------------------------------------------------- functions for visitors
create or replace function public.get_post(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', p.slug, 'title', p.title, 'description', p.description,
    'cover_url', p.cover_url, 'status', p.status, 'steps', p.steps, 'theme', p.theme,
    'expires_at', p.expires_at, 'views', p.views, 'unlocks', p.unlocks, 'created_at', p.created_at,
    'expired', (p.expires_at is not null and p.expires_at < now()),
    'items_summary', coalesce((
      select jsonb_agg(jsonb_build_object('type', i->>'type', 'label', i->>'label'))
      from jsonb_array_elements(c.items) i
    ), '[]'::jsonb)
  )
  from public.posts p
  left join public.post_content c on c.post_id = p.id
  where p.slug = p_slug and p.status <> 'draft';
$$;

create or replace function public.list_public_posts()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb) from (
    select slug, title, cover_url, views, unlocks, created_at
    from public.posts
    where status = 'public' and (expires_at is null or expires_at > now())
    order by created_at desc limit 60
  ) t;
$$;

create or replace function public.register_view(p_slug text)
returns bigint language sql volatile security definer set search_path = '' as $$
  update public.posts set views = views + 1
  where slug = p_slug and status <> 'draft'
  returning views;
$$;

-- The only door to the locked content.
-- Every step flagged "verify" must be proven by a Google token or a saved pass.
create or replace function public.unlock_post(
  p_slug text,
  p_google_token text default null,
  p_pass uuid default null,
  p_count boolean default false
) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_post public.posts%rowtype;
  v_step jsonb;
  v_ref text;
  v_key text;
  v_res text;
  v_pass uuid := p_pass;
  v_verified jsonb := '[]'::jsonb;
  v_missing jsonb := '[]'::jsonb;
  v_google_error boolean := false;
  v_items jsonb;
begin
  select * into v_post from public.posts where slug = p_slug and status <> 'draft';
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v_post.expires_at is not null and v_post.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  for v_step in select s from jsonb_array_elements(v_post.steps) s
                where coalesce((s->>'verify')::boolean, false) loop
    v_ref := private.channel_ref(v_step->>'target');
    v_key := lower(coalesce(v_ref, ''));

    if p_pass is not null and exists (
      select 1 from public.subscriber_passes sp
      where sp.pass = p_pass and sp.channel_key = v_key
        and sp.verified_at > now() - interval '30 days'
    ) then
      v_verified := v_verified || to_jsonb(v_step->>'id');
      continue;
    end if;

    if p_google_token is null then
      v_missing := v_missing || to_jsonb(v_step->>'id');
      continue;
    end if;

    v_res := private.is_subscribed(v_ref, p_google_token);
    if v_res = 'yes' then
      v_pass := coalesce(v_pass, gen_random_uuid());
      insert into public.subscriber_passes (pass, channel_key) values (v_pass, v_key)
      on conflict (pass, channel_key) do update set verified_at = now();
      v_verified := v_verified || to_jsonb(v_step->>'id');
    else
      if v_res = 'error' then v_google_error := true; end if;
      v_missing := v_missing || to_jsonb(v_step->>'id');
    end if;
  end loop;

  if jsonb_array_length(v_missing) > 0 then
    return jsonb_build_object(
      'ok', false,
      'reason', case when v_google_error then 'google_error'
                     when p_google_token is null then 'needs_verification'
                     else 'not_subscribed' end,
      'verified', v_verified, 'missing', v_missing, 'pass', v_pass
    );
  end if;

  if p_count then
    update public.posts set unlocks = unlocks + 1 where id = v_post.id;
  end if;

  select items into v_items from public.post_content where post_id = v_post.id;
  return jsonb_build_object(
    'ok', true, 'verified', v_verified, 'pass', v_pass,
    'items', coalesce(v_items, '[]'::jsonb)
  );
end $$;

-- Visitors default to a 3s limit, which a slow YouTube response could exceed.
alter role anon set statement_timeout = '15s';
alter role authenticated set statement_timeout = '15s';
notify pgrst, 'reload config';

-- ------------------------------------------------------------ permissions
revoke all on schema private from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

revoke execute on function public.get_post(text) from public;
revoke execute on function public.list_public_posts() from public;
revoke execute on function public.register_view(text) from public;
revoke execute on function public.unlock_post(text, text, uuid, boolean) from public;
grant execute on function public.get_post(text) to anon, authenticated;
grant execute on function public.list_public_posts() to anon, authenticated;
grant execute on function public.register_view(text) to anon, authenticated;
grant execute on function public.unlock_post(text, text, uuid, boolean) to anon, authenticated;
