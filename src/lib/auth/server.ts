import { createClient } from "@/lib/supabase/server";
import { HttpError } from "@/lib/http";
import { dataMode } from "@/lib/runtime";
export async function requireUser() {
    if (dataMode() === "seed")
        throw new HttpError(503, "DEMO_READ_ONLY", "عرض تجريبي للقراءة فقط. فعّل Supabase للنشر الحقيقي.");
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user)
        throw new HttpError(401, "UNAUTHENTICATED", "سجّل الدخول للمتابعة.");
    return { id: data.user.id, client };
}
export async function requireBusiness() {
    const user = await requireUser();
    const { data, error } = await user.client.from("businesses").select("id,is_demo").eq("owner_id", user.id).maybeSingle();
    if (error)
        throw new HttpError(503, "DATABASE_UNAVAILABLE", "تعذّر قراءة بيانات المنشأة.");
    if (!data)
        throw new HttpError(403, "BUSINESS_REQUIRED", "الحساب ليس مرتبطًا بمنشأة.");
    return { ...user, business: data as {
            id: string;
            is_demo: boolean;
        } };
}
