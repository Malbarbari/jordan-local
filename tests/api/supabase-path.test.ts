import { beforeEach, describe, expect, it, vi } from "vitest";
import { sharedSyntheticFixture } from "../../src/contracts/fixtures";
import { CreateActivityResponseSchema, type Activity } from "../../src/contracts";
import { HttpError } from "../../src/lib/http";
const mocks = vi.hoisted(() => ({ business: vi.fn(), user: vi.fn(), load: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ requireBusiness: mocks.business, requireUser: mocks.user }));
vi.mock("@/lib/data/activities", () => ({ loadActivities: mocks.load }));
import { POST as create, GET as list } from "../../src/app/api/activities/route";
import { POST as recommend } from "../../src/app/api/recommend/route";
const origin = "http://localhost:3000";
const createInput = (() => {
    const { title_ar, title_en, description_ar, description_en, location_id, category, tags, environment, group_types, family_friendly, price_fils, price_unit, price_valid_until, price_notes, duration_minutes, capacity_people, available_months, image_path } = sharedSyntheticFixture;
    return { title_ar, title_en, description_ar, description_en, location_id, category, tags, environment, group_types, family_friendly, price_fils, price_unit, price_valid_until, price_notes, duration_minutes, capacity_people, available_months, image_path };
})();
function request(path: string, body: unknown) { return new Request(origin + path, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("DATA_MODE", "supabase");
    vi.stubEnv("AI_MODE", "rules");
    vi.stubEnv("ALLOW_PAID_AI", "false");
    vi.stubEnv("APP_ORIGIN", origin);
    mocks.user.mockResolvedValue({ id: crypto.randomUUID() });
});
describe("Supabase publishing integration with a mocked database", () => {
    it.each([401, 403])("does not insert when verified authorization returns %i", async (status) => {
        mocks.business.mockRejectedValue(new HttpError(status, "FORBIDDEN", "Access denied"));
        expect((await create(request("/api/activities", createInput))).status).toBe(status);
    });
    it("rejects actor/provenance properties before querying the database", async () => {
        const response = await create(request("/api/activities", { ...createInput, owner_id: crypto.randomUUID(), data_kind: "public_source" }));
        expect(response.status).toBe(400);
        expect(mocks.business).not.toHaveBeenCalled();
    });
    it("uses semantic validation status for an inconsistent price", async () => {
        const response = await create(request("/api/activities", { ...createInput, price_unit: "free", price_fils: 8000 }));
        expect(response.status).toBe(422);
        expect(mocks.business).not.toHaveBeenCalled();
    });
    it("inserts with verified business ID, returns authoritative row and reads a fresh candidate", async () => {
        let stored: Activity | undefined;
        const insert = vi.fn((input: Record<string, unknown>) => ({ select: () => ({ single: async () => {
                    stored = { ...sharedSyntheticFixture, ...input, id: "20000000-0000-4000-8000-000000000001", data_kind: "provider_submitted", price_status: "owner_declared", verification_status: "owner_declared", price_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Activity;
                    return { data: stored, error: null };
                } }) }));
        const client = { from: vi.fn(() => ({ insert })) };
        mocks.business.mockResolvedValue({ client, business: { id: "00000000-0000-4000-8000-000000000020", is_demo: false } });
        const response = await create(request("/api/activities", createInput));
        expect(response.status).toBe(201);
        const row = CreateActivityResponseSchema.parse(await response.json()).data;
        expect(row.business_id).toBe("00000000-0000-4000-8000-000000000020");
        expect(insert.mock.calls[0][0]).not.toHaveProperty("data_kind");
        mocks.load.mockImplementation(async () => [stored!]);
        const recommended = await recommend(request("/api/recommend", { schema_version: 1, locale: "ar", query: "", overrides: { party_size: 4, budget_fils: 40000, budget_scope: "per_group", budget_basis: "activity_only" } }));
        expect(recommended.status).toBe(200);
        expect((await recommended.json()).recommendations[0].activity_id).toBe(row.id);
        expect(mocks.load).toHaveBeenCalledTimes(2);
    });
    it("own list query is scoped by verified business rather than public catalogue", async () => {
        const eq = vi.fn(() => ({ order: async () => ({ data: [sharedSyntheticFixture], error: null }) }));
        const client = { from: () => ({ select: () => ({ eq }) }) };
        mocks.business.mockResolvedValue({ client, business: { id: sharedSyntheticFixture.business_id } });
        const response = await list(new Request(origin + "/api/activities?mine=true"));
        expect(response.status).toBe(200);
        expect(eq).toHaveBeenCalledWith("business_id", sharedSyntheticFixture.business_id);
        expect(mocks.load).not.toHaveBeenCalled();
    });
    it("omits a selected row if it changed before the final freshness check", async () => {
        mocks.load.mockResolvedValueOnce([sharedSyntheticFixture]).mockResolvedValueOnce([{ ...sharedSyntheticFixture, updated_at: "2026-10-10T00:00:00Z", price_fils: 99000 }]);
        const response = await recommend(request("/api/recommend", { schema_version: 1, locale: "ar", query: "", overrides: { party_size: 4, budget_fils: 40000, budget_scope: "per_group", budget_basis: "activity_only" } }));
        const body = await response.json();
        expect(body.status).toBe("no_match");
        expect(body.recommendations).toEqual([]);
    });
});
