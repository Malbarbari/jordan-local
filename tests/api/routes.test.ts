import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as catalogue, POST as create } from "../../src/app/api/activities/route";
import { GET as me } from "../../src/app/api/me/route";
import { POST as recommend } from "../../src/app/api/recommend/route";
import { ActivitiesResponseSchema, ErrorResponseSchema, RecommendResponseSchema } from "../../src/contracts";
import { sharedSyntheticFixture } from "../../src/contracts/fixtures";
const origin = "http://localhost:3000";
function req(path: string, input: unknown, headers: Record<string, string> = {}) { return new Request(origin + path, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, ...headers }, body: JSON.stringify(input) }); }
const valid = { schema_version: 1, locale: "ar", query: "", overrides: { party_size: 4, budget_fils: 40000, budget_scope: "per_group", budget_basis: "activity_only", destination_location_ids: ["ajloun"], group_type: "friends", interests: ["nature"] } };
beforeEach(() => { vi.stubEnv("DATA_MODE", "seed"); vi.stubEnv("AI_MODE", "rules"); vi.stubEnv("ALLOW_PAID_AI", "false"); vi.stubEnv("APP_ORIGIN", origin); });
describe("actual seed route handlers", () => {
    it("serves complete catalogue DTOs and filters", async () => { const response = await catalogue(new Request(origin + "/api/activities?location_id=ajloun")); expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toBe("no-store"); const body = ActivitiesResponseSchema.parse(await response.json()); expect(body.data.length).toBeGreaterThan(0); expect(body.data.every(row => row.location_id === "ajloun")).toBe(true); });
    it("recommend route returns grounded IDs and group prices", async () => { const response = await recommend(req("/api/recommend", valid)); expect(response.status).toBe(200); const body = RecommendResponseSchema.parse(await response.json()); expect(body.status).toBe("degraded"); expect(body.data_mode).toBe("seed"); expect(body.recommendations.every(row => row.total_cost_fils !== null && row.total_cost_fils <= 40000)).toBe(true); });
    it("returns clarification/no_match in the existing success envelope", async () => { const clarification = await recommend(req("/api/recommend", { ...valid, overrides: {} })); expect((await clarification.json()).status).toBe("clarification"); const none = await recommend(req("/api/recommend", { ...valid, overrides: { ...valid.overrides, budget_fils: 0 } })); expect((await none.json()).status).toBe("no_match"); });
    it("rejects forged fields, malformed JSON and over-limit bodies", async () => { for (const request of [req("/api/recommend", { ...valid, owner_id: "forged" }), new Request(origin + "/api/recommend", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: "{" }), req("/api/recommend", { ...valid, query: "x".repeat(20000) })]) {
        const response = await recommend(request);
        expect(response.status).toBe(400);
        expect(ErrorResponseSchema.safeParse(await response.json()).success).toBe(true);
    } });
    it("rejects foreign mutation origins", async () => { expect((await recommend(req("/api/recommend", valid, { Origin: "https://evil.invalid" }))).status).toBe(403); });
    it("seed mode refuses private routes and publishing", async () => { expect((await me()).status).toBe(503); expect((await catalogue(new Request(origin + "/api/activities?mine=true"))).status).toBe(503); const { id, business_id, record_kind, price_status, price_checked_at, source_url, location_source_url, data_kind, verification_status, source_checked_at, status, created_at, updated_at, ...input } = sharedSyntheticFixture; void [id, business_id, record_kind, price_status, price_checked_at, source_url, location_source_url, data_kind, verification_status, source_checked_at, status, created_at, updated_at]; const response = await create(req("/api/activities", input)); expect(response.status).toBe(503); expect((await response.json()).error.code).toBe("DEMO_READ_ONLY"); });
    it("Supabase failure does not silently return seed data", async () => { vi.stubEnv("DATA_MODE", "supabase"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ""); const response = await catalogue(new Request(origin + "/api/activities")); expect(response.status).toBe(503); });
});
