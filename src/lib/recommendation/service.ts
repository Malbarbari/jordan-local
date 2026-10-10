import { createHash } from "node:crypto";
import { PreferencesSchema, RecommendResponseSchema, type Activity, type RecommendRequest, type Recommendation, type Preferences, type ReasonCode } from "@/contracts";
import { dataMode } from "@/lib/runtime";
import { candidate, eligibility, type Candidate } from "./constraints";
import { normalize, questionsFor } from "./preferences";
import { configuredAI, validateRank, type AIProvider } from "./ai";
import type { CatalogMetadata } from "@/contracts/catalog";
import { discoveryMatches, discoveryReason, diversifyTies, queryDiscoveryTags, requiredDiscoveryTags } from "./discovery";
function reasons(codes: ReasonCode[], row: Candidate, p: Preferences) {
    const ar = p.locale === "ar";
    return codes.map(code => {
        switch (code) {
            case "INTEREST_MATCH": return ar ? "يتوافق مع اهتماماتك حسب تصنيفات النشاط." : "Matches your interests in the listing tags.";
            case "GROUP_MATCH": return ar ? "مناسب لنوع مجموعتك حسب بيانات العرض." : "Your group type is declared suitable in the listing.";
            case "WITHIN_BUDGET": return ar ? `إجمالي النشاط للمجموعة ${(row.total ?? 0) / 1000} دينار، ضمن ميزانيتك.` : `Group activity total ${(row.total ?? 0) / 1000} JOD is within your budget.`;
            case "DURATION_FIT": return ar ? "المدة المعلنة ضمن الحد الذي اخترته." : "Declared duration fits your limit.";
            case "SEASON_FIT": return ar ? "الشهر ضمن الموسم المعلن، وليس تأكيدًا للتوافر." : "Month fits the declared season; availability is unconfirmed.";
            default: return ar ? "تطابق وفق بيانات النشاط." : "Fits the listing data.";
        }
    });
}
export async function recommend(request: RecommendRequest, activities: Activity[], now: Date, options?: {
    ai?: AIProvider;
    disableAI?: boolean;
    catalog?: Map<string, CatalogMetadata>;
}) {
    const ai = options?.disableAI ? undefined : options?.ai ?? configuredAI();
    let extracted: Preferences | undefined;
    const warnings: string[] = [];
    if (ai && request.query) {
        try {
            extracted = PreferencesSchema.parse(await ai.extract(request));
        }
        catch {
            warnings.push("تعذّر تحليل النص بالذكاء الاصطناعي؛ استُخدمت الحقول والقواعد المحدودة.");
        }
    }
    const preferences = normalize(request, extracted);
    const catalogVersion = JSON.stringify(Array.from(options?.catalog ?? new Map<string, CatalogMetadata>()).sort(([a], [b]) => a.localeCompare(b)));
    const base = { schema_version: 1 as const, request_id: crypto.randomUUID(), data_mode: dataMode(), dataset_version: createHash("sha256").update(activities.map(a => a.id + ":" + a.updated_at).sort().join("|")).update(catalogVersion).digest("hex").slice(0, 16), preferences, questions: questionsFor(preferences, request.query, request.overrides), recommendations: [] as Recommendation[], candidate_count: 0, unconfirmed_count: 0, warnings };
    if (dataMode() === "seed")
        warnings.push("وضع بيانات تجريبي للقراءة فقط: العروض الافتراضية موسومة بوضوح؛ المعلومات الحقيقية تستند إلى المصادر المرتبطة. لا نؤكد التوافر أو السعة غير المنشورة.");
    warnings.push("الميزانية للنشاط فقط. تواصل مع المزود لتأكيد السعر والتوافر.");
    if (base.questions.length)
        return RecommendResponseSchema.parse({ ...base, status: "clarification", engine: "none" });
    let eligible: Candidate[] = [];
    for (const activity of activities) {
        const required = requiredDiscoveryTags(request.query);
        if (required.length && !required.every(tag => options?.catalog?.get(activity.id)?.discovery_tags.includes(tag))) continue;
        const state = eligibility(activity, preferences, now);
        if (state === "unconfirmed")
            base.unconfirmed_count++;
        if (state === "eligible") {
            const row = candidate(activity, preferences);
            row.catalog = options?.catalog?.get(activity.id);
            const requested = queryDiscoveryTags(request.query);
            if (requested.length && row.catalog) row.score = .75 * row.score + 25 * discoveryMatches(request.query, row.catalog).length / requested.length;
            eligible.push(row);
        }
    }
    eligible.sort((a, b) => b.score - a.score || a.activity.id.localeCompare(b.activity.id));
    eligible = diversifyTies(eligible, row => row.score, row => row.activity.business_id ?? row.activity.id);
    if (!eligible.length)
        return RecommendResponseSchema.parse({ ...base, status: "no_match", engine: "none" });
    if (eligible.length > 30) {
        eligible = eligible.slice(0, 30);
        warnings.push("تم ترتيب أفضل 30 مرشحًا وفق القواعد من الكتالوج المؤهل.");
    }
    base.candidate_count = eligible.length;
    let engine: "hybrid_llm" | "rules_fallback" = "rules_fallback";
    let ranked = eligible.map(row => ({ row, semantic: null as number | null, final: row.score, codes: row.codes }));
    if (ai) {
        try {
            const output = validateRank(await ai.rank(request, preferences, eligible), eligible);
            ranked = output.items.map(item => { const row = eligible.find(row => row.activity.id === item.activity_id)!; return { row, semantic: item.semantic_score, final: .65 * item.semantic_score + .35 * row.score, codes: item.reason_codes }; });
            engine = "hybrid_llm";
        }
        catch {
            warnings.push("تعذّر ترتيب الذكاء الاصطناعي أو لم يجتز التحقق؛ استُخدم ترتيب القواعد.");
        }
    }
    if (engine === "rules_fallback")
        warnings.push("ترتيب بالقواعد الحتمية؛ هذه النتيجة ليست استجابة ذكاء اصطناعي حي.");
    ranked.sort((a, b) => b.final - a.final || (b.semantic ?? 0) - (a.semantic ?? 0) || a.row.activity.id.localeCompare(b.row.activity.id));
    ranked = diversifyTies(ranked, item => item.final, item => item.row.activity.business_id ?? item.row.activity.id);
    const recommendations = ranked.slice(0, 5).map(({ row, semantic, final, codes }) => {
        const matches = discoveryMatches(request.query, row.catalog);
        return { activity_id: row.activity.id, activity: row.activity, total_cost_fils: row.total, distance_km: null, reason_codes: codes, reasons: [...reasons(codes, row, preferences), ...(matches.length ? [discoveryReason(matches, preferences.locale)] : [])], scores: { semantic, deterministic: row.score, final } };
    });
    return RecommendResponseSchema.parse({ ...base, recommendations, status: engine === "hybrid_llm" ? "ok" : "degraded", engine });
}
