# Tourism discovery catalogue extension

Jordan Local discovers tourism destinations, visitable places, activities, stays and provider offers. It does not book them. The mission includes giving smaller local providers relevant exposure.

## Compatibility

The existing strict API v1 DTOs, enums, response envelopes and JSON fixtures are unchanged. Original demo activities are preserved. `src/contracts/catalog.ts` is a separate additive contract; `GET /api/catalog` returns `{ data: [{ activity, metadata, provider }], meta: { count, metadata_available } }`. Each `activity` still parses as the original v1 DTO. The visitor still posts the exact v1 request to `/api/recommend` and receives the exact v1 response.

`catalog_metadata` stores a listing kind and rich discovery tags keyed by the existing activity UUID. Base `activities` gets no new columns, so existing strict `select('*')` consumers remain compatible. Existing rows without metadata derive conservative defaults. If migration 002 is absent, basic catalogue/recommendation integration continues with an explicit metadata-unavailable message; live rows never become fictional seed rows.

Kinds: destination, visitable_place, activity, accommodation, business_offer. Tags: nature, hiking, swimming, sea, adventure, family, couples, budget, cabins, cultural, wellness, farms, pools, camps, scenic, historical, local_tours and food.

## Ownership and provenance

Public destinations use `record_kind=place`, `business_id=null`, and no provider. Schema and database trigger reject privately owned destination metadata. Admin-reviewed public destination import is separate from business submissions; business owners cannot submit a landmark as their private destination. A provider-owned offer references the authoritative existing business UUID, enforced by the foreign key and verified ownership.

`catalog_providers` deliberately projects only id/name/is_demo/verification_status for businesses having published offers. The narrowly scoped view uses the database view owner's privileges to expose those public fields despite the underlying owner-only businesses SELECT policy. No owner UUID, email, private listing or contact detail is projected. This public name exposure is intentional; provision only consented provider names. `contact_checked` means admin-reviewed contact information, not certified experience safety. Owner-submitted facts remain owner-declared.

Migration 002 has SELECT policies respecting visibility through the existing activities RLS, owner-only INSERT/UPDATE policies, no anonymous writes and no DELETE grant. Direct REST writes cannot assign privately owned destination types or conflicting estimates. SQL has been reviewed in source but not applied or verified against a live database.

## Four price presentations

- Free: original `free` unit with exactly zero fils.
- Declared known: positive integer fils and per-person/per-group unit, with existing price provenance/freshness checks.
- Estimated: base price remains `unknown/null`; supplemental positive integer fils and estimate unit are labelled unconfirmed (or fictional in demo). A later declared price clears the estimate in SQL.
- Unknown: no amount and no estimate. Never displayed as free.

Estimates cannot satisfy hard budget eligibility. Unknown capacity, family suitability, price, duration or season also cannot satisfy a corresponding hard constraint. Consequently the public destination examples are browsable but are not confirmed recommendations for the default party/budget search. We do not fabricate landmark capacity to force them into results. Accommodation metadata does not imply a nightly pricing engine: the demo cabin is an unconfirmed group-package estimate, not a nightly quote.

## Ranking and local-provider exposure

Arabic/English query patterns match declared rich tags, adding a bounded soft score component and a deterministic explanation naming only matched tags. The Responses ranker also receives the supplemental metadata of eligible candidates. Hard constraints still run first. Text and tags never prove safety, supervision, availability, distance or popularity. Natural-language interpretation remains limited without live AI.

Before shortlisting and final top-five selection, an exact relevance tie is resolved toward a less represented provider. A weaker score never displaces a stronger score; there are no paid positions, fabricated reviews or popularity boosts. Stable UUID ordering resolves remaining ties. Public destinations use their own listing UUID as the diversity key; they are not attributed to a private provider.

## Demonstration data and sources

The 16 original fictional activities are unchanged. Five additive rows give 21 total: two real public destination introductions and three clearly fictional business examples (farm/pool, cabin estimate, daytime camp package). No real commercial provider was invented. The original synthetic business ID remains explicitly fictional.

Public descriptions were checked against the Jordan Tourism Board on 2026-10-09, with short original summaries and per-card links:

- [Umm Qais](https://international.visitjordan.com/wheretogo/umm-qais/): public destination introduction, no verified admission price or group suitability.
- [History and culture, including Ajloun Castle](https://international.visitjordan.com/whattodo/history-culture/): public destination introduction, no verified admission price or availability.

Original local SVG illustrations remain illustrative, not photographs of these places. `node scripts/catalog-seed.mjs` regenerates only additive seed JSON and `supabase/seed_catalog.sql`; it never changes the original seed or writes to a database.

## Supabase application order and submission

On a fresh approved project apply `001_init.sql`, then `002_catalog_metadata.sql`, then `seed.sql`, then `seed_catalog.sql`. On an existing project with 001 already applied, review/apply only 002 and the optional additive catalogue seed. Do not reset existing tables. Both seeds preserve colliding IDs using ON CONFLICT DO NOTHING.

Business submission uses the original POST to create an owned base record, then owner-verified `PATCH /api/activities/{id}/catalog` to persist extra metadata. Both inputs are independently Zod validated. This is intentionally two compatible requests rather than a rewritten v1 endpoint. If the metadata write fails, the already published base record remains discoverable and the UI offers a retry for that UUID; it does not resubmit/duplicate the listing. Seed-mode submission only validates and previews temporarily, without a server write or inclusion in recommendations.

## Follow-ups beyond the MVP

- Versioned geographical contract for Petra/Wadi Musa, Wadi Mujib, Ma'in, Aqaba/sea, Dead Sea and more regions. Current v1 has nine locations; they were not inaccurately mapped to existing cities.
- Nightly stays, dates, multi-night/group occupancy, provider package inclusions and verified entrance-price rules for residency/age.
- Reviewed catalogue import/editor, provider self-service onboarding, moderation workflow and independent safety verification.
- A separate explicit unconfirmed-discovery response tier for destinations with missing hard facts, rather than weakening v1's eligible recommendation guarantees.
- Live Supabase RLS/privacy checks and approved Responses evaluation. These require configured services; no live or paid calls were made.

## Additive business marketplace

`GET /api/businesses` returns `{data:[{provider,profile,listings}],meta:{data_mode}}`, grouped only from published tourism listings. `GET /api/businesses/{uuid}` returns `{data:{provider,profile,listings}}` or the existing error envelope/404. Directory profiles are independent, sourced and unclaimed; no public API grants ownership. `GET /api/listings/{uuid}` hydrates the same actual offer ID, keyed details and related entries. Marketplace price details may add min_people/max_people/requires_confirmation; restricted group prices never produce a total outside their conditions.

All existing `/api/recommend`, `/api/activities` DTOs, envelopes and fixtures remain unchanged. Eligible nine-city marketplace offers enter the original activity loader; full-geography/nights/unknown capacity retain additive discovery without false budget eligibility. Default seed mode also contains explicitly fictional providers/offers. Browser-created demo offers appear only in a separately labeled rules overlay, never in model candidates or a fabricated server response.
