import { PublicBusinessSettingsSchema } from "@/contracts/settings";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dataMode } from "@/lib/runtime";
import { failure, HttpError, json } from "@/lib/http";
export async function GET(_request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { try {
    const parsed = z.uuid().safeParse((await params).id);
    if (!parsed.success)
        throw new HttpError(404, "NOT_FOUND", "الملف غير موجود.");
    if (dataMode() === "seed")
        return json({ data: null });
    const client = await createClient();
    const { data, error } = await client.from("public_business_settings").select("business_id,name_en,service_area,activity_types,profile_image_url,minimum_group_size,maximum_group_size,price_range_min_fils,price_range_max_fils,license_status,license_verification_status").eq("business_id", parsed.data).maybeSingle();
    if (error)
        throw new HttpError(503, "SETTINGS_UNAVAILABLE", "تعذّر قراءة البيانات العامة.");
    return json({ data: data ? PublicBusinessSettingsSchema.parse(data) : null });
}
catch (e) {
    return failure(e);
} }
