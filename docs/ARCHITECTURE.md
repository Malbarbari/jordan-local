# Architecture v1

## Primary
One Next.js App Router application. React/Tailwind UI → Route Handlers → Supabase Postgres/Auth. Only /api/recommend invokes OpenAI, server-side.
No FastAPI, Redis, agent framework, vector database, scraping job, payment service, or separate backend.

~~~mermaid
flowchart TD
  V["Visitor"] --> UI["Next.js UI"]
  B["Business"] --> UI
  UI --> API["Route Handlers"]
  API --> AUTH["Supabase Auth"]
  API --> DB["Postgres + RLS"]
  API --> REC["Constraints + ranking"]
  REC --> LLM["OpenAI"]
  DB --> REC
  REC --> VAL["ID + fact validation"]
  VAL --> UI
~~~

## Stack
Node.js 24 LTS; stable Next.js installed once with create-next-app; React/TypeScript/Tailwind from that scaffold.
Dependencies: @supabase/supabase-js, @supabase/ssr, openai, zod, lucide-react.
Dev dependencies: vitest, tsx. Use ESLint from the scaffold. No UI library installation: build small shared Button/Input/Card/Badge primitives.

## Shared module interfaces — P1 freezes signatures in shared contracts; each owner implements their paths
~~~typescript
// src/lib/auth/server.ts — P3
requireUser(): Promise<{ id: string }> // verified Supabase claims; throws typed 401
// src/lib/supabase/client.ts — P3
createClient(): SupabaseClient // browser Auth client, public key only
// src/lib/data/activities.ts — P3
loadActivities(): Promise<Activity[]> // published records, no cache, server only
// src/lib/recommendation/service.ts — P2
recommend(request: RecommendRequest, activities: Activity[], now: Date): Promise<RecommendResponse>
~~~
The recommendation route authenticates, validates, loads server-side candidates, and passes them to the engine. No client-supplied activity dataset or actor ID is accepted.

## Database
All public tables have RLS enabled. UUID primary keys. Prices are integer fils; store timestamps as timestamptz and display in Asia/Amman.

| Table | Essential columns |
| --- | --- |
| profiles | id FK auth.users, display_name, locale ar/en, visitor_kind resident/international/null, preferences jsonb, created_at |
| businesses | id, owner_id unique FK profiles.id, name, description, location_id, contact_url nullable, is_demo boolean, verification_status unverified/contact_checked, created_at |
| activities | id, business_id nullable FK businesses.id, record_kind place/offer, title_ar/title_en, description_ar/description_en, location_id, category, tags[], environment[], group_types[], family_friendly nullable, price_fils nullable, price_unit per_person/per_group/free/unknown, price_status unknown/source_checked/owner_declared/synthetic_demo, price_checked_at nullable, price_valid_until nullable, price_notes, duration_minutes nullable, capacity_people nullable, available_months nullable, image_path nullable, source_url nullable, location_source_url nullable, data_kind public_source/provider_submitted/synthetic_demo, verification_status source_checked/owner_declared/unverified, source_checked_at nullable, status published/archived, created_at, updated_at |
| favorites (P1) | user_id FK profiles, activity_id FK activities, created_at, composite primary key(user_id, activity_id) |

No recommendations/history table in the MVP.
Business role is derived from a businesses row owned by the authenticated user. A profile field or client-selected role never grants access.
Public place rows have business_id=null and are not user-editable.
Unknown and free are different: unknown price is null with unknown unit; free is zero with free unit.
Enforce nonnegative prices, integer bounds, valid units/months/locations, capacity >=1 if known, and positive duration if known in both Zod and SQL.

## Authorization
- profiles: SELECT/INSERT/UPDATE only when id=auth.uid(); no public profile access.
- businesses: public catalogue fields readable; owner updates only allowed descriptive/contact fields. Provision accounts/business rows administratively in P0. owner_id, is_demo and verification fields cannot be changed by clients.
- activities: public SELECT for published rows; owner SELECT also includes their archived rows.
- INSERT/UPDATE/DELETE require an owned business. UPDATE needs USING for existing ownership and WITH CHECK for resulting ownership; the owner cannot transfer business_id.
- favorites: every operation requires user_id=auth.uid().
- Use authenticated per-request Supabase clients so RLS is exercised. No service-role runtime client.
- SQL triggers/column grants must also protect provenance/admin fields against direct Supabase REST writes, not only against Route Handler requests.
- For owner-created offers, database logic derives data_kind from businesses.is_demo and sets verification/price status to owner-declared or synthetic-demo. Only admin-seeded data can be source_checked.
- Validate identity with getClaims (or getUser for a fresh server-side record), never trust getSession's user alone.
- Follow the current @supabase/ssr cookie/proxy pattern. Session responses and data routes use Cache-Control: no-store.
- Reject cross-origin mutation requests; use same-origin JSON requests and a configured APP_ORIGIN. Validate all inputs and disallow mass assignment.

## Freshness
No recommendation response cache in P0. Query current published activities each time. Revalidate selected IDs/status/updated_at before returning; if selected facts changed, reapply constraints and omit stale selections rather than returning outdated price claims. A tiny race after the response is normal; show the price check time and request provider confirmation.
Known source/owner prices expire at price_valid_until, or after 30 days from price_checked_at when no expiry exists (our conservative demo policy, not a legal/business rule).
Synthetic prices are explicitly fictional.

## Fallback architecture
Same Next.js/Vercel app + versioned JSON seed + same OpenAI engine, selected by DATA_MODE=seed.
This is a labelled read-only demonstration. Private account-dependent routes and all mutations are unavailable. It intentionally cannot prove durable business publishing.
AI_MODE=rules independently provides deterministic ranking; display engine=rules_fallback.
Do not persist uploads in Vercel filesystem or use SQLite as a hidden production substitute.

## Deployment
Leader owns the Vercel project, main integration, environment variables, Node 24 runtime, and release.
Choose a public GitHub repository if competition rules permit; it simplifies access and free branch protection. If it must be private, validate available collaboration/hosting features immediately.
Only leader merges to main and triggers production. Other contributors' preview deployments may depend on hosting-plan permissions.

