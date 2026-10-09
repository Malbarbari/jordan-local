import { z } from "zod";
import { ActivitySchema, CreateActivitySchema, LocationIdSchema, CategorySchema } from "@/contracts";
import { body, failure, HttpError, json, requireSameOrigin } from "@/lib/http";
import { requireBusiness } from "@/lib/auth/server";
import { loadActivities } from "@/lib/data/activities";
export const runtime = "nodejs";
const Query = z.strictObject({ location_id: LocationIdSchema.optional(), category: CategorySchema.optional(), mine: z.enum(["true", "false"]).optional(), limit: z.coerce.number().int().min(1).max(30).default(30) });
export async function GET(request: Request) {
    try {
        const parsed = Query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
        if (!parsed.success)
            throw new HttpError(400, "VALIDATION_ERROR", "مرشحات غير صالحة.");
        const query = parsed.data;
        let rows;
        if (query.mine === "true") {
            const { client, business } = await requireBusiness();
            const { data, error } = await client.from("activities").select("*").eq("business_id", business.id).order("created_at", { ascending: false });
            if (error || !data)
                throw new HttpError(503, "DATABASE_UNAVAILABLE", "تعذّر تحميل أنشطتك.");
            rows = data.map(value => ActivitySchema.parse(value));
        }
        else
            rows = await loadActivities();
        rows = rows.filter(row => (!query.location_id || row.location_id === query.location_id) && (!query.category || row.category === query.category));
        return json({ data: rows.slice(0, query.limit), meta: { count: rows.length } });
    }
    catch (error) {
        return failure(error);
    }
}
export async function POST(request: Request) {
    try {
        requireSameOrigin(request);
        const input = await body(request, CreateActivitySchema);
        const { client, business } = await requireBusiness();
        const { data, error } = await client.from("activities").insert({ ...input, title_en: input.title_en ?? null, description_en: input.description_en ?? null, business_id: business.id }).select("*").single();
        if (error || !data)
            throw new HttpError(503, "CREATE_FAILED", "تعذّر حفظ النشاط. حاول مجددًا.");
        return json({ data: ActivitySchema.parse(data) }, 201);
    }
    catch (error) {
        return failure(error);
    }
}
