# طشه Tashah — hackathon prototype

Arabic RTL tourism discovery across Jordan. Visitors describe their interests, city, group and budget; طشه Tashah recommends existing eligible listings and helps lesser-known local tourism providers become discoverable. No booking or payments.

## Judge quick start

Requires **Node.js 24.x**, npm and Git. The bundled demo needs no private credentials. Frontend and backend run together in one Next.js process.

```sh
git clone https://github.com/Malbarbari/jordan-local.git
cd jordan-local
npm ci
```

PowerShell (preserve any existing environment file):

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

macOS/Linux: `test -f .env.local || cp .env.example .env.local`, then `npm run dev`. Windows may require `npm.cmd` if PowerShell's execution policy blocks npm's wrapper.

Open **http://localhost:3000**. Follow [DEMO_GUIDE.md](DEMO_GUIDE.md) for three judge scenarios. Production build: `npm run build`, then `npm start` on the same URL after stopping the development server.

## Features and data

- Responsive premium Arabic RTL homepage, mobile navigation, search and category/region/type filters, accessible details.
- Bundled 40 source-backed destinations/places/offers and 15 explicitly fictional marketplace offers; public destinations have no private owner.
- Directory of 11 independent real providers and five fictional demo businesses; business profiles link to offers and complete details with photos, price explanations and sources.
- Natural Arabic recommendations with clarification, group-total prices, grounded reasons, valid eligible IDs and deterministic fallback. Real Responses ranking is opt-in.
- Conditional admission quotes and room/night calculators. Unknown prices stay unknown; estimates and illustrative regional photos are labeled. Local image licenses and attribution are bundled.
- Existing traveler/business Supabase signup/login, owned profile and listing create/edit/archive, favorites, saved preferences and self-reported licensing require external setup.
- Credential-free temporary submission preview at `/business`; optional explicit local demo at `/signup` supports browser-only profiles/listings/favorites, separate from real Auth/PostgreSQL.

## Stack and architecture

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL, OpenAI Responses API, Zod, Vitest. No separate backend process or new framework.

```text
Arabic UI → POST /api/recommend (frozen v1)
 → structured preference extraction / deterministic parser
 → published catalog → hard budget/capacity/location/type constraints
 → optional Responses ranking of eligible existing IDs only
 → ID/evidence validation → calculated totals and grounded explanations
 → fresh row/metadata check → recommendation cards / listing details

Business form → verified Auth + derived ownership → Zod → Supabase + RLS
Seed demo → bundled JSON + licensed photos; optional browser-only drafts
```

The normal recommendation button analyzes nonempty text when planning fields have not been edited. Explicit field edits and sample presets take priority. **حلّل وصفي أولًا** always ignores form values. Fallback never claims live AI. Provider diversity only breaks exact relevance ties.

Full-Jordan `/api/tourism` supports 18 regions and deterministic discovery. The unchanged `/api/recommend` v1 supports its original nine locations; unsupported destinations clarify instead of returning fabricated matches. [API contracts](docs/API_CONTRACT.md), [team handoff](TEAM_HANDOFF.md), and [backend entry points/settings](docs/BACKEND-AI-HANDOFF.md).

## Environment and demo mode

Safe placeholders: [.env.example](.env.example). Never commit `.env.local`, credentials or keys.

| Variable | Purpose |
| --- | --- |
| `DATA_MODE=seed` | Credential-free bundled demo; `supabase` enables configured persistence. |
| `AI_MODE=rules` | Deterministic recommendations; `hybrid` opts into model integration. |
| `ALLOW_PAID_AI=false` | A key alone never enables paid requests. |
| `APP_ORIGIN=http://localhost:3000` | Exact same-origin mutation validation; match your app origin. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL; empty for the seed demo. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable client key; empty for the seed demo. |
| `OPENAI_API_KEY` | Server-only secret, never exposed to browser code. |
| `OPENAI_MODEL` | Existing default: `gpt-4.1-mini-2025-04-14`. |
| `NEXT_PUBLIC_UI_DEMO=false` | Keep legacy UI-only mock mode off for normal integration. |

No service-role runtime key is required. Public seed discovery never writes production data or calls paid AI. Local demo data belongs to the browser; logout clears it.

## Supabase database and authentication

Review/apply migrations **001 → 006** in `supabase/migrations/`, once and in order, using Supabase SQL editor or established migration tooling. Never reset an existing database or overwrite teammate records.

Schema: businesses/activities/provenance, catalog metadata/public providers, curated tourism, sanitized Auth profiles, favorites/details, expanded provider geography, saved preferences and business settings. RLS scopes private records/writes to verified owners. Public projections exclude private licensing evidence. Licensing is self-reported; no document upload or administrative verification is implemented.

Then review/run `supabase/seed.sql`, `seed_catalog.sql`, `seed_tourism.sql`, `seed_details.sql`, and `seed_marketplace.sql`. Synthetic base records are labeled. `seed_marketplace_demo.sql` is optional for a separate demo database only; do not import fictional companies into production. Seeds keep stable IDs and use non-overwriting inserts. **No SQL is needed for default seed mode.**

Configure Auth Site URL and exact `http://localhost:3000/auth/callback` redirect, leave email confirmation enabled, set the Supabase variables and `DATA_MODE=supabase`, then restart/rebuild. Confirm email, log in, create `/business/profile`, publish at `/business/manage`. Eligible published offers enter fresh discovery/recommendations without retraining.

[Detailed setup and live acceptance checks](docs/MVP-SETUP.md). Live Auth/persistence/RLS require an actual project; mocked tests do not prove live configuration.

## Real AI configuration

After approving paid usage, set server-only `OPENAI_API_KEY`, `AI_MODE=hybrid`, `ALLOW_PAID_AI=true`, `DATA_MODE=supabase`, then authenticate. Structured Responses extraction/ranking uses bounded calls, no retries, `store:false`, and validates IDs/scores/reason evidence. Failures return explicit rules fallback. No paid request was used for final verification.

AI: `src/lib/recommendation/ai.ts`; filtering: `constraints.ts`, `discovery.ts`, `preferences.ts`; orchestration: `service.ts`, `src/app/api/recommend/route.ts`. The per-instance rate limiter is not a distributed spending cap. Keep the frozen contract intact.

## Tests and verification

```sh
npm ci
npm run lint
npx tsc --noEmit
npm test
npm run build
```

GitHub CI uses Node 24 and seed/rules mode. Optional `scripts/browser-*.mjs` Chrome suites verify visitor/business flows, pricing, mobile layouts and actual recommendation POSTs. See script headers for isolated Chrome setup; `SMOKE_ORIGIN` and `CHROME_DEBUG_ORIGIN` override their default ports. Build caches and screenshots are ignored.

## Known limitations

- Actual Supabase Auth/persistence/RLS and paid model responses need configured services and were not tested with real credentials for this submission. The demo uses explicit rules and labeled fictional offers.
- Full-geography AI, recommendation history, advanced accessibility matching, private Storage and administrative license verification are follow-ups. Saved preferences apply supported cities/group/budget/interests; other fields are not hard v1 constraints.
- Prices are dated snapshots, not live availability. Strict budgets exclude unknown/stale/conditional costs and capacity. Tags do not prove safety; road travel time is not calculated.
- Five existing high development-tool audit findings in the ESLint/glob chain remain; no breaking forced dependency downgrade was applied.
- No payments, booking, maps, general chatbot, invented partnerships, reviews or analytics. No deployment or live SQL application was performed.

[Existing presentation outline](docs/DEMO-PITCH.md) is preserved. Final submission integrates the available premium frontend and backend commits. Older delivery reports are historical snapshots; current judge setup is this README and DEMO_GUIDE.
