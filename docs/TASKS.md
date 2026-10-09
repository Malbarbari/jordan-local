# Four-person execution board
All times Asia/Amman. Schedule anchor: Friday 2026-10-09 16:30. If starting later, cut P1; do not move final freeze/submission gates.
Each human uses their existing VS Code + Codex setup, one checkout, one feature branch, and one active coding agent. An already-familiar Cursor or Claude Code setup is acceptable; switching tools is not a task.

| Person | First task | P0 priorities | Inputs | PR checkpoints | Acceptance | After merge |
| --- | --- | --- | --- | --- | --- | --- |
| P1 Leader | Bootstrap repo, contracts, lockfile, ownership | shared shell/primitives; login UI; business list/create UI; reviews/deploy | P3 Auth client/API; P4 design tokens | bootstrap by 17:00; shared contracts by 17:30; business UI by 20:15 | fresh clone runs; contract fixture shared; create form saves; main deployed | integration smoke, README, pitch and submission |
| P2 AI | Make one real structured extraction/ranking request using 6 fixtures | pure constraints; parsing; semantic scorer; validated ranking; recommend route | P1 contracts; P3 loader/auth helpers | draft by 17:00; engine 18:00; vertical slice 18:30; eval by 21:30 | no invalid IDs/constraint violations; AI affects rank; explicit fallback | run real evaluation, measure latency/tokens, technical pitch |
| P3 Backend/data | Supabase schema/RLS + Auth helper; 6 initial records | GET catalogue; verified Auth; business create; 24-record seed | P1 contract; demo emails with consent; P4 image names | auth/read PR 17:45; create/seed 19:45 | persists after refresh; next request sees new row; A cannot mutate B | edit/archive and favorites only after P0; authorization QA |
| P4 Visitor UI | Explore page against a contract-matching fixture | input form; clarify UI; result cards/states; home; mobile/RTL | P1 primitives/types; P2 response shape | draft 17:00; mock UI 17:45; real wiring 18:30 | valid API wiring; visible data labels; 360px and desktop work | P1 Saved UI, usability QA, images and demo operation |

## First 60 minutes
| Offset | P1 | P2 | P3 | P4 |
| --- | --- | --- | --- | --- |
| 0–10 min | scaffold + repository + env example | inspect model access and two structured schemas | create Supabase project; inspect RLS/Auth quickstart | sketch one Explore layout and card; choose 4 images |
| 10–25 min | write shared contracts/fixture and push bootstrap | prototype against 6 local fixtures; test budget ambiguity | schema/constraints/RLS; provision accounts | build visitor component against exact fixture |
| 25–40 min | shared UI + deployment import | deterministic group-cost checks and semantic rank | GET catalogue + server Auth helpers | loading/empty/error/clarification states |
| 40–60 min | confirm dependency owners, review first small PR | show real response, usage, changed ranking | demonstrate DB read and authenticated actor | run Explore using contract fixture; ready to wire |

Do not wait idle for the leader: P2 can run an isolated API experiment, P3 can prepare SQL, and P4 can sketch components before the bootstrap is pushed. Only the leader scaffolds the shared application.

## Fixed gates
- 17:00: API model access established; shared repo exists. If a tool login fails, use the team's already-working tool.
- 17:30: contract v1 frozen; each owner has a compiling local module or explicitly marked stub.
- 18:30: first UI → /api/recommend → live LLM → database-ID results.
- 19:15: first deployed vertical slice, before business polish.
- 20:30: business A publishes; another session sees fresh candidate data; cross-owner write denied.
- 21:30: 24 provenance-labelled records; evaluation draft; optional features evaluated.
- 22:00: P1 gate. Only edit/archive and Favorites if P0 is green.
- 23:00: feature freeze. No new screens or dependencies.
- 23:00–23:30: fix critical issues, save backup video, commit handoff notes.
- 23:30–07:00: rest; no planned overnight dependency work.
- Saturday 07:00–08:30: API/RLS/AI/mobile QA, critical fixes only.
- 08:30–09:30: production smoke, documentation, measured evaluation.
- 09:30: code freeze; emergency fixes require leader approval and rerun of affected checks.
- 09:30–10:30: deck finalization and two timed rehearsals.
- 10:30–11:30: final video, release tag, repository/link access verification.
- 11:30–12:15: submit all deliverables and verify receipt.
- 12:15–13:00: upload/network buffer. Actual deadline 13:00.
- 13:30: presentations begin according to the supplied brief.

About 10–11 focused team-hours per person remain in this schedule after breaks, not 20+ coding hours. The brief's original 11-hour allocation is not assumed to be untouched.

## Dependency order
bootstrap/contracts → Auth+read loader → AI engine + visitor mock UI → real recommendation wiring → deploy → business create API + UI → fresh-data demo → optional favorites/edit → stabilization.
Merge small modules every 45–60 minutes. Create a fresh branch after a completed branch is merged.

## Emergency cuts
- No live LLM by 17:30: P2 and P1 resolve credentials/schema only; P4 pauses decoration.
- No vertical slice by 19:15: drop separate landing polish, profile, signup, Favorites, edit/archive.
- Supabase blocked for 45 minutes: leader activates read-only seed fallback; disclose lost business persistence and continue recovery with P3.
- Business create blocked at 21:00: keep create/list only; reuse the shared form components.
- Any P0 failure at 22:00: cancel all P1.
- After 09:30 Saturday: only critical regression fixes. Do not swap framework/provider.

