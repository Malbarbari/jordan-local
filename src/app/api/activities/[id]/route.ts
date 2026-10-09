import { z } from "zod";
import { ActivitySchema,CreateActivitySchema } from "@/contracts";
import { requireBusiness } from "@/lib/auth/server";
import { body,failure,HttpError,json,requireSameOrigin } from "@/lib/http";
type Context={params:Promise<{id:string}>};
async function update(request:Request,context:Context,archive:boolean){try{requireSameOrigin(request);const id=z.uuid().parse((await context.params).id);const input=archive?{status:"archived"}:await body(request,CreateActivitySchema);const {client,business}=await requireBusiness();const {data,error}=await client.from("activities").update(input).eq("id",id).eq("business_id",business.id).select("*").maybeSingle();if(error)throw new HttpError(503,"UPDATE_FAILED","لم يُحفظ التعديل.");if(!data)throw new HttpError(404,"NOT_FOUND","القائمة غير موجودة ضمن منشأتك.");return json({data:ActivitySchema.parse(data)});}catch(e){return failure(e);}}
export async function PATCH(request:Request,context:Context){return update(request,context,false);}
export async function DELETE(request:Request,context:Context){return update(request,context,true);}
