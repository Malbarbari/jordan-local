import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogEntrySchema, CatalogResponseSchema, defaultMetadata } from "../../src/contracts/catalog";
import { sharedSyntheticFixture } from "../../src/contracts/fixtures";
import { GET } from "../../src/app/api/catalog/route";
import { PATCH } from "../../src/app/api/activities/[id]/catalog/route";
import { HttpError } from "../../src/lib/http";
import { diversifyTies, queryDiscoveryTags } from "../../src/lib/recommendation/discovery";
import { recommend } from "../../src/lib/recommendation/service";
import { parseCatalogForm } from "../../src/components/business/form";
const auth = vi.hoisted(() => ({ business: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ requireBusiness: auth.business }));
const origin = "http://localhost:3000";
const metadata = { listing_kind: "visitable_place", discovery_tags: ["swimming", "pools"], estimated_price_fils: null, estimated_price_unit: null };
const context = { params: Promise.resolve({ id: sharedSyntheticFixture.id }) };
function request(value: unknown, source = origin) { return new Request(origin + "/api/activities/" + sharedSyntheticFixture.id + "/catalog", { method: "PATCH", headers: { Origin: source, "Content-Type": "application/json" }, body: JSON.stringify(value) }); }
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("DATA_MODE", "seed"); vi.stubEnv("AI_MODE", "rules"); vi.stubEnv("ALLOW_PAID_AI", "false"); vi.stubEnv("APP_ORIGIN", origin); });
describe("additive tourism catalogue", () => {
    it("serves all five kinds, sourced public landmarks, fictional providers and honest estimates", async () => {
        const response = await GET(); expect(response.status).toBe(200);
        const body = CatalogResponseSchema.parse(await response.json());
        expect(body.meta.count).toBe(21);
        expect(new Set(body.data.map(e => e.metadata.listing_kind)).size).toBe(5);
        for (const entry of body.data.filter(e => e.metadata.listing_kind === "destination")) {
            expect(entry.provider).toBeNull(); expect(entry.activity.business_id).toBeNull(); expect(entry.activity.price_unit).toBe("unknown"); expect(entry.activity.source_url).toContain("visitjordan.com");
        }
        const cabin = body.data.find(e => e.metadata.listing_kind === "accommodation")!;
        expect(cabin.metadata.estimated_price_fils).toBe(60000); expect(cabin.activity.price_fils).toBeNull(); expect(cabin.provider?.is_demo).toBe(true);
    });
    it("rejects privately owned destinations and mismatched providers", () => {
        expect(CatalogEntrySchema.safeParse({ activity: sharedSyntheticFixture, metadata: { ...metadata, listing_kind: "destination" }, provider: null }).success).toBe(false);
        expect(CatalogEntrySchema.safeParse({ activity: sharedSyntheticFixture, metadata, provider: { id: crypto.randomUUID(), name: "Wrong owner", is_demo: false, verification_status: "unverified" } }).success).toBe(false);
    });
    it("never counts an estimate toward a strict budget", async () => {
        const a = { ...sharedSyntheticFixture, price_unit: "unknown" as const, price_fils: null, price_status: "unknown" as const };
        const result = await recommend({ schema_version: 1, locale: "ar", query: "كوخ للاسترخاء", overrides: { party_size: 4, budget_fils: 100000, budget_scope: "per_group", budget_basis: "activity_only" } }, [a], new Date(), { disableAI: true, catalog: new Map([[a.id, { ...defaultMetadata(a), listing_kind: "accommodation", discovery_tags: ["cabins", "wellness"], estimated_price_fils: 60000, estimated_price_unit: "per_group" }]]) });
        expect(result.status).toBe("no_match"); expect(result.unconfirmed_count).toBe(1);
    });
    it("ranks an eligible pool above equally priced nature and explains declared tags", async () => {
        const pool = { ...sharedSyntheticFixture, id: "40000000-0000-4000-8000-000000000001" };
        const result = await recommend({ schema_version: 1, locale: "ar", query: "بدي مسبح وسباحة", overrides: { party_size: 4, budget_fils: 40000, budget_scope: "per_group", budget_basis: "activity_only" } }, [sharedSyntheticFixture, pool], new Date(), { disableAI: true, catalog: new Map([[pool.id, { ...defaultMetadata(pool), discovery_tags: ["swimming","pools"] }], [sharedSyntheticFixture.id, defaultMetadata(sharedSyntheticFixture)]]) });
        expect(result.recommendations[0].activity_id).toBe(pool.id); expect(result.recommendations[0].reasons.join(" ")).toContain("سباحة");
        expect(queryDiscoveryTags("كوخ ومزرعة للاسترخاء")).toEqual(expect.arrayContaining(["cabins","farms","wellness"]));
    });
    it("diversifies exact ties without displacing stronger matches", () => {
        const rows = [{ id: 1, score: 90, provider: "A" }, { id: 2, score: 90, provider: "A" }, { id: 3, score: 90, provider: "B" }, { id: 4, score: 80, provider: "C" }];
        expect(diversifyTies(rows, r => r.score, r => r.provider).map(r => r.id)).toEqual([1,3,2,4]);
    });
    it("parses rich fields separately from the frozen activity submission", () => {
        const form = new FormData(); form.set("listing_kind", "accommodation"); form.set("discovery_tags", "cabins"); form.set("estimated_price_jod", "٦٠٫١٢٥"); form.set("estimated_price_unit", "per_group");
        expect(parseCatalogForm(form)).toMatchObject({ success: true, data: { estimated_price_fils: 60125 } });
    });
    it.each([401,403])("blocks metadata writes when verified ownership fails (%i)", async status => { auth.business.mockRejectedValue(new HttpError(status, "FORBIDDEN", "Denied")); expect((await PATCH(request(metadata), context)).status).toBe(status); });
    it("rejects forged ownership and cross-origin metadata before database access", async () => {
        expect((await PATCH(request({ ...metadata, business_id: crypto.randomUUID() }), context)).status).toBe(400);
        expect((await PATCH(request(metadata, "https://other.invalid"), context)).status).toBe(403);
        expect(auth.business).not.toHaveBeenCalled();
    });
    it("scopes lookup to the actual business and reports missing/foreign listings", async () => {
        const eq = vi.fn().mockReturnThis(); const client = { from: () => ({ select: () => ({ eq, maybeSingle: async () => ({ data: null, error: null }) }) }) };
        auth.business.mockResolvedValue({ client, business: { id: sharedSyntheticFixture.business_id } });
        expect((await PATCH(request(metadata), context)).status).toBe(404);
        expect(eq).toHaveBeenCalledWith("business_id", sharedSyntheticFixture.business_id);
    });
    it("persists owner metadata but rejects destination ownership and known-price estimates", async () => {
        const upsert = vi.fn().mockResolvedValue({ error: null }); const chain = { eq: vi.fn().mockReturnThis(), maybeSingle: async () => ({ data: { id: sharedSyntheticFixture.id, price_unit: "per_person" }, error: null }) };
        const client = { from: () => ({ select: () => chain, upsert }) };
        auth.business.mockResolvedValue({ client, business: { id: sharedSyntheticFixture.business_id } });
        expect((await PATCH(request({ ...metadata, listing_kind: "destination" }), context)).status).toBe(422);
        expect((await PATCH(request({ ...metadata, estimated_price_fils: 1000, estimated_price_unit: "per_group" }), context)).status).toBe(422);
        expect((await PATCH(request(metadata), context)).status).toBe(200);
        expect(upsert).toHaveBeenCalledWith({ activity_id: sharedSyntheticFixture.id, ...metadata }, { onConflict: "activity_id" });
    });
});
