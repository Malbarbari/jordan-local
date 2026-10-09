# Product specification v1
Project: Jordan Local / دروب الأردن (working name; no brand or partnership claim).
Deadline supplied by the team: 2026-10-10 13:00 Asia/Amman.
Exactly four humans. Deliver one reliable end-to-end path before additional pages.

## P0
- Home/Explore with Arabic RTL, English request support, responsive cards.
- Explicit controls for activity-only budget, per-person/per-group scope, party size, location, group type and interests.
- Natural-language extraction, clarification, deterministic constraints, LLM semantic ranking, grounded explanations.
- Supabase-managed login using provisioned test accounts. Guests browse; live AI requests require a signed-in test user in P0.
- Business dashboard: list own activities and create/publish an activity.
- Fresh database read on each recommendation; new valid activities become candidates without retraining.
- Real source/synthetic/unknown-price labels; no invented availability.
- Vercel deployment, README, GitHub repo, evaluation evidence, seven-minute demo/pitch.

## P1, only after P0 passes
1. Edit/archive own listing.
2. Favorites and Saved page with authenticated per-user persistence.
3. Saved visitor preferences and minimal profile.
4. Self-service managed signup and business onboarding; a new business remains unverified.
5. About section in the existing footer.
No P1 work may delay a P0 blocker.

## P2
Standalone chatbot, booking/payment, community submissions/moderation, interactive maps/GPS, reviews/popularity, recommendation history, provider analytics, embeddings/vector database, multi-step itineraries.

## User journeys
Visitor: browse → login if requesting AI → submit query/controls → clarify ambiguity → receive 3–5 alternatives → inspect cost/reasons/source → optional Favorites.
Business: login → see own dashboard → enter required facts → publish → next visitor request may include it if eligible and relevant.
No guarantee that every newly published listing appears in the top 3. Demonstrate candidate inclusion and genuine measured rank.

## Interpretation
- Each result is an alternative single activity for the whole party, not a bundled itinerary.
- Budget covers the listing's declared activity price only, not transport/meals unless explicitly included.
- Ambiguous budget scope, vague hard distance, missing party size when pricing/capacity needs it, and whole-trip budget requests require clarification.
- Date/season does not establish live availability; show "Contact the provider to confirm availability".
- Group capacity is declared maximum group size, not remaining bookable seats.
- Hard requirements with unknown values are not silently treated as satisfied.
- Resident/international status does not imply ticket eligibility; unknown differentiated ticket prices stay unknown.

## Dataset
Target 24 listings: 8 real destination information records + 16 clearly synthetic offers.
Destinations: Amman, As-Salt, Ajloun, Umm Qais, Jerash, Madaba, Dana, Wadi Rum.
Use a manually verified location dictionary including Irbid as an origin.
Public place facts come from exact official source pages. Prices, capacity, duration, provider identity and opening hours remain null unless independently supported.
Synthetic offers use explicitly fictional demo providers. They never borrow a real company's identity, contact, price, review or partnership.
Use four to six owned/licensed local images; document source, rights and attribution. Do not assume Visit Jordan photographs are reusable.
The JSON seed initializes Postgres; it is not a second live data source.

## Success gates
Two preference profiles produce meaningfully different AI rankings on the same eligible dataset.
Zero unknown IDs and zero hard-constraint violations in the evaluation suite.
Business A cannot update Business B's rows via either app API or direct Supabase client.
One newly published eligible activity is in the next candidate set.
The deployed build passes the same critical flow as local.
These are acceptance targets, not claimed measured results.

