# Jordan Local

Arabic RTL tourism discovery across Jordan, with local providers at the center. Built in this existing Next.js repository for AI Quest 2026.

## Run the working demo

Use Node 24 and the committed lockfile.

```powershell
npm.cmd ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm.cmd run dev
```

Open http://localhost:3000. The default seed/rules mode requires no credentials or paid calls.

- Browse 32 source-backed destinations, places, activities and stays, with 18 licensed local photos including a two-photo Wadi Rum gallery.
- Open dedicated listing pages for visitor-specific published prices, room/night calculators, photos, sharing, related places and source-linked directions where coordinates exist.
- Use the original recommendation planner for strict group budgets, clarification and deterministic fallback. Its API v1 and fixtures remain unchanged.
- At /signup, choose traveler or business. Without credentials, explicitly start the separate local demo: fictional profiles, listings and favorites are saved only in this browser. /business/manage supports create, edit and removal in that demo. The original /business temporary-preview form is preserved.
- With Supabase configured, signup, email confirmation, login, profiles, favorites and owned listing publishing use Auth/PostgreSQL. No real Auth or DB configuration has been applied by this implementation.

## Setup and team continuation

Read [setup and live verification](docs/MVP-SETUP.md), [team handoff](TEAM_HANDOFF.md), [three demo scenarios](docs/MVP-DEMO.md), and [final delivery report](docs/FINAL-DELIVERY.md). The [API contract](docs/API_CONTRACT.md) is frozen. Older delivery/planning notes describe earlier snapshots; the final report and handoff take precedence for current implementation status.

Supabase: review/apply migrations 001 → 002 → 003 → 004 in order, then original seeds, seed_tourism.sql and seed_details.sql. Never reset an existing database. Configure Auth Site URL and the exact /auth/callback redirect. The server uses the signed-in user's publishable-key client and RLS, never a service-role runtime key.

Environment placeholders: [.env.example](.env.example). Keep .env.local private. DATA_MODE=supabase enables persistence after setup. AI_MODE=hybrid plus ALLOW_PAID_AI=true and a server-only OpenAI key require explicit approval for paid usage. Otherwise the Responses integration uses deterministic fallback. No paid requests or Vercel deployment were performed.

## Validation

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd test
npm.cmd run build
npm.cmd start
```

Optional installed-Chrome checks: scripts/browser-smoke.mjs, browser-premium.mjs and browser-final.mjs. They use an isolated debugging browser and seed/rules app on port 3100; screenshots are ignored under .qa-artifacts/. Mocked Supabase tests establish route scoping, not live RLS. See the setup checklist before enabling production writes.

## Price and product boundaries

All money uses integer fils: 1 JOD = 1000 fils. Conditional admission prices are separate from strict v1 activity budgets; residency/citizenship and unknown capacity cannot be guessed. Published prices are dated snapshots, not live availability. Five commercial estimates are explicitly fictional, seed-only planning examples and excluded from production SQL. Unspecified billing periods never become nightly prices or zero-cost items.

Full-geography /api/tourism remains deterministic discovery. The opt-in Responses AI runs only through the existing nine-location /api/recommend contract. Newly published eligible v1 business offers join fresh discovery and recommendations. A full-geography AI endpoint is a follow-up requiring a reviewed contract extension.

No booking, payments, general chatbot, fabricated reviews/analytics, provider partnerships or fake uploads. Listing images may use an owner-supplied HTTPS link with rights confirmation; Storage upload is a follow-up. Public landmarks never receive private ownership.

## Stack and ownership

Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL, OpenAI Responses API, Zod and Vitest. CI runs Node 24. No new dependency was added for the final feature set.

P1 owns contracts/shared shell/docs, P2 AI/ranking, P3 Auth/data/RLS, P4 visitor UI. The user explicitly authorized the integrated lead work and final GitHub delivery; preserve teammate commits and develop on separate task branches. See AGENTS.md and TEAM_HANDOFF.md.
