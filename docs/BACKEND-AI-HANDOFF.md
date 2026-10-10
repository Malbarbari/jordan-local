# Backend / AI / dual-account handoff

This branch extends the existing MVP, not a replacement application. The frozen `src/contracts/index.ts`, fixtures and `docs/API_CONTRACT.md` are unchanged. Work is isolated on `feat/backend-ai-accounts`, based on main `c70bc86`, in a sibling Git worktree. The original `feat/frontend-redesign` working tree and its uncommitted UI work are preserved. The later final-submission instruction authorizes verified safe integration into main; the isolated implementation history below is preserved.

## Architecture and completed behavior

| Concern | Entry points and behavior |
| --- | --- |
| Tourism catalog | `src/lib/data/activities.ts`, `tourism.ts`, `catalog.ts`, `marketplace.ts`; fresh published Supabase rows in live mode; explicit sourced/fictional seeds without credentials. |
| Recommendations | `POST /api/recommend` → `preferences.ts` → `constraints.ts` + required discovery tags → candidate shortlist → optional `ai.ts` ranking → validated IDs/reason codes → deterministic explanations → final fresh row/metadata checks. |
| Arabic input | Jordanian friends/count phrases, two-person requests, Arabic/Persian digits, exact fils, hiking variants, cabins/swimming tags. Explicit activity requests and mandatory clauses are filtered before ranking. Invalid amount/count, unclear budget scope/basis and unsupported city produce clarification, not invented answers. |
| Grounding | Only published eligible IDs; integer group totals; no over-budget or unknown/stale price used as a confirmed match; capacity/family/season constraints preserved. Price estimates never become verified prices. Provider diversity breaks exact relevance ties only. |
| AI | Existing server-only Responses structured extraction/ranking reused. Returned preferences are now validated even for alternate AI providers. Ranking rejects unknown/duplicate/missing IDs, invalid scores and unsupported reason codes. No model free text can invent listing facts. |
| Fallback | `AI_MODE=rules`, missing key, unpaid gate, extraction/ranking failure: deterministic rules, clearly labeled `rules_fallback` / `degraded`. No fake AI response. Clarification and no-match envelopes remain unchanged. |
| Accounts / offers | Existing Supabase Auth signup/login/email callback, traveler/business profiles, server-derived owner IDs, create/edit/archive listings, catalog/details, favorites and RLS reused. Business account type alone grants no ownership. New published eligible offers are read on the next recommendation request. |
| Saved preferences | `/account/preferences` and `/api/account/preferences`; own-user editable cities/categories/group/budget/kinds/style/accessibility notes. Explicit saved-preference button uses the existing recommendation contract for supported fields; no automatic hidden personalization. |
| Business settings | `/business/settings`, private `/api/business/settings`, public `/api/businesses/[id]/settings`; optional English name, service areas, types, licensed image URL, descriptive group/price ranges, self-declared licensing. Per-offer prices/capacity remain authoritative. |
| License privacy | `yes`, `no`, `pending`, `undisclosed`; optional authority/registration number/expiry stay owner-private. Public response whitelists fields and validates a strict projection. The owner's body and database write grants cannot set `license_verification_status`. Public label explicitly says self-reported, unverified. |

## Database and Auth setup

Use Node **24.x** and `npm ci`. Copy `.env.example` to `.env.local` only if the file does not exist. Keep credentials out of Git.

Default `.env.example`: `DATA_MODE=seed`, `AI_MODE=rules`, `ALLOW_PAID_AI=false`, `APP_ORIGIN=http://localhost:3000`. `npm run dev` runs discovery without any account/key. Account persistence requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `DATA_MODE=supabase`. No service-role key is used by the runtime.

Review and apply migrations **001 → 006** manually to the intended Supabase project; do not reset an existing database. Existing migrations cover businesses/activities/provenance, catalog metadata and public provider views, curated tourism, profiles/Auth onboarding/favorites/details and expanded provider geography. New `006_preferences_business_settings.sql` adds:

- Profile creation/update timestamps.
- `user_preferences`: own-user JSONB payload, timestamp, Zod validation in routes and owner RLS.
- `business_settings`: typed profile/service/group/price fields, four-state licensing, owner-private optional license details, separate server-controlled review status, owner RLS and column-specific write grants.
- `public_business_settings`: published-business public projection, excluding registration/authority/expiry/owner IDs; explicit anon read grant. No public base-table read grant.
- Timestamp triggers; changing a self-declaration resets an existing review flag to unverified.

Then review/run existing base seeds, `seed_tourism.sql`, `seed_details.sql`, and `seed_marketplace.sql`. Optional `seed_marketplace_demo.sql` belongs in a separate demonstration database only. Seeds retain stable IDs, do not claim owners and do not overwrite existing records. SQL generation test tolerates Windows checkout line endings while comparing all SQL content.

Configure Auth Site URL and exact `/auth/callback` URL for localhost/deployment. Confirm email, create a business profile, then open business settings/manage. Migrations, signup sessions, live persistence and RLS must be verified in the actual project before production use. None were applied to a live database during this task.

## Additive API shapes

Existing envelopes/contracts are unchanged. New endpoints use `{data: ...}` and existing error envelope/status helpers; same-origin mutation validation is enforced.

- `GET /api/account/preferences` returns settings/defaults for the verified user. `PATCH` accepts the **complete strict** `UserPreferencesSchema` object (all fields required), upserts with the server-derived user ID. Unknown actor fields are rejected.
- `GET /api/business/settings` returns `{data:{settings,license_verification_status}}` for the owned business; `PATCH` accepts the complete strict `BusinessSettingsSchema`, with server-derived business ID. An absent row gives defaults; a missing table gives 503, not fake success.
- `GET /api/businesses/:id/settings` returns the `PublicBusinessSettingsSchema` projection or null. In seed mode licensing is unknown/null; no fictional license declarations are added. A private field accidentally added to the DB projection fails closed.

Schemas: `src/contracts/settings.ts`. Monetary payload values are integer fils. Optional values use null; selected arrays are explicit, including empty arrays. HTTPS photo URLs require rights acknowledgment; no document upload is provided.

## Frontend integration

Existing account context/Auth forms and design classes are reused. New settings forms have loading, validation, retry, saving, error and success states. Links are added only to existing account/business-profile pages; provider pages display the public license declaration.

The visitor change is intentionally small in `src/components/visitor/explorer.tsx`: imports, one saved-preferences handler, and buttons for **natural request first** and **explicit saved preferences**. Preserve the frontend team's redesign when resolving that file; transplant these additions into their updated layout. Ordinary form fields still override the query by contract. Natural-request-first sends `overrides:{}` and shows existing clarification controls.

Saved recommendations currently apply supported destination cities, group size/type, interests and group activity budget. Unsupported saved cities fail explicitly with guidance to full-geography discovery. Home city, desired listing kinds, trip style and accessibility notes are editable stored preferences, **not enforced v1 recommendation constraints**; the UI explains this. Accessibility and safety are never inferred from tags. Do not claim advanced personalization.

## Demo and verification

Without credentials: run `npm ci`, `npm run dev`, open `/explore`, type **إحنا 4 صحاب بإربد ومعنا 60 دينار وبدنا طلعة طبيعة** and press **حلّل وصفي أولًا**. It extracts friends/count/city/group budget and asks whether the budget covers the activity. Confirm that basis; results are labeled rules, and unavailable matches stay unavailable.

Try **بدنا أكواخ بعجلون فيها إطلالة**: clarify the group size; only declared cabin candidates survive. Try **اقترحلي أماكن سباحة مناسبة للعائلة**: clarify size; family and swimming are constrained, with no unsupported safety promise. Try an impossible budget; no-match does not relax it. Supported city defaults can be changed via ordinary controls. Full-geography `/api/tourism` remains deterministic discovery, including Petra/Aqaba; v1 only supports its original nine locations.

Open `/businesses` → provider page: real providers remain independent/unclaimed; demos remain explicitly fictional. Existing `/signup` local demo → business profile → `/business/manage` → publish supports browser-only offers, discovery and a separate local rules recommendation section. New saved preferences/licensing do not claim production persistence in demo mode.

With an actual Supabase project, manually verify two users/business owners: save/reload preferences, save each license state, create/edit/archive an offer, confirm fresh discovery/recommendation eligibility, and verify owner B cannot read/write owner A's settings directly via Supabase. An anonymous public-settings request must not return registration/authority/expiry. Attempt direct authenticated writes of `license_verification_status` and expect permission denial. These are required live checks, not automated-test claims.

Real AI is opt-in: only after approving paid usage set `AI_MODE=hybrid`, `ALLOW_PAID_AI=true`, `OPENAI_API_KEY`, existing `OPENAI_MODEL`; use Supabase mode and an authenticated user. Responses calls are bounded, have no retries, and use `store:false`. No paid request was made during this task. Keys never enter browser code. See [official structured outputs guidance](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

Verified locally: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and **143 tests across 17 files passed**. The production build ran on port 3200; all existing Chrome smoke/premium/final/marketplace suites plus the new `scripts/browser-backend.mjs` passed using an isolated browser. The new browser check exercised natural Arabic → clarification → actual rules cards, honest account/settings gates, unknown-license status, and mobile layouts with no uncaught runtime exceptions. Automated tests cover Arabic examples/invalid input, unsupported geography, mandatory filtering before ranking, post-ranking metadata changes, saved mapping, actor spoofing, authorization failures, cross-origin writes, private settings scoping/public projection, plus the existing contract/price/data/AI/ownership suite. Database calls and AI are mocked; static SQL review is not a live RLS execution test. Local Node is 22.19.0; project/CI require 24.x. The existing lockfile audit reports five high development-tool dependency findings in the ESLint/glob chain; a breaking downgrade suggested by npm was not applied.

## Integration / delivery

The final-submission request supersedes the original no-merge instruction and authorizes normal Git publication after checks. Deployment, paid calls and live SQL application were not performed. For continuing backend feature work after submission:

```powershell
git push -u origin feat/backend-ai-accounts
```

Open a PR from `feat/backend-ai-accounts` to `main` at https://github.com/Malbarbari/jordan-local/compare/main...feat/backend-ai-accounts. Coordinate the Explorer integration with the frontend branch before merging; preserve all teammate commits and branch protection. Re-run checks after conflict resolution. Do not force-push or discard frontend work.

Modified existing files: README, account/profile links, provider license component integration, Explorer's optional actions, recommendation preferences/discovery/service/freshness checks, portable marketplace SQL test. New files: settings schemas/routes/pages/components, saved mapping, migration 006, Arabic/settings/public/privacy/freshness tests and this handoff. No catalog data, existing contract fixtures, dependencies or environment secrets changed. No application files deleted.

Remaining before submission: live Auth/PostgreSQL/RLS verification, optional approved live AI test, frontend branch integration and review/PR merge. Follow-ups: secure private Storage and administrative license evidence verification, full-geography AI contract extension, recommendation history/privacy retention, richer language negation/dates and personalization. No payments/booking/chatbot added.
