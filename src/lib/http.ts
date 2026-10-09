import { NextResponse } from "next/server";
import type { ZodType } from "zod";
export class HttpError extends Error {
    constructor(public status: number, public code: string, message: string, public fields: Record<string, string> = {}) { super(message); }
}
export function json(data: unknown, status = 200) {
    return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export function failure(error: unknown) {
    const known = error instanceof HttpError;
    return json({ error: { code: known ? error.code : "SERVICE_UNAVAILABLE", message: known ? error.message : "الخدمة غير متاحة الآن. حاول مجددًا.", fields: known ? error.fields : {}, request_id: crypto.randomUUID() } }, known ? error.status : 503);
}
export function requireSameOrigin(request: Request) {
    const origin = request.headers.get("origin");
    const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
    if (!origin || origin !== expected)
        throw new HttpError(403, "FORBIDDEN_ORIGIN", "طلب من مصدر غير مسموح.");
}
export async function body<T>(request: Request, schema: ZodType<T>): Promise<T> {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
        throw new HttpError(400, "VALIDATION_ERROR", "استخدم JSON.");
    if (Number(request.headers.get("content-length") ?? 0) > 16384)
        throw new HttpError(400, "VALIDATION_ERROR", "الطلب أكبر من الحد المسموح.");
    const reader = request.body?.getReader();
    if (!reader)
        throw new HttpError(400, "VALIDATION_ERROR", "الطلب فارغ.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        size += value.byteLength;
        if (size > 16384) {
            await reader.cancel();
            throw new HttpError(400, "VALIDATION_ERROR", "الطلب أكبر من الحد المسموح.");
        }
        chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    let input: unknown;
    try {
        input = JSON.parse(new TextDecoder().decode(bytes));
    }
    catch {
        throw new HttpError(400, "VALIDATION_ERROR", "JSON غير صالح.");
    }
    const result = schema.safeParse(input);
    if (!result.success)
        throw new HttpError(result.error.issues.some(issue => issue.code === "custom") ? 422 : 400, "VALIDATION_ERROR", "راجع حقول الطلب.", Object.fromEntries(result.error.issues.map(issue => [issue.path.join("."), issue.message])));
    return result.data;
}
