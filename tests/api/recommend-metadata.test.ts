import {beforeEach,it,expect,vi} from "vitest";
import {sharedSyntheticFixture} from "../../src/contracts/fixtures";
const mocks=vi.hoisted(()=>({load:vi.fn(),catalog:vi.fn()}));
vi.mock("@/lib/data/activities",()=>({loadActivities:mocks.load}));
vi.mock("@/lib/data/catalog",()=>({enrichCatalog:mocks.catalog}));
import {POST} from "../../src/app/api/recommend/route";
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv("DATA_MODE","supabase");vi.stubEnv("AI_MODE","rules");vi.stubEnv("ALLOW_PAID_AI","false");vi.stubEnv("APP_ORIGIN","http://localhost:3000");});
it("rechecks mandatory metadata after ranking instead of returning an offer that lost its swimming declaration",async()=>{
 mocks.load.mockResolvedValue([sharedSyntheticFixture]);
 const catalog=(tags:string[])=>({available:true,entries:[{activity:sharedSyntheticFixture,metadata:{listing_kind:"activity",discovery_tags:tags,estimated_price_fils:null,estimated_price_unit:null}}]});
 mocks.catalog.mockResolvedValueOnce(catalog(["swimming"])).mockResolvedValueOnce(catalog(["food"]));
 const response=await POST(new Request("http://localhost:3000/api/recommend",{method:"POST",headers:{Origin:"http://localhost:3000","Content-Type":"application/json"},body:JSON.stringify({schema_version:1,locale:"ar",query:"بدي سباحة فقط",overrides:{party_size:4,budget_fils:40000,budget_scope:"per_group",budget_basis:"activity_only"}})}));
 expect(response.status).toBe(200);const data=await response.json();expect(data.status).toBe("no_match");expect(data.recommendations).toEqual([]);expect(mocks.catalog).toHaveBeenCalledTimes(2);
});
