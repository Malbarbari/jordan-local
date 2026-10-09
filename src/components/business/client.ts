import { ActivitiesResponseSchema, CreateActivityResponseSchema, CreateActivitySchema, ErrorResponseSchema, MeResponseSchema, type CreateActivity, type Activity } from "@/contracts";
import { sharedSyntheticFixture } from "@/contracts/fixtures";
import { createClient } from "@/lib/supabase/client";
export class ApiError extends Error {
    constructor(message: string, public status: number, public fields: Record<string, string> = {}) { super(message); }
}
export const demoEnabled = process.env.NEXT_PUBLIC_UI_DEMO === "true";
const sessionKey = "jordan-local-ui-demo-session";
let demoRows: Activity[] = [sharedSyntheticFixture];
export function beginDemo() { if (!demoEnabled)
    throw new Error("Demo disabled"); sessionStorage.setItem(sessionKey, "business"); }
function requireDemo() { if (sessionStorage.getItem(sessionKey) !== "business")
    throw new ApiError("Sign in to the labelled UI demo first.", 401); }
async function request(path: string, init?: RequestInit) {
    const response = await fetch(path, { ...init, cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(15000), headers: { "Content-Type": "application/json", ...init?.headers } });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
        const error = ErrorResponseSchema.safeParse(body);
        throw new ApiError(error.success ? error.data.error.message : "Service unavailable. Please try again.", response.status, error.success ? error.data.error.fields : {});
    }
    return body;
}
export async function signIn(email: string, password: string): Promise<void> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
        throw new ApiError("إعداد تسجيل الدخول غير مكتمل. يمكنك استكشاف العرض التجريبي دون حساب.", 503);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) throw new ApiError("تعذّر الدخول. راجع البريد وكلمة المرور.", 401);
}
export async function signOut(): Promise<void> {
    if (demoEnabled) { sessionStorage.removeItem(sessionKey); return; }
    const { error } = await createClient().auth.signOut();
    if (error) throw new ApiError("تعذّر تسجيل الخروج.", 503);
}
export async function getMe() { if (demoEnabled) {
    requireDemo();
    return MeResponseSchema.parse({ data: { user_id: "00000000-0000-4000-8000-000000000011", role: "business", business_id: sharedSyntheticFixture.business_id, locale: "ar" } }).data;
} return MeResponseSchema.parse(await request("/api/me")).data; }
export async function listOwn() { if (demoEnabled) {
    requireDemo();
    return [...demoRows];
} return ActivitiesResponseSchema.parse(await request("/api/activities?mine=true")).data; }
export async function createListing(input: CreateActivity) { const data = CreateActivitySchema.parse(input); if (demoEnabled) {
    requireDemo();
    const now = new Date().toISOString();
    const row = CreateActivityResponseSchema.parse({ data: { ...sharedSyntheticFixture, ...data, title_en: data.title_en ?? null, description_en: data.description_en ?? null, id: crypto.randomUUID(), price_status: data.price_unit === "unknown" ? "unknown" : "synthetic_demo", created_at: now, updated_at: now, price_checked_at: data.price_unit === "unknown" ? null : now } }).data;
    demoRows = [row, ...demoRows];
    return row;
} return CreateActivityResponseSchema.parse(await request("/api/activities", { method: "POST", body: JSON.stringify(data) })).data; }
