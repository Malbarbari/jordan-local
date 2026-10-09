import { requireUser } from "@/lib/auth/server";
import { failure, HttpError, json } from "@/lib/http";
export const runtime = "nodejs";
export async function GET() {
    try {
        const { id, client } = await requireUser();
        const { data, error } = await client.from("businesses").select("id").eq("owner_id", id).maybeSingle();
        if (error)
            throw new HttpError(503, "DATABASE_UNAVAILABLE", "تعذّر قراءة الدور.");
        return json({ data: { user_id: id, role: data ? "business" : "visitor", business_id: data?.id ?? null, locale: "ar" } });
    }
    catch (error) {
        return failure(error);
    }
}
