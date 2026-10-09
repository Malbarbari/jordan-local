# Leader implementation and handoff

Implemented locally: strict Zod API v1 DTOs, four serializable synthetic recommendation fixtures, RTL shell/tokens, native Button/Input/Card/Badge primitives, login UI, business list/create UI, CI and environment template. Visitor, AI, backend and database paths remain owned by P2/P3/P4.

## Frozen public interfaces
Import schemas/types from `@/contracts` and fixtures from `@/contracts/fixtures`. Schemas use PascalCase names ending in Schema; inferred types use the API contract names. Button/Input accept native React element props including className; Card uses section HTML attributes; Badge uses span HTML attributes. No required custom props. Button callers should specify type within forms. Money uses integer fils. Wire DTOs remain API v1; text safety bounds are title 200, description 4000, notes 2000, price/capacity signed int32. Image paths accept only local /images assets.

## P3 integration request
`src/lib/supabase/client.ts` does not exist. Leader-owned `src/components/business/client.ts` deliberately fails managed signIn with 503. Once P3 supplies createClient(), replace that function with:

```ts
import {createClient} from "@/lib/supabase/client";
export async function signIn(email:string,password:string):Promise<void>{
  const {error}=await createClient().auth.signInWithPassword({email,password});
  if(error) throw new ApiError("Unable to sign in. Check your credentials.",401);
}
```

Login then uses GET /api/me to select the visible role. Business uses GET /api/activities?mine=true and POST /api/activities. These routes are absent in this checkout. Do not claim real login, publishing, persistence or RLS until P3 implements and validates them. Do not introduce a second auth client. No passwords are persisted or logged by this UI.

## Explicit local UI demo
Set NEXT_PUBLIC_UI_DEMO=true in .env.local and restart dev (rebuild for production builds). /login displays a separate demo button requiring no credentials. /business displays synthetic rows. SessionStorage contains only the demo role marker; new listings live in module memory and disappear on full reload. This mode never calls Supabase and cannot prove ownership isolation, durable publishing or fresh recommendation candidates. Keep false for production and real integration. DATA_MODE=seed is a separate P3-owned read-only backend mode; the UI shows the server's DEMO_READ_ONLY error and must not enable business writes.

## Manual integrated smoke checklist (pending human execution)
- [ ] Node 24; npm ci; lint/typecheck/tests/build pass in a clean checkout.
- [ ] Demo disabled: no session gets 401; visitor gets 403; no create form usable.
- [ ] P3 browser client: wrong password shows an error; login pending button disables duplicate submit; business login routes to /business, visitor to /explore.
- [ ] Business A lists only A records including archived; B records never appear.
- [ ] Empty list, loading, retry after network failure, timeout and 503 read-only are visible.
- [ ] Empty title/description, paid zero/negative price, fractional capacity, invalid month and duration show errors and send no POST.
- [ ] Server 422 field error appears; retry works; pending create cannot be submitted twice.
- [ ] Valid create uses only editable fields, receives complete Activity, shows success, reloads own list; full page refresh preserves the real row.
- [ ] Synthetic/unknown/free prices differ visibly; no bookable/live availability claim.
- [ ] New row enters P2's next candidate set without retraining or redeploy.
- [ ] P3 verifies cross-owner API/direct RLS writes and protected provenance fields against real accounts.
- [ ] 360px, 390px and desktop: RTL, mixed numbers, keyboard focus, screen reader field errors, no overflow.
- [ ] P2/P3 review leader changes before merge; leader cannot self-approve.

## Human deployment steps
1. Integrate reviewed P2/P3/P4 modules and replace unavailable signIn adapter. Re-run every check and integrated flow.
2. Use Node 24, npm ci, npm run build, npm start locally. Record exact migration/seed filenames supplied by P3 and apply only after review.
3. Import the repository into the team's authorized Vercel project, production branch main. No deployment has been performed by this agent.
4. Add variables from .env.example privately. APP_ORIGIN must equal production origin; NEXT_PUBLIC_UI_DEMO=false. Never add a runtime service-role key. Configure Supabase Site URL and explicit permitted redirects through the human owner.
5. Deploy the reviewed main commit, verify a clean-browser login/create/refresh/visitor recommendation flow and real ownership checks; record URL, commit and observed mode in README.
6. Prepare local build backup and clearly labelled recording; do not present either fixtures or a recording as a live API.

Suggested PR title: feat: shared v1 contracts and RTL business publishing UI
