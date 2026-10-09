# Deployment and QA runbook
Planning checklist; no boxes imply completed work.

## Deployment — P1
1. Confirm the first vertical slice locally before optional features.
2. Import the GitHub repository into Vercel as a Next.js project; production branch main, Node 24.
3. Add public Supabase URL/publishable key and server-only OPENAI_API_KEY, OPENAI_MODEL, APP_ORIGIN, DATA_MODE, AI_MODE. Configure environments separately and redeploy after changes.
4. Use a stable production URL for Supabase Site URL and explicit permitted redirects. Add localhost only for development. Do not use a broad arbitrary redirect wildcard.
5. Verify current @supabase/ssr cookie refresh and no-store behavior on the deployed domain.
6. Keep /api/recommend on Node runtime, no static export. Do not store writes in the hosting filesystem.
7. Check hosting-plan eligibility and collaboration permissions. Vercel Hobby is for personal non-commercial use; do not describe it as a free commercial production plan. If necessary use an already available eligible plan; do not change the stack mid-event.
8. Only P1 handles production deploy settings. Test whether contributions/commits can deploy under the chosen Git integration plan early; use a documented authorized leader deployment if previews are unavailable.
9. Verify the production link from a clean browser session. Do not assume a dashboard "success" means the app works.

## Required gates
| Check | Owner | Expected evidence |
| --- | --- | --- |
| Fresh clone + npm ci | P1 | consistent lockfile; app starts |
| lint, typecheck, unit tests, build | each owner then P1 | actual command results |
| real extraction + rank | P2 | model ID, token usage, valid results |
| matched-constraints personalization | P2 | baseline/hybrid comparison, changed semantic ordering |
| business A create → next candidate set | P3 + P2 | created DB ID appears without redeploy/retraining |
| no-session write | P3 | 401 via route; blocked by RLS |
| visitor writes a business listing | P3 | 403 or rejected DB write |
| business A changes B's ID | P3 | 404/zero rows; B's row unchanged |
| forged business_id/verification fields | P3 | request rejected and direct DB write denied/neutralized |
| direct Supabase API bypass attempt | P3 | same ownership/provenance protections |
| family/budget/capacity constraints | P2 | fixture tests + live scenario |
| missing/stale price | P2 + P4 | excluded under strict budget, clearly labelled in browsing |
| unknown/duplicate LLM ID | P2 | rules_fallback, no invented record |
| timeout/API error | P2 + P4 | clear fallback or clarification, no endless spinner |
| database failure | P3 + P1 | 503 or explicitly activated read-only mode |
| Favorites per-user, if shipped | P3 + P4 | isolated, persistent, idempotent |
| mobile 360px, 390px, desktop | P4 | no overflow, readable RTL/mixed numbers |
| keyboard/errors/contrast | P4 | labels/focus/error recovery |
| no secrets in repo/client/logs | P1 | staged files reviewed; only public env exposed |
| deployment/relogin/refresh | P1 + P3 | cookies and current data work on production |
| submit link visibility | P1 | clean-browser access and receipt |

Do not claim end-to-end security from API mocks alone. RLS tests need real authenticated contexts. A direct RLS UPDATE may succeed with zero affected rows; assert the stored row remains unchanged.
No blanket disabling of RLS or client-exposed privileged key is an acceptable fix.

## Authentication choice
P0 uses managed password login and three accounts provisioned through the Auth dashboard with consented team-controlled emails. Passwords are never stored in application tables or docs.
Guests may browse. P0 live recommendations require a signed-in account. Full signup/email verification/business onboarding is P1 because it adds delivery and support risk.
The business role comes from server-visible ownership, not editable user metadata.
Separate browser profiles keep business and visitor sessions independent during the demo.

## Data QA — 45-minute cap for initial curation
- P3: 10 minutes select eight destination pages from Visit Jordan; 15 minutes extract short factual location/category descriptions and exact source URLs; 10 minutes generate clearly synthetic offers; 10 minutes validate nulls, duplicates and foreign keys.
- Begin with six records for integration. Expand to 24 only after the vertical slice works.
- Use normalized title+location+business for duplicate detection; stable seed UUIDs and an idempotent seed prevent accidental duplicates.
- Limit locations to the agreed dictionary with sourced coordinates. Bounds alone do not prove a coordinate belongs to Jordan.
- Every real source_checked fact has source_url and checked timestamp. Price provenance is separate.
- Match approved image_path values to actual local files. A missing image uses a neutral placeholder, not a broken remote request.
- New valid business listings are published immediately in the prototype as owner-declared/unverified. This proves data freshness, not provider legitimacy.
- Apply any shared SQL only once, in recorded order, after review. Never rerun destructive seed resets during the live demo.

## Backup and release
- Primary: verified deployed build + real Supabase + real model.
- Backup A: same known-good build on the leader's laptop using npm run build then npm start. It still needs internet for Supabase/OpenAI.
- Backup B: DATA_MODE=seed with read-only banner; AI live if network works, otherwise AI_MODE=rules with a clear non-AI label.
- Backup C: a 60–90-second recorded successful run from the actual build. Say it is recorded; never present it as live.
- Keep the last known-good deployed version. Record the Git commit/tag and environment mode used in the recording.
- No destructive reseeding five minutes before the pitch.

## Submission checklist
- [ ] Functional deployed P0 with a publicly accessible landing page and privately provided demo access.
- [ ] Repository visible to judges and main contains the final source.
- [ ] README documents exact setup, migrations, seed, variables, roles and implemented limitations.
- [ ] Agent/spec/contracts/tasks files match the final implemented contracts.
- [ ] Measured AI evaluation and real-vs-mocked distinction.
- [ ] Source provenance and synthetic labels visible in UI and seed.
- [ ] No leaked secrets, real personal data without consent, fake reviews or business partnerships.
- [ ] Pitch deck exported to a format accepted by the organizers.
- [ ] Seven-minute rehearsal; 60–90-second backup recording.
- [ ] Local working backup and charger/network plan.
- [ ] Final links checked by a teammate in a clean browser.
- [ ] Submission receipt verified by 12:15 Asia/Amman; deadline 13:00.

