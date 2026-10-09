-- Jordan Local P0. Apply manually in the Supabase SQL Editor after review.
-- This file creates tables/policies; it does not provision credentials.
begin;
create table public.businesses (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid unique references auth.users(id) on delete restrict,
 name text not null check(length(name) between 1 and 200),
 description text not null default '',
 location_id text not null check(location_id in ('amman','irbid','ajloun','jerash','umm-qais','as-salt','madaba','dana','wadi-rum')),
 contact_url text,
 is_demo boolean not null default false,
 verification_status text not null default 'unverified' check(verification_status in ('unverified','contact_checked')),
 created_at timestamptz not null default now()
);
create table public.activities (
 id uuid primary key default gen_random_uuid(),
 business_id uuid references public.businesses(id) on delete restrict,
 record_kind text not null default 'offer' check(record_kind in ('place','offer')),
 title_ar text not null check(length(trim(title_ar)) between 1 and 200),
 title_en text check(length(title_en)<=200),
 description_ar text not null check(length(trim(description_ar)) between 1 and 4000),
 description_en text check(length(description_en)<=4000),
 location_id text not null check(location_id in ('amman','irbid','ajloun','jerash','umm-qais','as-salt','madaba','dana','wadi-rum')),
 category text not null check(category in ('nature','culture','food','adventure','heritage')),
 tags text[] not null default '{}' check(tags <@ array['nature','culture','food','adventure','heritage']::text[]),
 environment text[] not null default '{}' check(environment <@ array['forest','desert','urban','countryside']::text[]),
 group_types text[] not null default '{}' check(group_types <@ array['family','friends','couple','solo']::text[]),
 family_friendly boolean,
 price_fils integer,
 price_unit text not null check(price_unit in ('per_person','per_group','free','unknown')),
 price_status text not null default 'unknown' check(price_status in ('unknown','source_checked','owner_declared','synthetic_demo')),
 price_checked_at timestamptz,
 price_valid_until timestamptz,
 price_notes text not null default '' check(length(price_notes)<=2000),
 duration_minutes integer check(duration_minutes between 1 and 1440),
 capacity_people integer check(capacity_people>=1),
 available_months integer[] check(available_months <@ array[1,2,3,4,5,6,7,8,9,10,11,12]),
 image_path text check(image_path ~ '^/images/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|avif|svg)$'),
 source_url text,
 location_source_url text,
 data_kind text not null default 'provider_submitted' check(data_kind in ('public_source','provider_submitted','synthetic_demo')),
 verification_status text not null default 'owner_declared' check(verification_status in ('source_checked','owner_declared','unverified')),
 source_checked_at timestamptz,
 status text not null default 'published' check(status in ('published','archived')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check((price_unit='unknown' and price_fils is null) or (price_unit='free' and price_fils is not null and price_fils=0) or (price_unit in ('per_person','per_group') and price_fils is not null and price_fils>0))
);
create index activities_catalogue on public.activities(status,location_id);
create index activities_business on public.activities(business_id);

alter table public.businesses enable row level security;
alter table public.activities enable row level security;
create policy business_own_select on public.businesses for select to authenticated using(owner_id=(select auth.uid()));
create policy business_own_update on public.businesses for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy catalogue_select on public.activities for select to anon,authenticated using(status='published');
create policy activity_own_select on public.activities for select to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy activity_own_insert on public.activities for insert to authenticated with check(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy activity_own_update on public.activities for update to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))) with check(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));

-- Protect admin/provenance columns even for direct authenticated REST writes.
revoke all on public.businesses from anon,authenticated;
grant select on public.businesses to authenticated;
grant update(name,description,location_id,contact_url) on public.businesses to authenticated;
revoke all on public.activities from anon,authenticated;
grant select on public.activities to anon,authenticated;
grant insert(business_id,title_ar,title_en,description_ar,description_en,location_id,category,tags,environment,group_types,family_friendly,price_fils,price_unit,price_valid_until,price_notes,duration_minutes,capacity_people,available_months,image_path) on public.activities to authenticated;
grant update(title_ar,title_en,description_ar,description_en,location_id,category,tags,environment,group_types,family_friendly,price_fils,price_unit,price_valid_until,price_notes,duration_minutes,capacity_people,available_months,image_path) on public.activities to authenticated;

create function public.derive_activity_provenance() returns trigger
language plpgsql security definer set search_path='' as $$
declare demo boolean;
begin
 -- SQL Editor/admin seed runs without a user JWT. RLS denies anonymous writes.
 if auth.uid() is not null then
   select b.is_demo into demo from public.businesses b where b.id=new.business_id and b.owner_id=auth.uid();
   if not found then raise exception 'Business ownership required'; end if;
   if tg_op='UPDATE' and new.business_id is distinct from old.business_id then raise exception 'Ownership cannot be transferred'; end if;
   new.record_kind:='offer';
   new.data_kind:=case when demo then 'synthetic_demo' else 'provider_submitted' end;
   new.verification_status:=case when demo then 'unverified' else 'owner_declared' end;
   new.price_status:=case when new.price_unit='unknown' then 'unknown' when demo then 'synthetic_demo' else 'owner_declared' end;
   new.price_checked_at:=case when new.price_unit='unknown' then null else now() end;
   new.source_url:=null; new.location_source_url:=null; new.source_checked_at:=null;
   if tg_op='INSERT' then new.status:='published';new.created_at:=now(); end if;
 end if;
 new.updated_at:=now();
 return new;
end;
$$;
revoke all on function public.derive_activity_provenance() from public,anon,authenticated;
create trigger activity_provenance before insert or update on public.activities for each row execute function public.derive_activity_provenance();
commit;
