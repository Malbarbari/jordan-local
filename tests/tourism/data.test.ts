import { beforeEach, expect, it, vi } from "vitest";
import records from "../../data/tourism.real.json";
import { sharedSyntheticFixture } from "../../src/contracts/fixtures";
const mocks=vi.hoisted(()=>({from:vi.fn(),activities:vi.fn(),catalog:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({from:mocks.from})}));
vi.mock("@/lib/data/activities",()=>({loadActivities:mocks.activities}));
vi.mock("@/lib/data/catalog",()=>({enrichCatalog:mocks.catalog}));
import { loadTourism } from "../../src/lib/data/tourism";
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv("DATA_MODE","supabase");});
function databaseRow(payload: unknown = records[0], business_id: string | null = null) {
    const chain={eq:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),limit:async()=>({data:[{id:records[0].activity.id,business_id,payload}],error:null})};
    mocks.from.mockReturnValue({select:()=>chain});
}
it("does not replace failed Supabase tourism reads with local verified records",async()=>{
    mocks.from.mockReturnValue({select:()=>({eq:()=>({order:()=>({limit:async()=>({data:null,error:{message:"missing table"}})})})})});
    await expect(loadTourism()).rejects.toMatchObject({code:"TOURISM_DATABASE_UNAVAILABLE"});expect(mocks.activities).not.toHaveBeenCalled();
});
it("rejects payload ownership inconsistent with the stored foreign key",async()=>{
    databaseRow(records[0],crypto.randomUUID());await expect(loadTourism()).rejects.toMatchObject({code:"CATALOG_INCONSISTENT"});
});
it("includes a genuine newly published v1 business offer without verified-photo or provider claims",async()=>{
    databaseRow();
    const activity={...sharedSyntheticFixture,data_kind:"provider_submitted",verification_status:"owner_declared"};
    mocks.activities.mockResolvedValue([activity]);mocks.catalog.mockResolvedValue({entries:[{activity,metadata:{listing_kind:"activity",discovery_tags:["nature"],estimated_price_fils:null,estimated_price_unit:null},provider:null}],available:false});
    const rows=await loadTourism();expect(rows).toHaveLength(2);const added=rows.find(r=>r.activity.id===activity.id)!;expect(added.activity.business_id).toBe(activity.business_id);expect(added.image).toBeNull();expect(added.provider).toBeNull();expect(added.activity.verification_status).toBe("owner_declared");
});
