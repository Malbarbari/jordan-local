import type { TourismListing } from "@/contracts/tourism";
import { discoveryMatches, diversifyTies } from "@/lib/recommendation/discovery";
function normalizeText(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[\u064b-\u065f]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي"); }
export function tourismScore(row: TourismListing, query: string) {
    query = normalizeText(query);
    if (!query.trim()) return 0;
    const text = normalizeText(`${row.activity.title_ar} ${row.activity.title_en} ${row.activity.description_ar} ${row.activity.description_en}`);
    const terms = query.split(/\s+/).filter(term => term.length > 2);
    return discoveryMatches(query, row.metadata).length * 10 + terms.filter(term => text.includes(term)).length;
}
// Call only after hard filtering. This scorer cannot create IDs or change facts.
export function rankTourism(eligible: TourismListing[], query: string) {
    const score = (row: TourismListing) => tourismScore(row, query);
    const rows = [...eligible].sort((a,b) => score(b) - score(a) || a.activity.id.localeCompare(b.activity.id));
    return diversifyTies(rows, score, row => row.activity.business_id ?? row.activity.id);
}
