import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import records from "../../data/tourism.real.json";
import { TourismListingSchema, TourismResponseSchema } from "../../src/contracts/tourism";
import { ActivitySchema } from "../../src/contracts";
import { filterTourism } from "../../src/lib/tourism/filter";
import { rankTourism } from "../../src/lib/tourism/ranking";
import { GET } from "../../src/app/api/tourism/route";
const rows = records.map(row => TourismListingSchema.parse(row));
const now = new Date("2026-10-09T12:00:00Z");
const fixture = (changes: object = {}) => ({ ...rows[0], activity: { ...rows[0].activity, price_fils:8000,price_unit:"per_person" as const,price_status:"source_checked" as const,price_checked_at:now.toISOString(),capacity_people:8,group_types:["friends" as const], ...changes } });
beforeEach(() => { vi.stubEnv("DATA_MODE","seed"); vi.stubEnv("AI_MODE","rules"); vi.stubEnv("ALLOW_PAID_AI","false"); });
describe("verified tourism data and modular filtering", () => {
    it("has 25–40 unique source-backed introductions, accurate geography and no fabricated prices", () => {
        expect(rows.length).toBeGreaterThanOrEqual(25); expect(rows.length).toBeLessThanOrEqual(40);
        expect(new Set(rows.map(row=>row.activity.id)).size).toBe(rows.length);
        expect(rows.every(row=>row.activity.source_url && row.activity.title_ar && row.activity.title_en && row.activity.price_fils === null && row.activity.price_unit === "unknown")).toBe(true);
        expect(rows.find(row=>row.activity.title_en === "Petra")?.activity.location_id).toBe("petra");
        expect(rows.find(row=>row.activity.title_en === "Ma'in Hot Springs")?.activity.location_id).toBe("main");
        expect(ActivitySchema.safeParse(rows[0].activity).success).toBe(false); // v1 is still frozen.
    });
    it("keeps public landmarks ownerless and provider references grounded", () => {
        for(const row of rows) {
            if(row.metadata.listing_kind === "destination") { expect(row.activity.business_id).toBeNull(); expect(row.provider).toBeNull(); }
            if(row.provider) { expect(row.provider.id).toBe(row.activity.business_id); expect(row.provider.source_url).toBeTruthy(); }
        }
        expect(rows.filter(row=>row.provider).length).toBeGreaterThan(4);
    });
    it("rejects ungrounded verification, ownerless business offers and false free/estimate prices", () => {
        expect(TourismListingSchema.safeParse({...rows[0],metadata:{...rows[0].metadata,listing_kind:"business_offer"}}).success).toBe(false);
        expect(TourismListingSchema.safeParse({...rows[0],activity:{...rows[0].activity,source_url:null}}).success).toBe(false);
        expect(TourismListingSchema.safeParse({...fixture(),activity:{...fixture().activity,price_unit:"free",price_fils:8000}}).success).toBe(false);
        expect(TourismListingSchema.safeParse({...fixture(),metadata:{...rows[0].metadata,estimated_price_fils:8000,estimated_price_unit:"per_person"}}).success).toBe(false);
    });
    it("requires real local JPEGs with specific licenses and attribution", () => {
        const photos = rows.filter(row=>row.image);
        expect(photos.length).toBeGreaterThanOrEqual(15);
        for(const row of photos) {
            const photo = row.image!;
            expect(photo.author).not.toBe(""); expect(photo.source_url).toContain("commons.wikimedia.org/wiki/File:"); expect(photo.license_url).toContain("creativecommons.org/");
            const path = `public${photo.path}`; expect(existsSync(path)).toBe(true); expect([...readFileSync(path).subarray(0,2)]).toEqual([255,216]);
        }
    });
    it("uses site coordinates from exact source-linked pins rather than image GPS or viewport centres", () => {
        for(const row of rows.filter(row=>row.coordinates)) {
            const pin = row.coordinates!;
            expect(pin.source_url).toContain(`!3d${pin.latitude}!4d${pin.longitude}`);
        }
        expect(rows.find(row=>row.activity.title_en === "Petra")?.coordinates).toBeNull();
    });
    it("combines location, category, listing type and preference tag", () => {
        const result=filterTourism(rows,{query:"",location_id:"ajloun",listing_kind:"activity",category:"adventure",tag:"hiking"},now);
        expect(result.rows).toHaveLength(1); expect(result.rows[0].activity.title_en).toContain("Roe Deer");
    });
    it("ranks Arabic cabin and forest preferences using declared facts", () => {
        const result=filterTourism(rows,{query:"بدي اكواخ للاسترخاء",location_id:"ajloun"},now);
        expect(rankTourism(result.rows,"بدي اكواخ للاسترخاء")[0].activity.title_en).toBe("Ajloun Forest Reserve Cabins");
    });
    it("does not turn unknown public admission into a free/budget match", () => {
        const result=filterTourism(rows,{query:"",budget_fils:40000},now);
        expect(result.rows).toHaveLength(0); expect(result.unconfirmed).toBe(rows.length);
    });
    it("enforces group totals, capacity and declared group suitability", () => {
        const known=fixture();
        expect(filterTourism([known],{query:"",party_size:4,budget_fils:32000,group_type:"friends"},now).rows).toHaveLength(1);
        expect(filterTourism([known],{query:"",party_size:4,budget_fils:31999},now).rows).toHaveLength(0);
        expect(filterTourism([known],{query:"",party_size:9,budget_fils:100000},now).rows).toHaveLength(0);
        expect(filterTourism([known],{query:"",party_size:4,group_type:"family"},now).rows).toHaveLength(0);
    });
    it("supports per-group prices and rejects stale prices and unknown capacities", () => {
        expect(filterTourism([fixture({price_unit:"per_group"})],{query:"",party_size:4,budget_fils:8000},now).rows).toHaveLength(1);
        expect(filterTourism([fixture({price_checked_at:"2025-01-01T00:00:00Z"})],{query:"",budget_fils:50000,party_size:4},now).unconfirmed).toBe(1);
        expect(filterTourism([fixture({capacity_people:null})],{query:"",party_size:4},now).unconfirmed).toBe(1);
    });
    it("serves source data through the actual backend with no-store and validated filters", async () => {
        const response=await GET(new Request("http://localhost:3000/api/tourism?location_id=petra"));
        expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toBe("no-store");
        const body=TourismResponseSchema.parse(await response.json()); expect(body.data).toHaveLength(2); expect(body.meta.engine).toBe("rules_discovery");
    });
    it.each(["budget_fils=-1","party_size=0","party_size=1.5","location_id=fake","owner_id=forged","location_id=petra&location_id=amman"])("rejects unsupported filter %s", async query => {
        expect((await GET(new Request(`http://localhost:3000/api/tourism?${query}`))).status).toBe(400);
    });
});
