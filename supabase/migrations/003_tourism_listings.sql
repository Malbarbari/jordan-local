-- Additive source-backed catalogue, including geography outside API v1.
-- Curated records are admin imported, never client-labelled as verified.
begin;
create table public.tourism_listings (
 id uuid primary key,
 business_id uuid references public.businesses(id) on delete restrict,
 status text not null default 'published' check(status in ('published','archived')),
 payload jsonb not null,
 check(payload->'activity'->>'id'=id::text),
 check((payload->'activity'->>'business_id')::uuid is not distinct from business_id),
 check(payload->'activity'->>'status'=status),
 check(payload->>'currency'='JOD'),
 check(payload->'metadata'->>'listing_kind'<>'destination' or business_id is null)
);
alter table public.tourism_listings enable row level security;
create policy tourism_public_read on public.tourism_listings for select to anon,authenticated using(status='published');
create policy tourism_owner_read on public.tourism_listings for select to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
revoke all on public.tourism_listings from anon,authenticated;
grant select on public.tourism_listings to anon,authenticated;
create index tourism_published on public.tourism_listings(status);
-- Owner submissions still use existing activities POST, ownership trigger and
-- RLS. The tourism loader also reads their genuine published records.
commit;
