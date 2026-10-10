# Judge demo — طشه Tashah

## Exact setup

Install Node **24.x** and Git. No OpenAI or Supabase keys are needed for these scenarios.

```sh
git clone https://github.com/Malbarbari/jordan-local.git
cd jordan-local
npm ci
```

PowerShell:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

macOS/Linux: `test -f .env.local || cp .env.example .env.local`, then `npm run dev`.

Keep `DATA_MODE=seed`, `AI_MODE=rules`, `ALLOW_PAID_AI=false`, and `APP_ORIGIN=http://localhost:3000`. Open **http://localhost:3000**. Frontend and API run together. Production demo: `npm run build`, then `npm start` after stopping the dev server.

## Scenario 1 — Arabic request to grounded recommendations

1. Open `/explore`, scroll to **شو بتحب؟ ومع مين طالع؟**.
2. Without changing planning fields, paste **إحنا 4 صحاب بإربد، ميزانيتنا 60 دينار، وبدنا طبيعة ومغامرة.** and press **اكتشف خياراتي**. Alternatively **حلّل وصفي أولًا** ignores form values.
3. Confirm the activity-only budget when asked. Displayed preferences must show Irbid, four friends and 60 JOD for the group.
4. Inspect images, explanations and calculated group totals. The engine says **اقتراحات بالقواعد**: deterministic fallback, not live AI.
5. Open listing details and a linked business profile. Fictional offers remain labeled. Change the budget to zero through the form and submit; paid offers disappear rather than receive invented discounts.

More prompts: **بدنا أكواخ بعجلون فيها إطلالة** (clarify size); **اقترحلي أماكن سباحة مناسبة للعائلة** (family/swimming declarations do not confirm safety); **بدي هايكنق ومغامرة بس ميزانيتي قليلة** (provide numeric budget and group size). Unknown inputs produce clarification/no-match, not fabricated records.

## Scenario 2 — Destinations and local businesses

1. Open `/explore`; search **البتراء**, select its region/category and open its destination page. Observe licensed photos, sources and conditional admission prices.
2. Open `/businesses`: 16 seed profiles, real providers independent/unclaimed and five fictional demo businesses.
3. Open **رِواق إربد** (fictional provider) and an offer. With four people, per-person pricing calculates a group total. Unknown/conditional real prices retain their limitations.
4. Open `/listings/71000000-0000-4000-8000-000000000008`: the sourced Wadi Rum price applies to groups of 3–6 only. Two people show contact-for-price; four calculate 80 JOD. Do not generalize that tariff.

## Scenario 3 — Business submission without fake persistence

1. Open `/business`, enter a valid activity and generate the existing **temporary preview**. This does not publish to a database.
2. Optional richer local demo: `/signup` → explicitly choose the local business demo → `/business/profile` → `/business/manage`. Create a clearly fictional offer.
3. It appears in that browser's discovery and a separate local rules recommendation section when eligible. Edit/archive it and check the result. Logout clears local state.
4. This is not authentication, production persistence or a real provider claim; no email/password is collected. Preference/licensing pages explain that persistent saving requires Supabase.

## External services and truthful presentation

Without credentials: homepage, local images, discovery/search/filters, destinations, business directory/offers/details, rule recommendations, clarification/no-match and preview work.

With Supabase: actual signup/email confirmation/login, persistent owned profiles/offers, favorites/preferences and owner-private self-reported licensing are implemented. Apply migrations 001–006 and reviewed seeds as in README. Verify actual Auth/database/RLS before claiming production readiness.

With approved OpenAI configuration: server-side Responses extracts/ranks only eligible IDs and falls back on failure. A server key, Supabase mode, authenticated user, `AI_MODE=hybrid` and `ALLOW_PAID_AI=true` are required. Never call the default demo a live model response.

The existing [presentation outline](docs/DEMO-PITCH.md) is preserved. Present the problem, local-business mission, grounded recommendation pipeline, the scenarios, technology and honest next steps. Do not claim measured revenue, model accuracy or verified business licenses.

## Final quick demo
Enter: **بدي طشّة طبيعة قريبة من عمّان بميزانية ٢٠ دينار** and press the primary recommendation button. The visible quick-demo defaults are one person, activity-only budget, Amman/Salt/Jerash; road distance is not calculated. Change form fields for a different group. Seed results are explicitly labeled demo/rules, not live AI or verified bookable offers.
