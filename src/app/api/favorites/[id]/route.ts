import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { failure,HttpError,json,requireSameOrigin } from "@/lib/http";
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){try{requireSameOrigin(request);const id=z.uuid().parse((await params).id);const user=await requireUser();const {error}=await user.client.from("favorites").delete().eq("user_id",user.id).eq("listing_id",id);if(error)throw new HttpError(503,"FAVORITE_FAILED","لم تُحذف المحفوظة.");return json({data:{removed:true}});}catch(e){return failure(e);}}
