# API contract v1 — freeze before parallel coding
P1 owns this file and src/contracts/index.ts. Field names are snake_case on the wire and in shared DTOs. Use Zod strict objects; reject unknown input fields.
Application limits: query <=1000 characters; body <=16 KB; party_size 1–30; nonnegative integer money; budget <=10000000 fils; duration 1–1440 minutes; max_straight_line_km >0 and <=500. These are prototype limits, not business claims.

## Shared types to implement
~~~typescript
type Locale = "ar" | "en";
type LocationId = "amman" | "irbid" | "ajloun" | "jerash" | "umm-qais" |
  "as-salt" | "madaba" | "dana" | "wadi-rum";
type Category = "nature" | "culture" | "food" | "adventure" | "heritage";
type GroupType = "family" | "friends" | "couple" | "solo";
type Environment = "forest" | "desert" | "urban" | "countryside";
type ReasonCode = "INTEREST_MATCH" | "GROUP_MATCH" | "WITHIN_BUDGET" |
  "NEARBY" | "DURATION_FIT" | "SEASON_FIT";

interface Preferences {
  locale: Locale;
  budget_fils: number | null;
  budget_scope: "per_group" | "per_person" | null;
  budget_basis: "activity_only" | "whole_trip" | "unclear";
  party_size: number | null;
  origin_location_id: LocationId | null;
  destination_location_ids: LocationId[];
  max_straight_line_km: number | null;
  group_type: GroupType | null;
  interests: Category[];
  environments: Environment[];
  max_duration_minutes: number | null;
  month: number | null;
  requested_date: string | null;
}
interface RecommendRequest {
  schema_version: 1;
  locale: Locale;
  query: string;
  overrides: Partial<Preferences>;
}
interface Activity {
  id: string; // UUID
  business_id: string | null;
  record_kind: "place" | "offer";
  title_ar: string;
  title_en: string | null;
  description_ar: string;
  description_en: string | null;
  location_id: LocationId;
  category: Category;
  tags: Category[];
  environment: Environment[];
  group_types: GroupType[];
  family_friendly: boolean | null;
  price_fils: number | null;
  price_unit: "per_person" | "per_group" | "free" | "unknown";
  price_status: "unknown" | "source_checked" | "owner_declared" | "synthetic_demo";
  price_checked_at: string | null;
  price_valid_until: string | null;
  price_notes: string;
  duration_minutes: number | null;
  capacity_people: number | null;
  available_months: number[] | null;
  image_path: string | null;
  source_url: string | null;
  location_source_url: string | null;
  data_kind: "public_source" | "provider_submitted" | "synthetic_demo";
  verification_status: "source_checked" | "owner_declared" | "unverified";
  source_checked_at: string | null;
  status: "published" | "archived";
  created_at: string;
  updated_at: string;
}
interface Recommendation {
  activity_id: string;
  activity: Activity; // hydrated server-side from current DB; never authored by LLM
  total_cost_fils: number | null;
  distance_km: number | null; // city-centre straight-line estimate only
  reason_codes: ReasonCode[];
  reasons: string[]; // deterministic localized templates from validated facts
  scores: { semantic: number | null; deterministic: number; final: number };
}
interface RecommendResponse {
  schema_version: 1;
  request_id: string;
  status: "ok" | "clarification" | "no_match" | "degraded";
  engine: "hybrid_llm" | "rules_fallback" | "none";
  data_mode: "supabase" | "seed";
  dataset_version: string;
  preferences: Preferences;
  questions: { key: string; prompt: string; choices: string[] }[];
  recommendations: Recommendation[];
  candidate_count: number; // eligible records actually sent to scorer
  unconfirmed_count: number; // excluded due to unknown hard-constraint facts
  warnings: string[];
}
~~~
All absent parser fields use null or empty arrays; do not invent defaults for hard constraints.
Only user-edited controls belong in overrides. Precedence: explicit overrides > explicit current query > saved preferences (P1) > neutral defaults. Conflicting/ambiguous query fields require clarification. Display normalized preference chips before/with results.
Hard money calculations use integer fils. Convert display values to/from JOD explicitly.

## Routes
| Method + path | Access | Input | Success |
| --- | --- | --- | --- |
| GET /api/activities | public | location_id?, category?, mine?, limit? (default/max 30) | 200 {data: Activity[], meta: {count: number}} |
| GET /api/me | authenticated | none | 200 {data: {user_id, role, business_id, locale}} |
| POST /api/activities | authenticated business | CreateActivity; no actor, business, id or provenance fields | 201 {data: Activity} |
| POST /api/recommend | authenticated in primary mode | RecommendRequest | 200 RecommendResponse |
| PATCH /api/activities/:id | owner, P1 | partial allowlisted editable fields | 200 {data: Activity} |
| DELETE /api/activities/:id | owner, P1 | none; soft archive | 204 no body |
| GET /api/favorites | authenticated, P1 | none | 200 {data: Activity[]} |
| POST /api/favorites | authenticated, P1 | {activity_id: UUID} | 200 {data: {activity_id: UUID}}; idempotent |
| DELETE /api/favorites/:id | authenticated, P1 | activity ID in path | 204; idempotent |
| PATCH /api/me | authenticated, P1 | display_name?, locale?, visitor_kind?, preferences? | 200 {data: profile} |

GET activities with mine=true requires Auth and includes only that business's records, including archived ones. A public query sees only published records. Budget/group filtering is performed by /api/recommend in P0, not a separate duplicated query language.
Login/logout use the Supabase browser Auth client; there is no custom password endpoint.
In explicit DATA_MODE=seed, catalogue/recommendation are read-only demo endpoints without Supabase login; all private/account endpoints and mutations return 503 DEMO_READ_ONLY. Show this mode visibly.

## Error envelope
~~~json
{"error":{"code":"VALIDATION_ERROR","message":"Invalid request","fields":{"party_size":"Use an integer from 1 to 30"},"request_id":"request-uuid"}}
~~~
400 malformed JSON/unknown property; 401 unauthenticated; 403 authenticated but no business; 404 missing or non-owned activity; 422 invalid semantic field combination; 429 rate limited; 503 unavailable/read-only dependency.
Clarification and no_match are successful 200 responses with empty recommendations, not fake results or server errors.
Supabase UPDATE with no matching RLS-visible row must not be reported as a successful edit.
Never return stack traces, API keys, full prompts, passwords, private profiles or database internals.

## CreateActivity example — synthetic demo business
The following IDs/prices/details are illustrative test data, not a real offering.
~~~json
{
  "title_ar":"تجربة طبيعة جماعية — عرض تجريبي",
  "title_en":"Group nature experience — demo offer",
  "description_ar":"عرض افتراضي لاختبار توصيات الطبيعة للمجموعات، وليس خدمة متاحة للحجز.",
  "description_en":"A fictional group nature activity for testing. Not bookable.",
  "location_id":"ajloun",
  "category":"nature",
  "tags":["nature","adventure"],
  "environment":["forest"],
  "group_types":["friends"],
  "family_friendly":false,
  "price_fils":8000,
  "price_unit":"per_person",
  "price_valid_until":null,
  "price_notes":"Synthetic activity price only; transport and meals excluded.",
  "duration_minutes":120,
  "capacity_people":8,
  "available_months":[3,4,5,9,10,11],
  "image_path":"/images/nature-demo.jpg"
}
~~~
CreateActivity requires title_ar, description_ar, location_id, category, tags, environment, group_types, family_friendly, price_fils, price_unit, price_valid_until, price_notes, duration_minutes, capacity_people, available_months, image_path. title_en and description_en may be null.
Server derives business_id from the verified actor, sets status=published, timestamps and data_kind, and derives price_status. DB policies/triggers enforce the same provenance protections against direct writes.
Price invariants: free ↔ price_fils=0; unknown ↔ price_fils=null; per_person/per_group require price_fils>0. No price/date guarantee is implied.

A POST response is exactly {data: Activity}, with all Activity fields populated or explicitly null. GET and P1 mutation responses reuse the same object. Never invent a different "card activity" API object.

## Recommend request example
~~~json
{
  "schema_version":1,
  "locale":"ar",
  "query":"نحن أربعة أصدقاء ونريد طبيعة ومغامرة في عجلون.",
  "overrides":{
    "budget_fils":40000,
    "budget_scope":"per_group",
    "budget_basis":"activity_only",
    "party_size":4,
    "destination_location_ids":["ajloun"],
    "group_type":"friends",
    "interests":["nature","adventure"],
    "month":10
  }
}
~~~
Expected normalized cost for the above example offer: 8000 × 4 = 32000 fils, not 8000.
A 12000-fils per-person activity costs 48000 fils and is excluded before the model sees it.
"معي 40 دينار" alone does not establish per-group versus per-person.

## Response example — no results because clarification is required
~~~json
{
  "schema_version":1,
  "request_id":"00000000-0000-4000-8000-000000000101",
  "status":"clarification",
  "engine":"none",
  "data_mode":"supabase",
  "dataset_version":"example-not-a-live-hash",
  "preferences":{
    "locale":"ar","budget_fils":40000,"budget_scope":null,
    "budget_basis":"activity_only","party_size":4,
    "origin_location_id":"irbid","destination_location_ids":[],
    "max_straight_line_km":null,"group_type":"friends",
    "interests":["nature","adventure"],"environments":[],
    "max_duration_minutes":null,"month":null,"requested_date":null
  },
  "questions":[
    {"key":"budget_scope","prompt":"هل 40 دينارًا ميزانية المجموعة أم لكل شخص؟","choices":["per_group","per_person"]},
    {"key":"distance","prompt":"ما المدن المقبولة، أو ما الحد التقريبي للمسافة بخط مستقيم؟","choices":["choose_locations","set_straight_line_radius"]}
  ],
  "recommendations":[],
  "candidate_count":0,
  "unconfirmed_count":0,
  "warnings":["Availability has not been verified."]
}
~~~

## Ranked-result example — activity is hydrated from the same source object
~~~typescript
const activity: Activity = sharedSyntheticFixture;
const response: RecommendResponse = {
  schema_version: 1,
  request_id: "00000000-0000-4000-8000-000000000102",
  status: "ok",
  engine: "hybrid_llm",
  data_mode: "supabase",
  dataset_version: "illustrative-dataset-version",
  preferences: normalizedPreferences,
  questions: [],
  recommendations: [{
    activity_id: activity.id,
    activity,
    total_cost_fils: 32000,
    distance_km: null,
    reason_codes: ["INTEREST_MATCH", "GROUP_MATCH", "WITHIN_BUDGET"],
    reasons: [
      "Matches the nature/adventure tags in this demo listing.",
      "The listing declares suitability for friends.",
      "The synthetic activity price is 32 JOD for four people."
    ],
    scores: { semantic: 90, deterministic: 72, final: 83.7 }
  }],
  candidate_count: 6,
  unconfirmed_count: 2,
  warnings: ["Synthetic offer; not bookable. Availability unverified."]
};
~~~
This is a contract fixture, not measured output. P1 creates complete serializable fixtures for all four response states before frontend/backend parallel work.

## Favorites example
~~~json
{"activity_id":"00000000-0000-4000-8000-000000000001"}
~~~
Never accept user_id from this body. Use the verified actor, and show only currently published activities when listing saved records.


## Complete JSON fixture
See [examples/recommend-success.json](examples/recommend-success.json) for a complete serializable success response. Its scores and data are synthetic contract examples, not observed model output.

## Implemented shared exports
Schemas and inferred DTOs: src/contracts/index.ts. All four synthetic response states: src/contracts/fixtures.ts and docs/examples/recommend-*.json. Shared UI props and integration details are frozen in docs/LEADER-HANDOFF.md. No wire shape changes.

## Integrated MVP runtime notes
The wire contract remains v1. The current no-credential default is seed/rules mode; private endpoints still return 503 DEMO_READ_ONLY. A client-only business form preview is labelled temporary and never submitted as a seed mutation or included in server recommendations. Primary publishing uses verified Supabase users and fresh database reads. Paid model calls require DATA_MODE=supabase, AI_MODE=hybrid, ALLOW_PAID_AI=true and a server-only key. Unsupported hard distances produce clarification rather than an invented estimate. See docs/MVP-SETUP.md for current behavior and limitations.
