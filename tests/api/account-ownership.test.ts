import { beforeEach,it,expect,vi } from "vitest";
import { sharedSyntheticFixture } from "../../src/contracts/fixtures";
import { CreateActivitySchema } from "../../src/contracts";
import { HttpError } from "../../src/lib/http";
const mocks=vi.hoisted(()=>({user:vi.fn(),business:vi.fn()}));
vi.mock("@/lib/auth/server",()=>({requireUser:mocks.user,requireBusiness:mocks.business}));
import { PATCH,DELETE } from "../../src/app/api/activities/[id]/route";
import { POST as favorite } from "../../src/app/api/favorites/route";
import { POST as onboard } from "../../src/app/api/business/profile/route";
const origin="http://localhost:3000",owner="00000000-0000-4000-8000-000000000099",businessId="00000000-0000-4000-8000-000000000098";
const input=Object.fromEntries(Object.keys(CreateActivitySchema.shape).map(key=>[key,sharedSyntheticFixture[key as keyof typeof sharedSyntheticFixture]]));
const context={params:Promise.resolve({id:sharedSyntheticFixture.id})};
function request(method:string,value?:unknown,site=origin){return new Request(origin,{method,headers:{Origin:site,"Content-Type":"application/json"},...(value===undefined?{}:{body:JSON.stringify(value)})});}
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv("APP_ORIGIN",origin);});
function store(data:unknown){const eq=vi.fn().mockReturnThis(),update=vi.fn().mockReturnThis(),select=vi.fn().mockReturnThis(),maybeSingle=vi.fn().mockResolvedValue({data,error:null});const chain={eq,update,select,maybeSingle};mocks.business.mockResolvedValue({id:owner,business:{id:businessId},client:{from:()=>chain}});return chain;}
it("updates only the server-verified business and requested listing ID",async()=>{const db=store({...sharedSyntheticFixture,business_id:businessId});expect((await PATCH(request("PATCH",input),context)).status).toBe(200);expect(db.eq).toHaveBeenCalledWith("business_id",businessId);expect(db.eq).toHaveBeenCalledWith("id",sharedSyntheticFixture.id);expect(db.update.mock.calls[0][0]).not.toHaveProperty("business_id");});
it("a non-owned listing cannot be updated or archived",async()=>{store(null);expect((await PATCH(request("PATCH",input),context)).status).toBe(404);expect((await DELETE(request("DELETE"),context)).status).toBe(404);});
it("archive performs a scoped soft update instead of destroying data",async()=>{const db=store({...sharedSyntheticFixture,status:"archived"});expect((await DELETE(request("DELETE"),context)).status).toBe(200);expect(db.update).toHaveBeenCalledWith({status:"archived"});expect(db.eq).toHaveBeenCalledWith("business_id",businessId);});
it.each([401,403])("an authorization failure %i cannot modify an activity",async status=>{mocks.business.mockRejectedValue(new HttpError(status,"FORBIDDEN","Denied"));expect((await PATCH(request("PATCH",input),context)).status).toBe(status);});
it("rejects owner/provenance spoofing before mutation",async()=>{expect((await PATCH(request("PATCH",{...input,business_id:businessId}),context)).status).toBe(400);expect(mocks.business).not.toHaveBeenCalled();});
it("favorites use the verified user ID and reject client user IDs",async()=>{const insert=vi.fn().mockResolvedValue({error:null});mocks.user.mockResolvedValue({id:owner,client:{from:()=>({insert})}});expect((await favorite(request("POST",{listing_id:sharedSyntheticFixture.id}))).status).toBe(200);expect(insert).toHaveBeenCalledWith({user_id:owner,listing_id:sharedSyntheticFixture.id});expect((await favorite(request("POST",{listing_id:sharedSyntheticFixture.id,user_id:businessId}))).status).toBe(400);expect(insert).toHaveBeenCalledTimes(1);});
it("self-onboarding calls the ownership-derived RPC without actor or verification parameters",async()=>{const rpc=vi.fn().mockResolvedValue({data:businessId,error:null});mocks.user.mockResolvedValue({id:owner,client:{rpc}});const profile={name:"مشروع محلي",description:"وصف تجربة سياحية محلية",location_id:"irbid",category:"طبيعة",phone:null,whatsapp:null,website:null,social_url:null};expect((await onboard(request("POST",profile))).status).toBe(200);expect(rpc).toHaveBeenCalledWith("onboard_business",expect.objectContaining({p_name:profile.name,p_location:"irbid"}));expect(rpc.mock.calls[0][1]).not.toHaveProperty("owner_id");expect(rpc.mock.calls[0][1]).not.toHaveProperty("is_demo");});
