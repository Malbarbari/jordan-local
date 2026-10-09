import { CatalogMetadataSchema,defaultMetadata } from "@/contracts/catalog";
import { ActivitySchema } from "@/contracts";
import { requireBusiness } from "@/lib/auth/server";
import { body, failure, HttpError, json, requireSameOrigin } from "@/lib/http";
import { z } from "zod";
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
    try{const id=z.uuid().parse((await context.params).id);const {client,business}=await requireBusiness();const {data:activity,error}=await client.from("activities").select("*").eq("id",id).eq("business_id",business.id).maybeSingle();if(error)throw new HttpError(503,"DATABASE_UNAVAILABLE","تعذّر تحميل القائمة.");if(!activity)throw new HttpError(404,"NOT_FOUND","القائمة ليست ضمن منشأتك.");const {data,error:readError}=await client.from("catalog_metadata").select("listing_kind,discovery_tags,estimated_price_fils,estimated_price_unit").eq("activity_id",id).maybeSingle();if(readError)throw new HttpError(503,"METADATA_UNAVAILABLE","تعذّر تحميل التصنيف.");return json({data:data?CatalogMetadataSchema.parse(data):defaultMetadata(ActivitySchema.parse(activity))});}catch(error){return failure(error);}
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        requireSameOrigin(request);
        const input = await body(request, CatalogMetadataSchema);
        const id = z.uuid().parse((await context.params).id);
        const { client, business } = await requireBusiness();
        const { data: activity, error } = await client.from("activities").select("id,price_unit").eq("id", id).eq("business_id", business.id).maybeSingle();
        if (error) throw new HttpError(503, "DATABASE_UNAVAILABLE", "تعذّر قراءة القائمة.");
        if (!activity) throw new HttpError(404, "NOT_FOUND", "القائمة غير موجودة ضمن منشأتك.");
        if (input.listing_kind === "destination") throw new HttpError(422, "PUBLIC_DESTINATION", "الوجهات العامة لا تُنشر كملكية خاصة.");
        if (input.estimated_price_fils !== null && activity.price_unit !== "unknown") throw new HttpError(422, "ESTIMATE_CONFLICT", "استخدم التقدير فقط عندما يكون السعر المؤكد غير معروف.");
        const { error: writeError } = await client.from("catalog_metadata").upsert({ activity_id: id, ...input }, { onConflict: "activity_id" });
        if (writeError) throw new HttpError(503, "METADATA_UNAVAILABLE", "حُفظت القائمة الأساسية؛ تعذّر حفظ التصنيف الإضافي. راجع تطبيق migration 002.");
        return json({ data: input });
    } catch (error) { return failure(error); }
}
