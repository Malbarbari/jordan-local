-- Additive extension: existing activities and v1 API columns stay intact.
begin;
create table public.catalog_metadata (
 activity_id uuid primary key references public.activities(id) on delete restrict,
 listing_kind text not null check(listing_kind in ('destination','visitable_place','activity','accommodation','business_offer')),
 discovery_tags text[] not null default '{}' check(discovery_tags <@ array['nature','hiking','swimming','sea','adventure','family','couples','budget','cabins','cultural','wellness','farms','pools','camps','scenic','historical','local_tours','food']::text[]),
 estimated_price_fils integer check(estimated_price_fils>0),
 estimated_price_unit text check(estimated_price_unit in ('per_person','per_group')),
 check((estimated_price_fils is null) = (estimated_price_unit is null))
);
alter table public.catalog_metadata enable row level security;
create policy metadata_read on public.catalog_metadata for select to anon,authenticated using(exists(select 1 from public.activities a where a.id=activity_id));
create policy metadata_insert on public.catalog_metadata for insert to authenticated with check(listing_kind<>'destination' and exists(select 1 from public.activities a join public.businesses b on b.id=a.business_id where a.id=activity_id and b.owner_id=(select auth.uid())));
create policy metadata_update on public.catalog_metadata for update to authenticated using(exists(select 1 from public.activities a join public.businesses b on b.id=a.business_id where a.id=activity_id and b.owner_id=(select auth.uid()))) with check(listing_kind<>'destination' and exists(select 1 from public.activities a join public.businesses b on b.id=a.business_id where a.id=activity_id and b.owner_id=(select auth.uid())));
revoke all on public.catalog_metadata from anon,authenticated;
grant select on public.catalog_metadata to anon,authenticated;
grant insert,update on public.catalog_metadata to authenticated;

create function public.check_catalog_metadata() returns trigger language plpgsql security definer set search_path='' as $$
declare a public.activities;
begin
 select * into a from public.activities where id=new.activity_id;
 if new.listing_kind='destination' and (a.business_id is not null or a.record_kind<>'place') then raise exception 'Public destinations cannot be privately owned'; end if;
 if new.listing_kind='business_offer' and (a.business_id is null or a.record_kind<>'offer') then raise exception 'Business offer requires actual provider reference'; end if;
 if new.estimated_price_fils is not null and a.price_unit<>'unknown' then raise exception 'Estimate requires unknown base price'; end if;
 return new;
end;
$$;
revoke all on function public.check_catalog_metadata() from public,anon,authenticated;
create trigger catalog_metadata_check before insert or update on public.catalog_metadata for each row execute function public.check_catalog_metadata();
-- A later declared price supersedes an old estimate, including direct REST edits.
create function public.clear_catalog_estimate() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.price_unit<>'unknown' then
  update public.catalog_metadata set estimated_price_fils=null,estimated_price_unit=null where activity_id=new.id and estimated_price_fils is not null;
 end if;
 return new;
end;
$$;
revoke all on function public.clear_catalog_estimate() from public,anon,authenticated;
create trigger clear_estimate after update of price_unit,price_fils on public.activities for each row execute function public.clear_catalog_estimate();
-- Explicit public projection. No owner_id, email, private records or contact data.
-- Default definer view intentionally bypasses business-owner-only SELECT solely
-- for these four columns of providers with a published offer.
create view public.catalog_providers with (security_barrier=true) as
 select b.id,b.name,b.is_demo,b.verification_status from public.businesses b
 where exists(select 1 from public.activities a where a.business_id=b.id and a.record_kind='offer' and a.status='published');
revoke all on public.catalog_providers from public;
grant select on public.catalog_providers to anon,authenticated;
commit;
