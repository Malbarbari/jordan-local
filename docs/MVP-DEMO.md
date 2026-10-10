# Three reliable demo scenarios

Run the seed/rules app locally. All fallback/model and local demo disclosures remain visible. Do not promise bookings, production persistence or live AI when it is not configured.

## A — Four friends in northern Jordan

Say: «إحنا 4 صحاب بإربد، بدنا طلعة حلوة بميزانية 60 دينار».

1. Open the homepage planner (the group-budget link under the hero). Set city Irbid, friends, four people and total group budget 60 JOD. Submit: this calls the existing POST /api/recommend, with valid existing IDs and deterministic group totals. Synthetic seed offers are labeled.
2. Explain that the total is the activity cost for the group; transport/meals are not assumed covered. Use clarification if budget scope is ambiguous.
3. Open /listings/60000000-0000-4000-8000-000000000002 for Umm Qais. Select the actual visitor category and four people; published ticket arithmetic is separate from total outing cost and unknown capacity. This is a public destination, not a privately owned landmark.

## B — Nature and adventure

Say: «بدي هايكنغ ومغامرة بالأردن، شو بتنصحني؟».

1. Use the hiking category or /explore?tour_tag=hiking. This is rules-based tourism discovery.
2. Open the Mujib Siq page /listings/60000000-0000-4000-8000-000000000017. Show the 2026 source-linked visitor categories and trail conditions. Check current safety/opening requirements with the operator before an actual visit.
3. Open Wadi Rum /listings/60000000-0000-4000-8000-000000000005. Show its two distinct licensed photos, next/previous lightbox, related regional listing and share control. Directions only appear on verified-pin records such as Umm Qais; do not invent one for Wadi Rum.
4. On fictional Olive Cloud cabin /listings/71000000-0000-4000-8000-000000000105 demonstrate the explicitly fictional nightly estimate: two rooms × two nights × 65 JOD = 260 JOD. It is not a provider quote or a strict budget guarantee.

## C — A small local tourism business

1. Show EcoPark/Summaga/Carob provider introductions from official sources. Source-linked identities do not imply partnerships.
2. Open /signup, choose business and explicitly start the local demo. The banner states browser-only storage without real Auth.
3. Fill /business/profile with a clearly fictional demonstration name, description, city and category. Open /business/manage, create an Irbid nature activity at 8 JOD/person with capacity 8 and friends selected.
4. Reload: the browser-only record remains. Search its title in /explore with four people and 60 JOD group budget: 32 JOD total. Open its page/provider, save it, visit /saved, edit it, then confirm removal. Logout clears the demo.
5. With configured Supabase, the same management UI uses actual verified accounts and persisted rows, and eligible v1 offers enter the next server recommendation. Do not claim that live path was verified before running MVP-SETUP acceptance tests.

## Backup and deployment

Keep a local production build: npm.cmd run build then npm.cmd start. Static bundled photographs and seed APIs do not require remote services; optional external source/maps links do. Keep a short recorded walkthrough as a clearly labeled backup. No paid model call is required for these demos. Vercel deployment needs explicit approval and the live checklist; it has not been performed.

## Marketplace demonstration (three scenarios)

1. On the homepage, set Ajloun, four friends, nature and 80 JOD group activity budget in the recommendation planner. Submit: an eligible fictional Olive Cloud hike costs 72 JOD total. Explain rules fallback and the visible demo label. Try Irbid, four friends, nature/hiking and 70 JOD: Riwaq Trails offers are eligible at 48 or 60 JOD. IDs, prices and provider links come from the shared catalog.
2. Open “اكتشف تجارب من أهل البلد” → fictional Riwaq Trails → three offer pages. Show illustrative regional photo credits, provider identity, inclusions and group calculation. Then open Petra Kitchen: 35 JOD/person comes from its official source; unknown capacity remains unconfirmed. The directory is independent and unclaimed.
3. /signup → business → explicit local demo → create profile → /business/manage: publish an Irbid nature offer at 8 JOD/person, capacity eight. Reload, find it in discovery, calculate four people = 32 JOD, then submit the recommendation planner for Irbid/4/nature/60 JOD. The new fixture appears in the separately labeled browser rules section. Save, edit, archive. These browser records are not production persistence or AI responses. With configured Supabase, perform the same flow with a real test account: the existing API persists the offer and the next server recommendation reads it freshly. That live step is unverified until credentials and migrations are available.
