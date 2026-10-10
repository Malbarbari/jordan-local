import { ActivitySchema, type Preferences, type Recommendation } from "@/contracts";
import { CatalogEntrySchema, type CatalogEntry } from "@/contracts/catalog";
import type { TourismListing } from "@/contracts/tourism";
import { eligibility, candidate } from "@/lib/recommendation/constraints";
// Explicit browser-only demo overlay. Server responses and AI candidates never
// include client-submitted fixtures. Reuse the same deterministic constraints.
export function localRecommendations(rows: TourismListing[], preferences: Preferences, now: Date): {
    entry: CatalogEntry;
    recommendation: Recommendation;
}[] {
    return rows.flatMap(row => {
        const parsed = ActivitySchema.safeParse(row.activity);
        if (!parsed.success || parsed.data.data_kind !== "synthetic_demo" || eligibility(parsed.data, preferences, now) !== "eligible")
            return [];
        const a = parsed.data, c = candidate(a, preferences);
        const entry = CatalogEntrySchema.parse({ activity: a, metadata: row.metadata, provider: row.provider ? { id: row.provider.id, name: row.provider.name, is_demo: true, verification_status: "unverified" } : null });
        return [{ entry, recommendation: { activity_id: a.id, activity: a, total_cost_fils: c.total, distance_km: null, reason_codes: c.codes, reasons: [`نموذج محفوظ في هذا المتصفح: ${c.total === null ? "الكلفة غير مؤكدة" : `كلفة المجموعة ${c.total / 1000} دينار`}. يطابق الشروط المعلنة؛ ليس ردًا من الذكاء الاصطناعي.`], scores: { semantic: null, deterministic: c.score, final: c.score } } }];
    }).sort((a, b) => b.recommendation.scores.final - a.recommendation.scores.final || a.entry.activity.id.localeCompare(b.entry.activity.id)).slice(0, 6);
}
