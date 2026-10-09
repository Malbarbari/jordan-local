import { z } from "zod";
import { dataMode } from "@/lib/runtime";
import { loadTourism } from "@/lib/data/tourism";
import { createClient } from "@/lib/supabase/server";
import { failure,HttpError,json } from "@/lib/http";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const parsed=z.uuid().safeParse((await params).id);if(!parsed.success)throw new HttpError(404,"NOT_FOUND","المزود غير موجود.");const rows=(await loadTourism()).filter(r=>r.activity.business_id===parsed.data);if(!rows.length)throw new HttpError(404,"NOT_FOUND","المزود غير متاح.");let profile=null;if(dataMode()==="supabase"){const client=await createClient();const {data,error}=await client.from("business_profiles").select("*").eq("id",parsed.data).maybeSingle();if(error)throw new HttpError(503,"PROFILE_UNAVAILABLE","تعذّر تحميل ملف المزود.");profile=data;}return json({data:{provider:rows[0].provider,profile,listings:rows}});}catch(e){return failure(e);}}
