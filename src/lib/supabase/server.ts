import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { HttpError } from "@/lib/http";
export async function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key)
        throw new HttpError(503, "SUPABASE_UNAVAILABLE", "إعداد قاعدة البيانات غير مكتمل.");
    const jar = await cookies();
    return createServerClient(url, key, { cookies: { getAll() { return jar.getAll(); }, setAll(values) { for (const { name, value, options } of values)
                jar.set(name, value, options); } } });
}
