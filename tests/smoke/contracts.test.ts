import { describe, it, expect } from "vitest";
import { ActivitySchema, CreateActivitySchema, RecommendRequestSchema, RecommendResponseSchema } from "../../src/contracts";
import { responseFixtures, sharedSyntheticFixture } from "../../src/contracts/fixtures";
import { jodToFils, parseListing } from "../../src/components/business/form";
const { title_ar, title_en, description_ar, description_en, location_id, category, tags, environment, group_types, family_friendly, price_fils, price_unit, price_valid_until, price_notes, duration_minutes, capacity_people, available_months, image_path } = sharedSyntheticFixture;
const create = { title_ar, title_en, description_ar, description_en, location_id, category, tags, environment, group_types, family_friendly, price_fils, price_unit, price_valid_until, price_notes, duration_minutes, capacity_people, available_months, image_path };
describe("frozen API contract", () => {
    it("validates serializable fixtures for all four states", () => { for (const value of Object.values(responseFixtures))
        expect(RecommendResponseSchema.parse(JSON.parse(JSON.stringify(value)))).toEqual(value); });
    it("rejects actor and provenance mass assignment", () => { for (const key of ["owner_id", "business_id", "id", "data_kind", "verification_status", "verified"])
        expect(CreateActivitySchema.safeParse({ ...create, [key]: "forged" }).success).toBe(false); });
    it("enforces price invariants", () => { for (const [unit, price] of [["free", 8], ["unknown", 0], ["per_person", 0], ["per_group", null]])
        expect(CreateActivitySchema.safeParse({ ...create, price_unit: unit, price_fils: price }).success).toBe(false); expect(CreateActivitySchema.safeParse({ ...create, price_unit: "unknown", price_fils: null }).success).toBe(true); expect(CreateActivitySchema.safeParse({ ...create, price_unit: "free", price_fils: 0 }).success).toBe(true); });
    it("rejects invalid capacity, month, duration and negative prices", () => { for (const patch of [{ capacity_people: 0 }, { available_months: [13] }, { duration_minutes: 1441 }, { price_fils: -1 }, { title_ar: " " }])
        expect(CreateActivitySchema.safeParse({ ...create, ...patch }).success).toBe(false); });
    it("requires complete Activity DTOs and matching hydrated IDs", () => { expect(ActivitySchema.safeParse({ ...sharedSyntheticFixture, title_en: undefined }).success).toBe(false); const ok = responseFixtures.ok; expect(RecommendResponseSchema.safeParse({ ...ok, recommendations: [{ ...ok.recommendations[0], activity_id: "00000000-0000-4000-8000-000000000999" }] }).success).toBe(false); });
    it("rejects oversized query and unknown overrides", () => { expect(RecommendRequestSchema.safeParse({ schema_version: 1, locale: "ar", query: "x".repeat(1001), overrides: {} }).success).toBe(false); expect(RecommendRequestSchema.safeParse({ schema_version: 1, locale: "ar", query: "", overrides: { owner_id: "bad" } }).success).toBe(false); });
    it("converts JOD without floating-point rounding", () => { expect(jodToFils("8.125")).toBe(8125); expect(jodToFils("0.001")).toBe(1); expect(jodToFils("٨٫١٢٥")).toBe(8125); for (const value of ["-1", "1.0001", "abc", "1e2", ""])
        expect(Number.isNaN(jodToFils(value))).toBe(true); });
    it("reports invalid form fields and sends only editable properties", () => { expect(parseListing(new FormData()).success).toBe(false); const form = new FormData(); for (const [key, value] of Object.entries({ title_ar: "Demo", description_ar: "Fictional test", location_id: "ajloun", category: "nature", price_unit: "per_person", price_jod: "8.125", family_friendly: "unknown" }))
        form.set(key, value); form.set("owner_id", "forged"); const parsed = parseListing(form); expect(parsed.success).toBe(true); if (parsed.success) {
        expect(parsed.data.price_fils).toBe(8125);
        expect(parsed.data).not.toHaveProperty("owner_id");
    } });
});
