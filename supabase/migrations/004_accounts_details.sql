-- Additive account, self-onboarding, favorites and listing presentation data.
-- Review and apply after 001–003. Never requires a service-role key at runtime.
begin;
create table public.profiles(user_id uuid primary key references auth.users(id) on delete cascade,display_name text not null check(length(display_name) between 2 and 100),account_type text not null check(account_type in ('traveler','business')));
alter table public.profiles enable row level security;
create policy profile_own on public.profiles for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,insert,update on public.profiles to authenticated;
create function public.create_account_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare display text; kind text;
begin
 display:=trim(coalesce(new.raw_user_meta_data->>'display_name','زائر'));
 if length(display) not between 2 and 100 then display:='زائر'; end if;
 kind:=case when new.raw_user_meta_data->>'account_type'='business' then 'business' else 'traveler' end;
 insert into public.profiles(user_id,display_name,account_type) values(new.id,display,kind) on conflict(user_id) do nothing;
 return new;
end; $$;
revoke all on function public.create_account_profile() from public,anon,authenticated;
create trigger account_profile_created after insert on auth.users for each row execute function public.create_account_profile();
-- Account type controls presentation only. Business authority always comes from
-- businesses.owner_id and auth.uid(), never this metadata or the profile type.
alter table public.businesses add column category text not null default 'تجارب محلية', add column phone text, add column whatsapp text, add column website text, add column social_url text;
alter table public.businesses add constraint business_public_fields check(length(description)<=2000 and length(category) between 2 and 100 and (phone is null or phone ~ '^\+?[0-9 ()-]{7,25}$') and (whatsapp is null or whatsapp ~ '^[1-9][0-9]{7,14}$') and (website is null or (length(website)<=2048 and website ~ '^https://')) and (social_url is null or (length(social_url)<=2048 and social_url ~ '^https://')));
grant update(category,phone,whatsapp,website,social_url) on public.businesses to authenticated;
create function public.reset_changed_business_contact() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and (new.phone is distinct from old.phone or new.whatsapp is distinct from old.whatsapp or new.website is distinct from old.website or new.social_url is distinct from old.social_url or new.contact_url is distinct from old.contact_url or new.name is distinct from old.name) then new.verification_status:='unverified'; end if;
 return new;
end; $$;
revoke all on function public.reset_changed_business_contact() from public,anon,authenticated;
create trigger changed_business_contact before update on public.businesses for each row execute function public.reset_changed_business_contact();
grant update(status) on public.activities to authenticated;
create function public.onboard_business(p_name text,p_description text,p_location text,p_category text,p_phone text,p_whatsapp text,p_website text,p_social text) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(trim(p_name)) not between 2 and 200 or length(trim(p_description)) not between 10 and 2000 or length(trim(p_category)) not between 2 and 100 then raise exception 'Invalid profile'; end if;
 if p_phone is not null and p_phone !~ '^\+?[0-9 ()-]{7,25}$' then raise exception 'Invalid phone'; end if;
 if p_whatsapp is not null and p_whatsapp !~ '^[1-9][0-9]{7,14}$' then raise exception 'Invalid WhatsApp'; end if;
 if (p_website is not null and p_website !~ '^https://') or (p_social is not null and p_social !~ '^https://') then raise exception 'HTTPS required'; end if;
 insert into public.businesses(owner_id,name,description,location_id,category,phone,whatsapp,website,social_url) values(auth.uid(),p_name,p_description,p_location,p_category,p_phone,p_whatsapp,p_website,p_social)
 on conflict(owner_id) do update set name=excluded.name,description=excluded.description,location_id=excluded.location_id,category=excluded.category,phone=excluded.phone,whatsapp=excluded.whatsapp,website=excluded.website,social_url=excluded.social_url returning id into result;
 return result;
end; $$;
revoke all on function public.onboard_business(text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.onboard_business(text,text,text,text,text,text,text,text) to authenticated;
create view public.business_profiles with(security_barrier=true) as select b.id,b.name,b.description,b.location_id,b.category,b.phone,b.whatsapp,b.website,b.social_url,b.is_demo,b.verification_status from public.businesses b where exists(select 1 from public.activities a where a.business_id=b.id and a.status='published') or exists(select 1 from public.tourism_listings t where t.business_id=b.id and t.status='published');
grant select on public.business_profiles to anon,authenticated;
create table public.favorites(user_id uuid not null references auth.users(id) on delete cascade,listing_id uuid not null,primary key(user_id,listing_id));
alter table public.favorites enable row level security;
create policy favorite_own_read on public.favorites for select to authenticated using(user_id=(select auth.uid()));
create policy favorite_own_delete on public.favorites for delete to authenticated using(user_id=(select auth.uid()));
create policy favorite_own_insert on public.favorites for insert to authenticated with check(user_id=(select auth.uid()) and (exists(select 1 from public.activities where id=listing_id and status='published') or exists(select 1 from public.tourism_listings where id=listing_id and status='published')));
grant select,insert,delete on public.favorites to authenticated;
create table public.listing_details(listing_id uuid primary key,payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=16384));
alter table public.listing_details enable row level security;
create policy detail_public on public.listing_details for select to anon,authenticated using(exists(select 1 from public.activities where id=listing_id and status='published') or exists(select 1 from public.tourism_listings where id=listing_id and status='published'));
create policy detail_own_read on public.listing_details for select to authenticated using(exists(select 1 from public.activities a join public.businesses b on b.id=a.business_id where a.id=listing_id and b.owner_id=(select auth.uid())));
create policy detail_own_insert on public.listing_details for insert to authenticated with check(exists(select 1 from public.activities a join public.businesses b on b.id=a.business_id where a.id=listing_id and b.owner_id=(select auth.uid())));
create policy detail_own_update on public.listing_details for update to authenticated using(exists(select 1 from public.activities a join public.businesses b on b.id=a.business_id where a.id=listing_id and b.owner_id=(select auth.uid()))) with check(exists(select 1 from public.activities a join public.businesses b on b.id=a.business_id where a.id=listing_id and b.owner_id=(select auth.uid())));
grant select on public.listing_details to anon,authenticated;
grant insert,update on public.listing_details to authenticated;
create function public.protect_owner_details() returns trigger language plpgsql set search_path='' as $$
declare q jsonb;
begin
 if auth.uid() is not null then
  if jsonb_typeof(new.payload->'quotes') is distinct from 'array' or new.payload->'gallery' is distinct from '[]'::jsonb then raise exception 'Invalid details'; end if;
  for q in select * from jsonb_array_elements(new.payload->'quotes') loop
   if q->>'status' is distinct from 'owner_declared' or q->>'audience' is distinct from 'everyone' or q->>'source_url' is not null then raise exception 'Owners cannot claim source verification'; end if;
   if q->>'unit'='per_night' and not exists(select 1 from public.catalog_metadata m where m.activity_id=new.listing_id and m.listing_kind='accommodation') then raise exception 'Nightly billing requires accommodation metadata'; end if;
  end loop;
  if new.payload->>'image_url' is not null and (new.payload->>'image_rights_confirmed' is distinct from 'true' or new.payload->>'image_url' !~ '^https://') then raise exception 'Image rights and HTTPS required'; end if;
 end if;
 return new;
end; $$;
create trigger details_guard before insert or update on public.listing_details for each row execute function public.protect_owner_details();
commit;
