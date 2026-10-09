# Jordan Local — AI Quest 2026
Arabic-first discovery of Jordanian activities, with database-grounded AI ranking.

> STATUS: This repository kit contains specifications and agent instructions, not an implemented app. Replace this status with verified implementation details before submission. Do not claim tests, deployment, users, partnerships, or bookings that have not happened.

## Product
A visitor describes an outing; the system clarifies ambiguous constraints, filters published listings, uses an LLM to score semantic fit, and returns validated database activities with evidence-based reasons. A signed-in business can create a listing that is considered on the next request.

P0: Explore, natural-language recommendations, explicit filters, managed login with provisioned demo accounts, business list/create, provenance labels, deployed demo.
P1: Business edit/archive, Favorites, persistent preferences, self-service signup.
P2: Booking, payments, conversational chat, community submissions, live maps, popularity, history.

## Stack
Node.js 24 LTS, current stable Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Postgres/Auth, OpenAI Responses API, Zod, Vitest, Vercel.
The leader installs dependencies once and commits package-lock.json. Everyone else uses npm ci.
Default model: gpt-4.1-mini-2025-04-14. Verify access with one real request immediately.

## Setup — after the scaffold and feature PRs exist
~~~powershell
git clone https://github.com/YOUR_USERNAME/jordan-local.git
Set-Location jordan-local
npm ci
Copy-Item .env.example .env.local
code .env.local
npm run dev
~~~
Open http://localhost:3000. Never commit .env.local or demo passwords.

The backend owner applies supabase/migrations/001_init.sql through the Supabase SQL Editor once, provisions three consented test accounts through the Auth dashboard (business A, business B, visitor), inserts their profiles/business ownership rows, and applies the reviewed seed SQL generated from data/activities.seed.json. Record the SQL files and exact steps in this README. Do not install Docker or introduce a migration platform during the event.

## Environment
See .env.example. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are public configuration; RLS is mandatory. OPENAI_API_KEY is server-only. Do not configure a service-role key in the running app. Use the Supabase dashboard for provisioning.

## Scripts to establish
~~~powershell
npm run lint
npm run typecheck
npm test
npm run build
npm start
~~~
The first scaffold may have no tests: record that honestly. The AI owner adds npm run eval:ai through a dependency/script request to the leader; it performs real, opt-in API evaluations and writes a measured report. CI tests use mocked model outputs and no external secrets.

## Security and data
Ownership comes from a verified Supabase identity and businesses.owner_id, not a form-supplied user ID or editable metadata. Prices use integer fils: 1 JOD = 1000 fils.
Synthetic offers are visibly labelled. Real places do not imply real offers or verified prices. No live availability, booking, travel-time, review, or economic-impact claims.

## Delivery
- Live URL: TO BE VERIFIED
- GitHub commit/tag: TO BE VERIFIED
- Demo credentials: shared privately with judges, never in this file
- Implemented: TO BE VERIFIED
- Simulated/synthetic: TO BE VERIFIED
- Tests and known limitations: TO BE VERIFIED

## Reading order
AGENTS.md → docs/SPEC.md → docs/ARCHITECTURE.md → docs/API_CONTRACT.md → docs/TASKS.md.
Then read docs/AI_DESIGN.md, docs/POWERSHELL.md, docs/QA.md, and docs/DEMO-PITCH.md.

## Fallback
DATA_MODE=seed gives read-only catalogue access from the versioned seed. Login-dependent features and writes are disabled; the UI must say "Read-only demo". AI can still rank the seed.
AI_MODE=rules explicitly disables LLM calls and labels results as deterministic fallback. It is not presented as live AI.
Local npm start still needs internet in the primary architecture. A recording is the only fully offline backup; label it as recorded.

