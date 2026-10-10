import { beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { marketplace, marketplaceActivities } from "@/lib/data/marketplace";
import { MarketplaceSchema, DirectoryProviderSchema } from "@/contracts/marketplace";
import { GET as directory } from "@/app/api/businesses/route";
import { GET as profile } from "@/app/api/businesses/[id]/route";
import { GET as lookup } from "@/app/api/listings/[id]/route";
import { POST as recommend } from "@/app/api/recommend/route";
import { RecommendResponseSchema } from "@/contracts";
import { enrichCatalog } from "@/lib/data/catalog";
import details from "../../data/listing-details.json";
import { quoteCost } from "@/lib/tourism/cost";
import { localRecommendations } from "@/lib/tourism/local-recommendations";
import { sharedSyntheticFixture } from "@/contracts/fixtures";
import { normalize } from "@/lib/recommendation/preferences";
beforeEach(() => { vi.stubEnv("DATA_MODE", "seed"); vi.stubEnv("AI_MODE", "rules"); vi.stubEnv("ALLOW_PAID_AI", "false"); vi.stubEnv("APP_ORIGIN", "http://localhost:3000"); });
it("keeps 11 sourced, unclaimed providers separate from five fictional businesses", () => {
    expect(marketplace.providers.filter(p => !p.is_demo)).toHaveLength(11);
    const demo = marketplace.providers.filter(p => p.is_demo);
    expect(demo).toHaveLength(5);
    for (const p of demo) {
        expect(marketplace.listings.filter(r => r.provider?.id === p.id)).toHaveLength(3);
        expect(p.website).toBeNull();
        expect(p.phone).toBeNull();
    }
    expect(DirectoryProviderSchema.safeParse({ ...demo[0], website: "https://example.com" }).success).toBe(false);
    expect(MarketplaceSchema.safeParse({ ...marketplace, listings: [{ ...marketplace.listings[0], provider: marketplace.listings[4].provider }] }).success).toBe(false);
});
it("never assigns a fictional price to a real business or unknown price to zero", () => {
    for (const d of Object.values(details))
        expect(d.quotes.some(q => q.status === "demo_estimate")).toBe(false);
    for (const r of marketplace.listings) {
        const p = marketplace.providers.find(p => p.id === r.activity.business_id)!;
        const q = marketplace.details[r.activity.id].quotes;
        if (!p.is_demo)
            expect(q.every(q => q.status === "source_checked" && q.source_url && q.checked_at)).toBe(true);
        if (r.activity.price_unit === "unknown")
            expect(r.activity.price_fils).toBeNull();
    }
});
it("serves real existing offer/provider IDs and a genuine 404 for missing profiles", async () => {
    const response = await directory();
    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data).toHaveLength(16);
    for (const row of data)
        expect(row.listings.every((r: {
            activity: {
                business_id: string;
            };
        }) => r.activity.business_id === row.provider.id)).toBe(true);
    const p = marketplace.providers.find(p => p.is_demo)!;
    expect((await profile(new Request("http://localhost:3000"), { params: Promise.resolve({ id: p.id }) })).status).toBe(200);
    expect((await lookup(new Request("http://localhost:3000"), { params: Promise.resolve({ id: marketplace.listings[0].activity.id }) })).status).toBe(200);
    expect((await profile(new Request("http://localhost:3000"), { params: Promise.resolve({ id: crypto.randomUUID() }) })).status).toBe(404);
});
it("recommends actual Irbid business offers for four friends within 70 JOD group budget", async () => {
    const req = new Request("http://localhost:3000/api/recommend", { method: "POST", headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify({ schema_version: 1, locale: "ar", query: "بدنا مسير وطبيعة مع صحابنا", overrides: { party_size: 4, budget_fils: 70000, budget_scope: "per_group", budget_basis: "activity_only", destination_location_ids: ["irbid"], group_type: "friends", interests: ["nature"] } }) });
    const response = await recommend(req);
    expect(response.status).toBe(200);
    const result = RecommendResponseSchema.parse(await response.json());
    const ids = new Set(marketplaceActivities.map(a => a.id));
    const offers = result.recommendations.filter(r => ids.has(r.activity_id));
    expect(offers.length).toBeGreaterThan(0);
    for (const r of offers) {
        expect(r.activity.business_id).not.toBeNull();
        expect(r.total_cost_fils).toBe(r.activity.price_fils! * 4);
        expect(r.total_cost_fils).toBeLessThanOrEqual(70000);
        expect(r.reasons.length).toBeGreaterThan(0);
    }
    const { entries } = await enrichCatalog(offers.map(r => r.activity));
    expect(entries.every(e => e.provider?.is_demo && e.provider.id === e.activity.business_id)).toBe(true);
});
it("generates identical SQL across checkout line endings with stable IDs and no conflict overwrites or owner assignment", () => {
    const paths = ["supabase/seed_marketplace.sql", "supabase/seed_marketplace_demo.sql"];
    const before = paths.map(p => readFileSync(p, "utf8"));
    execFileSync(process.execPath, ["scripts/marketplace-seed.mjs"]);
    paths.forEach((p, i) => { const after = readFileSync(p, "utf8"); expect(after.replace(/\r\n/g,"\n")).toBe(before[i].replace(/\r\n/g,"\n")); expect(after).not.toContain("do update"); expect(after).toContain("on conflict(id) do nothing"); expect(after).toContain("owner_id"); });
    expect(before[0]).not.toContain("synthetic_demo");
    expect(before[0]).not.toContain("demo_estimate");
});
it("does not generalize group-dependent real prices to arbitrary parties", () => {
    const restricted = marketplace.details["71000000-0000-4000-8000-000000000008"].quotes[0];
    expect(quoteCost(restricted, 2, 1, 1)).toBeNull();
    expect(quoteCost(restricted, 7, 1, 1)).toBeNull();
    expect(quoteCost(restricted, 4, 1, 1)).toBe(80000);
    expect(quoteCost(marketplace.details["71000000-0000-4000-8000-000000000007"].quotes[0], 4, 1, 1)).toBeNull();
});
it("locally published demo offers reuse hard budget, capacity and archive checks", () => {
    const row = marketplace.listings.find(r => r.activity.data_kind === "synthetic_demo" && r.activity.location_id === "irbid")!;
    const local = { ...row, activity: { ...row.activity, id: sharedSyntheticFixture.id } };
    const p = normalize({ schema_version: 1, locale: "ar", query: "", overrides: { party_size: 4, budget_fils: 70000, budget_scope: "per_group", budget_basis: "activity_only", destination_location_ids: ["irbid"], group_type: "friends", interests: ["nature"] } });
    expect(localRecommendations([local], p, new Date())[0].recommendation.total_cost_fils).toBe(60000);
    expect(localRecommendations([local], { ...p, budget_fils: 50000 }, new Date())).toHaveLength(0);
    expect(localRecommendations([{ ...local, activity: { ...local.activity, capacity_people: 3 } }], p, new Date())).toHaveLength(0);
    expect(localRecommendations([{ ...local, activity: { ...local.activity, status: "archived" } }], p, new Date())).toHaveLength(0);
});
