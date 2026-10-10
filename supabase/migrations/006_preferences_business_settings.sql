-- Additive owner-private settings. No license proof upload or claim workflow.
begin;
alter table public.profiles add column created_at timestamptz not null default now(), add column updated_at timestamptz not null default now();
create function public.touch_settings() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
create trigger profile_touched before update on public.profiles for each row execute function public.touch_settings();
create table public.user_preferences(user_id uuid primary key references auth.users(id) on delete cascade,payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=4096),updated_at timestamptz not null default now());
alter table public.user_preferences enable row level security;
create policy preferences_own on public.user_preferences for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
revoke all on public.user_preferences from anon,authenticated;
grant select,insert,update,delete on public.user_preferences to authenticated;
create trigger preferences_touched before update on public.user_preferences for each row execute function public.touch_settings();
create table public.business_settings(
 business_id uuid primary key references public.businesses(id) on delete cascade,
 name_en text check(length(name_en)<=200),service_area text[] not null default '{}' check(cardinality(service_area)<=18),activity_types text[] not null default '{}' check(activity_types <@ array['activity','accommodation','business_offer','visitable_place']::text[]),
 profile_image_url text check(profile_image_url is null or (length(profile_image_url)<=2048 and profile_image_url ~ '^https://')),image_rights_confirmed boolean not null default false,
 minimum_group_size integer not null default 1 check(minimum_group_size between 1 and 30),maximum_group_size integer check(maximum_group_size between 1 and 30),
 price_range_min_fils integer check(price_range_min_fils between 0 and 10000000),price_range_max_fils integer check(price_range_max_fils between 0 and 10000000),
 license_status text not null default 'undisclosed' check(license_status in ('yes','no','pending','undisclosed')),
 licensing_authority text check(length(licensing_authority)<=200),registration_number text check(length(registration_number)<=100),license_expires_on date,
 license_verification_status text not null default 'unverified' check(license_verification_status in ('unverified','verified')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(maximum_group_size is null or maximum_group_size>=minimum_group_size),
 check((price_range_min_fils is null and price_range_max_fils is null) or (price_range_min_fils is not null and price_range_max_fils is not null and price_range_max_fils>=price_range_min_fils)),
 check(profile_image_url is null or image_rights_confirmed),
 check(license_status='yes' or (licensing_authority is null and registration_number is null and license_expires_on is null))
);
alter table public.business_settings enable row level security;
create policy settings_owner on public.business_settings for all to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))) with check(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
revoke all on public.business_settings from anon,authenticated;
grant select on public.business_settings to authenticated;
-- Omit verification columns entirely from owner write grants.
grant insert(business_id,name_en,service_area,activity_types,profile_image_url,image_rights_confirmed,minimum_group_size,maximum_group_size,price_range_min_fils,price_range_max_fils,license_status,licensing_authority,registration_number,license_expires_on), update(business_id,name_en,service_area,activity_types,profile_image_url,image_rights_confirmed,minimum_group_size,maximum_group_size,price_range_min_fils,price_range_max_fils,license_status,licensing_authority,registration_number,license_expires_on) on public.business_settings to authenticated;
create function public.reset_license_declaration() returns trigger language plpgsql set search_path='' as $$ begin
 if auth.uid() is not null and (new.license_status is distinct from old.license_status or new.licensing_authority is distinct from old.licensing_authority or new.registration_number is distinct from old.registration_number or new.license_expires_on is distinct from old.license_expires_on) then new.license_verification_status='unverified'; end if;
 new.updated_at=now();return new;end; $$;
create trigger license_declaration_changed before update on public.business_settings for each row execute function public.reset_license_declaration();
create view public.public_business_settings with(security_barrier=true) as
 select s.business_id,s.name_en,s.service_area,s.activity_types,s.profile_image_url,s.minimum_group_size,s.maximum_group_size,s.price_range_min_fils,s.price_range_max_fils,s.license_status,s.license_verification_status
 from public.business_settings s where exists(select 1 from public.activities a where a.business_id=s.business_id and a.status='published') or exists(select 1 from public.tourism_listings t where t.business_id=s.business_id and t.status='published');
grant select on public.public_business_settings to anon,authenticated;
commit;
