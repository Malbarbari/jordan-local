import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { body,failure,HttpError,json,requireSameOrigin } from "@/lib/http";
export async function GET(){try{const {id,client}=await requireUser();const {data,error}=await client.from("favorites").select("listing_id").eq("user_id",id);if(error)throw new HttpError(503,"FAVORITES_FAILED","تعذّر تحميل المحفوظات.");return json({data:(data??[]).map(r=>r.listing_id)});}catch(e){return failure(e);}}
export async function POST(request:Request){try{requireSameOrigin(request);const input=await body(request,z.strictObject({listing_id:z.uuid()}));const {id,client}=await requireUser();const {error}=await client.from("favorites").insert({user_id:id,listing_id:input.listing_id});if(error&&error.code!=="23505")throw new HttpError(422,"FAVORITE_FAILED","القائمة غير متاحة للحفظ.");return json({data:input});}catch(e){return failure(e);}}
