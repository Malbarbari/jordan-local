# Setup and live verification

## Local demo

Use this existing repository with Node 24. Run npm.cmd ci, copy .env.example only if .env.local does not exist, then npm.cmd run dev. Open http://localhost:3000.

Default DATA_MODE=seed, AI_MODE=rules and ALLOW_PAID_AI=false need no credentials. Public tourism discovery has 40 real source-backed introductions/offers and 15 clearly fictional marketplace offers and dated conditional prices. The v1 budget planner uses the preserved labeled synthetic demo catalog. /signup offers a separately labeled local traveler/business demo saved only in this browser. No email/password is collected for that demo; logout clears it.

/business retains its original temporary preview. /business/manage is the new account-aware editor. Local demo listings appear only while that demo is active; they do not enter server-side /api/recommend or production data.

## Configure Supabase

No SQL or external account changes have been performed. Use your own project and consented test users.

1. Review/apply migrations 001_init.sql, 002_catalog_metadata.sql, 003_tourism_listings.sql, 004_accounts_details.sql, 005_directory_geography.sql, 006_preferences_business_settings.sql, in order. Apply each once. Never drop/reset existing tables; reconcile already-applied migrations first.
2. Apply seed.sql, seed_catalog.sql, seed_tourism.sql, seed_details.sql and seed_marketplace.sql. Optional seed_marketplace_demo.sql is for a separate demo database only. seed_details.sql contains actual source quotes and omits every fictional demo estimate. The first seeds include clearly synthetic test activities. Curated provider identities are unclaimed; never assign a real company to your account without consent/review.
3. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local, DATA_MODE=supabase, APP_ORIGIN=http://localhost:3000. Keep AI_MODE=rules, ALLOW_PAID_AI=false and NEXT_PUBLIC_UI_DEMO=false.
4. In Auth, set Site URL and allow the exact http://localhost:3000/auth/callback redirect. For a deployed host, set its exact origin and callback too. Leave email confirmation enabled. Configure email delivery as appropriate. No secret service-role key belongs in application runtime.
5. Restart/rebuild after environment changes. /signup now creates an actual Supabase account. With confirmation enabled it reports that email verification is required and does not claim a logged-in session. Follow the callback, then login. A profile trigger records sanitized display name/account type; account type grants no business privileges.
6. A business creates its own profile at /business/profile, then publishes at /business/manage. The onboarding RPC derives owner_id from auth.uid(). Names, contacts and prices remain owner-declared, not independently verified. Public landmarks cannot be privately claimed through the editor.

## Required live acceptance checklist

This checklist has NOT run without credentials. Use two distinct consenting test businesses A/B plus a traveler and anonymous session.

- Sign up traveler/A/B, confirm email, login/logout and refresh. No password is stored in app tables.
- A/B create separate business profiles and listings. Verify persisted IDs and owner_id in the dashboard privately.
- Anonymous and traveler browse only published listings. Refresh discovery after publishing.
- A reads/edits/archives its own listing. A cannot PATCH B's listing or its metadata/details, including direct authenticated Supabase REST attempts. Check immutable owner_id/business_id/is_demo/provenance grants.
- A cannot claim source_checked prices or licensed gallery evidence via listing_details. Nightly quotes require accommodation metadata.
- Traveler saves a published real ID, refreshes and removes it. A/B cannot read or mutate that traveler's profile/favorites. Forged user IDs and unavailable/archived IDs must fail.
- Archive removes a listing from public discovery and subsequent recommendations while preserving its row. Check archived details are not public.
- With a valid non-nightly owned price, group size/capacity and group type, make a v1 recommendation and verify the new stored activity ID and integer group total. Unknown/stale/conditional/nightly facts must not pass strict budget constraints.
- Test HTTPS image URL and broken-image fallback; do not claim Storage uploads. Verify provider phone/WhatsApp/site links reflect submitted data.
- Repeat failure tests with expired session, unavailable table and rejected writes; no seed substitution or fake success.

No route mock can prove these live RLS checks. Record actual results privately before a production release.

## AI (paid approval required)

Keep ALLOW_PAID_AI=false until explicitly approving charges. The default gpt-4.1-mini-2025-04-14 model uses the existing Responses.parse/zod structured integration. To enable after approval, configure server-only OPENAI_API_KEY, AI_MODE=hybrid and ALLOW_PAID_AI=true in Supabase data mode. A key alone does not authorize calls.

/api/recommend requires verified Auth only when paid AI is enabled and has a per-instance 15 requests/minute limiter. This is not a distributed spending cap. Requests filter hard constraints first and validate returned IDs; failures use rules_fallback. Full-geography /api/tourism is deterministic and does not call a model.

## Vercel (approval required)

Import the existing GitHub repository; Node 24, Next.js defaults, npm ci and npm run build. Configure the exact origin and Supabase public values, keep server-only keys out of NEXT_PUBLIC variables, set Auth redirects, and perform live acceptance checks. DATA_MODE/other settings require a rebuild. Paid AI should remain disabled until approved and verified. No deployment has been performed.

See README, TEAM_HANDOFF, FINAL-DELIVERY and MVP-DEMO for current scope. Earlier setup/delivery snapshots do not describe the new account features.

### Marketplace import

After migration 004, review/apply `005_directory_geography.sql`, then `seed_marketplace.sql` after the existing tourism/detail seeds. It adds unclaimed provider identities and real advertised offers with stable IDs and no conflict overwrite. The directory profile descriptions are maintained in the validated `data/marketplace.json`. Never grant ownership by matching names.

`node scripts/marketplace-seed.mjs` regenerates SQL without a database connection. `seed_marketplace_demo.sql` is optional for an isolated demo database only; it adds clearly fictional businesses/offers, never real contact data. Production requires no fictional seed. Do not reset an existing database. Validate with separate business A/B accounts: listing/profile edits must fail across owners and neither may edit an unclaimed researched profile.

For migration 006 (saved preferences, owner-private licensing, public projection) and the additional routes/pages, read [backend integration](BACKEND-AI-HANDOFF.md). Apply it after 005; no Storage upload or administrative verification is implemented.
