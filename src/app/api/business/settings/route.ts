import { requireBusiness } from "@/lib/auth/server";
import { BusinessSettingsSchema, emptyBusinessSettings } from "@/contracts/settings";
import { body, failure, HttpError, json, requireSameOrigin } from "@/lib/http";
const fields = "name_en,service_area,activity_types,profile_image_url,image_rights_confirmed,minimum_group_size,maximum_group_size,price_range_min_fils,price_range_max_fils,license_status,licensing_authority,registration_number,license_expires_on,license_verification_status";
export async function GET() { try {
    const { business, client } = await requireBusiness();
    const { data, error } = await client.from("business_settings").select(fields).eq("business_id", business.id).maybeSingle();
    if (error)
        throw new HttpError(503, "SETTINGS_UNAVAILABLE", "تعذّر تحميل بيانات المنشأة. راجع migration 006.");
    if (!data)
        return json({ data: { settings: emptyBusinessSettings, license_verification_status: "unverified" } });
    const { license_verification_status, ...settings } = data;
    return json({ data: { settings: BusinessSettingsSchema.parse(settings), license_verification_status } });
}
catch (e) {
    return failure(e);
} }
export async function PATCH(request: Request) { try {
    requireSameOrigin(request);
    const input = await body(request, BusinessSettingsSchema);
    const { business, client } = await requireBusiness();
    const { error } = await client.from("business_settings").upsert({ business_id: business.id, ...input });
    if (error)
        throw new HttpError(503, "SETTINGS_FAILED", "لم تُحفظ بيانات المنشأة.");
    return json({ data: { settings: input } });
}
catch (e) {
    return failure(e);
} }
