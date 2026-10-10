import { RecommendRequestSchema, RecommendResponseSchema } from "@/contracts";
import { body, failure, HttpError, json, requireSameOrigin } from "@/lib/http";
import { loadActivities } from "@/lib/data/activities";
import { requireUser } from "@/lib/auth/server";
import { dataMode,aiEnabled } from "@/lib/runtime";
import { recommend } from "@/lib/recommendation/service";
import { eligibility } from "@/lib/recommendation/constraints";
import { enrichCatalog } from "@/lib/data/catalog";
import { requiredDiscoveryTags } from "@/lib/recommendation/discovery";
export const runtime = "nodejs";
const requests = new Map<string, {
    time: number;
    count: number;
}>();
function limit(id: string) {
    const now = Date.now();
    for (const [key, value] of requests)
        if (now - value.time > 60000)
            requests.delete(key);
    if (requests.size > 1000)
        throw new HttpError(429, "RATE_LIMITED", "حاول بعد دقيقة.");
    const value = requests.get(id) ?? { time: now, count: 0 };
    value.count++;
    requests.set(id, value);
    if (value.count > 15)
        throw new HttpError(429, "RATE_LIMITED", "حاول بعد دقيقة.");
}
export async function POST(request: Request) {
    try {
        requireSameOrigin(request);
        const input = await body(request, RecommendRequestSchema);
        if (dataMode() === "supabase" && aiEnabled()) {
            const user = await requireUser();
            limit(user.id);
        }
        const activities = await loadActivities();
        const catalog = await enrichCatalog(activities);
        const result = await recommend(input, activities, new Date(), { catalog: new Map(catalog.entries.map(row => [row.activity.id, row.metadata])) });
        if (!catalog.available) result.warnings.push("التصنيفات الإضافية غير متاحة بالكامل؛ استخدمنا بيانات القوائم الأساسية دون بيانات مزودين افتراضية.");
        if (dataMode() === "supabase" && result.recommendations.length) {
            const current = await loadActivities();
            const required = requiredDiscoveryTags(input.query);
            const freshCatalog = required.length ? await enrichCatalog(current) : null;
            result.recommendations = result.recommendations.filter(row => { const fresh = current.find(a => a.id === row.activity_id); const metadata = freshCatalog?.entries.find(entry => entry.activity.id === row.activity_id)?.metadata; return fresh && fresh.updated_at === row.activity.updated_at && eligibility(fresh, result.preferences, new Date()) === "eligible" && required.every(tag => metadata?.discovery_tags.includes(tag)); });
            if (!result.recommendations.length) {
                result.status = "no_match";
                result.engine = "none";
                result.warnings.push("تغيرت بيانات النتائج أثناء الطلب؛ أعد البحث.");
            }
        }
        return json(RecommendResponseSchema.parse(result));
    }
    catch (error) {
        return failure(error);
    }
}
