import seed from "../../../data/activities.seed.json";
import tourism from "../../../data/tourism.seed.json";
import { ActivitySchema, type Activity } from "@/contracts";
import { createClient } from "@/lib/supabase/server";
import { dataMode } from "@/lib/runtime";
import { HttpError } from "@/lib/http";
export const seedActivities: Activity[] = [...seed, ...tourism].map(value => ActivitySchema.parse(value));
export async function loadActivities(): Promise<Activity[]> {
    if (dataMode() === "seed")
        return seedActivities.filter(row => row.status === "published");
    const client = await createClient();
    const { data, error } = await client.from("activities").select("*").eq("status", "published").order("id").limit(1001);
    if (error || !data)
        throw new HttpError(503, "DATABASE_UNAVAILABLE", "تعذّر تحميل الأنشطة. لم يتم استبدال البيانات بعروض تجريبية.");
    if (data.length > 1000)
        throw new HttpError(503, "CATALOG_LIMIT", "الكتالوج أكبر من حد النسخة التجريبية.");
    return data.map(value => ActivitySchema.parse(value));
}
