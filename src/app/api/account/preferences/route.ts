import { requireUser } from "@/lib/auth/server";
import { UserPreferencesSchema, emptyPreferences } from "@/contracts/settings";
import { body, failure, HttpError, json, requireSameOrigin } from "@/lib/http";
export async function GET() { try {
    const { id, client } = await requireUser();
    const { data, error } = await client.from("user_preferences").select("payload").eq("user_id", id).maybeSingle();
    if (error)
        throw new HttpError(503, "PREFERENCES_UNAVAILABLE", "تعذّر تحميل التفضيلات. راجع migration 006.");
    return json({ data: UserPreferencesSchema.parse(data?.payload ?? emptyPreferences) });
}
catch (e) {
    return failure(e);
} }
export async function PATCH(request: Request) { try {
    requireSameOrigin(request);
    const input = await body(request, UserPreferencesSchema);
    const { id, client } = await requireUser();
    const { error } = await client.from("user_preferences").upsert({ user_id: id, payload: input });
    if (error)
        throw new HttpError(503, "PREFERENCES_FAILED", "لم تُحفظ التفضيلات.");
    return json({ data: input });
}
catch (e) {
    return failure(e);
} }
