export function dataMode(): "seed" | "supabase" {
    const mode = process.env.DATA_MODE ?? "seed";
    if (mode !== "seed" && mode !== "supabase")
        throw new Error("Invalid DATA_MODE");
    return mode;
}
export function hasSupabase() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
// Both switches are required. A key alone never authorizes a paid request.
export function aiEnabled() {
    return process.env.AI_MODE === "hybrid" && process.env.ALLOW_PAID_AI === "true" && Boolean(process.env.OPENAI_API_KEY);
}
