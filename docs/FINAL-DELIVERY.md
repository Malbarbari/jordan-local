# Jordan Local — marketplace delivery and team handoff

Verified local implementation: 2026-10-10. GitHub publication is recorded below after remote verification. No deployment, paid API calls, database migrations or live Auth configuration were performed.

## Completed application

Arabic RTL responsive discovery, full listing pages, licensed photo credits, source-based and conditional pricing, integer-fils calculators, group-budget recommendations, clarification/no_match/degraded states, deterministic fallback, traveler/business accounts, favorites and an owned listing editor are integrated in the existing repository. The frozen v1 contract, fixtures, dependencies and existing AI/filter modules remain intact.

The homepage business section links to /businesses and full provider profiles. All offers navigate to their real catalog IDs. Default tourism catalog: 55 listings (32 retained sourced entries, eight new sourced offers, 15 fictional offers). Directory: 11 real providers plus five fictional demo businesses, three offers each. Existing six real-provider listings are retained, giving 14 real provider listings across the directory.

## Real providers and sources

Profiles are independent, unclaimed third-party entries. Source evidence confirms advertised identity/offer information, not current availability, ownership, safety certification or partnership. Names never grant account access. Sources were checked 2026-10-10. Public contacts are included only where published; missing contacts remain absent. No protected scraping or provider-image copying was used. RSCN is a conservation operator; the remaining profiles cover community hospitality, cooking, farm experiences, camps and diving across north/center/south.

| Provider | Region | Source |
| --- | --- | --- |
| RSCN / Wild Jordan | ajloun | [Public source](https://www.rscn.org.jo/) |
| Jordan EcoPark | jordan-valley | [Public source](https://jordanecopark.com/accommodation) |
| EcoHotels / Feynan Ecolodge | dana | [Public source](https://ecohotels.me/feynan) |
| Al Kifah Society / Summaga Café | ajloun | [Public source](https://international.visitjordan.com/wheretogo/ajloun/) |
| Carob Farms | madaba | [Public source](https://international.visitjordan.com/wheretogo/madaba/) |
| Baraka Destinations | umm-qais | [Public source](https://barakadestinations.com/) |
| Beit Sitti | amman | [Public source](https://beitsitti.com/) |
| Petra Kitchen | petra | [Public source](https://petrakitchen.com/reservations/) |
| Deep Blue Dive Center | aqaba | [Public source](https://www.deepbluedivecenter.com/aqaba-daily-scuba-diving-prices/) |
| Wadi Rum Tours / Saleh’s Safari Camp | wadi-rum | [Public source](https://www.wadirumtours.com/tour-prices/) |
| Wadi Rum Bedouin Camp | wadi-rum | [Public source](https://www.wadirumbedouincamp.com/3-hours-jeep-tours/) |

## Offers, price provenance and images

New real offers: Beit Al Baraka stay and Amman city walk (Baraka); cook-and-dine (Beit Sitti); evening cooking class (Petra Kitchen); introductory shore dive and snorkel boat trip (Deep Blue); three-hour 4×4 tour (Saleh); three-hour jeep tour (Wadi Rum Bedouin Camp). No hypothetical activity is attributed to a real company.

Petra Kitchen publishes 35 JOD/person including course, meal, non-alcoholic drinks and recipes. Bedouin Camp publishes 20 JOD/person only for 3–6 people; the calculator rejects parties outside that range. Saleh’s 70 JOD group tariff has a specific family definition, so the calculator requests confirmation instead of promising arbitrary group totals. Deep Blue publishes amounts but the billing unit is not explicit; it remains unconfirmed. Existing EcoPark 45 JOD cabin billing period remains unspecified. Other provider prices show contact-for-price. No group capacity is invented for real listings; strict recommendations exclude unconfirmed capacity.

Five fictional businesses: Riwaq Trails, Olive Cloud, Story Table, Earth Break, Sand Stories. Each has three fictional offers with varied person/group/night prices, explicit capacity and inclusions. All are marked demo, have no real contacts, websites, reviews or ratings. Five former demo quotes attached to real providers were removed. No fictional price remains attributed to a real business.

All offer photos reuse licensed local regional images with explicit illustrative captions, rather than pretending to show a provider’s facility. The image manifest preserves authors, licenses and sources. Missing actual provider media uses original generic artwork. Chrome decoded existing licensed photos and new reused offer images successfully.

## Recommendations and business accounts

Marketplace-compatible activities, metadata and provider references enter existing loadActivities/enrichCatalog, so server recommendations use valid existing offer IDs, provider links, hard eligibility and integer group totals. The Irbid four-friends/70-JOD scenario includes fictional hiking offers at 48 and 60 JOD. Ajloun four-friends/80-JOD includes a fictional hike at 72 JOD. No new AI engine was written. Responses structured-output validation/fallback remains opt-in and server-only.

Managed Auth/RLS routes create/edit/archive only the verified user’s business offers and read fresh published rows for recommendations. Profile account_type is display information, not authorization. No ownership claim flow exists for researched businesses. Without credentials, an explicit browser-local account demo saves fictional profiles/listings/favorites only in localStorage; its newly created offers appear in discovery and a separately labeled local rules recommendation overlay using shared hard constraints. It never changes the server response or sends client fixtures to AI.

## Database and team setup

Use Node 24 and npm ci. Copy .env.example only if .env.local is absent, then npm run dev. Default seed/rules mode needs no credentials. Review migrations 001–005, existing seeds, real seed_marketplace.sql; apply manually to configured Supabase. Optional seed_marketplace_demo.sql is for an isolated demo database only. New marketplace SQL uses stable IDs and ON CONFLICT DO NOTHING, retaining existing records. Re-generation was checked byte-for-byte. No SQL was applied.

README.md explains setup/environment/deployment prerequisites. TEAM_HANDOFF.md identifies the original AI/filtering modules, additive loaders/contracts, owner boundaries and live verification checklist. docs/API_CONTRACT.md and its fixtures remain unchanged. docs/MVP-DEMO.md contains the three visitor/provider/business demonstrations; docs/MVP-SETUP.md covers live service setup.

## Observed verification

- npm run lint: passed with no warnings.
- npx tsc --noEmit: passed.
- npm test: 111 tests passed in 13 files. Existing Vitest native-config advisory remains non-failing.
- npm run build: passed; all application/API routes compiled.
- Four isolated Chrome suites passed: original smoke, premium discovery, final account/details flows, and new marketplace. Coverage includes source/demo separation, photos, conditional/group/night arithmetic, recommendation/provider IDs, listing/profile navigation, local publication/reload/recommendation, favorites, edit/archive, error/retry, dialogs and mobile widths. No uncaught runtime exceptions in successful suites. Sharing uses a clipboard stub; real OS sharing is not claimed.
- SQL seed regeneration is deterministic; mocked server tests verify ownership scoping. Actual PostgreSQL policy execution is not claimed.

## Cleanup and remaining work

Removed docs/LEADER-REPORT.md and docs/MVP-DELIVERY.md: obsolete snapshot reports with no current code/contract dependencies; current setup/validation/handoff is consolidated here. Retained docs/LEADER-HANDOFF.md because the frozen API contract references it. Removed five misleading fictional quote entries from real providers. No uncertain code/assets, contracts, migrations, lockfile or teammate work were deleted. Screenshots, build output, dependencies, logs, environment files and caches remain ignored.

Real Supabase Auth/PostgreSQL/RLS and live paid Responses calls still require credentials/setup and explicit paid-usage approval. Full-geography AI needs a reviewed additive contract; v1 remains nine cities. Media file uploads, verified provider claims and deployment are follow-ups. No booking/payments/chatbot, fake reviews, fabricated availability or production-persistence claim was added.

## Publication

Repository: [Malbarbari/jordan-local](https://github.com/Malbarbari/jordan-local). Work remains on feat/leader-foundation; publication uses a normal fast-forward to main only when remote ancestry permits it; protection/conflicts require a reviewed PR. The final handoff response records the exact commit and remote verification. Never force-push, reset teammate changes or bypass branch protection.

Verified marketplace implementation commit: `ec11f42eea7e63b62c5745f6f964e4f99fb5ff84`, published to main and feat/leader-foundation by normal fast-forward. [Node 24 CI](https://github.com/Malbarbari/jordan-local/actions/runs/38022825586) passed checkout, npm ci, lint, typecheck, all tests and build on that exact implementation. Subsequent handoff/navigation corrections are published normally; `git log -1 origin/main` identifies the final delivery commit. No remaining merge step was required for that publication.
