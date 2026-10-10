import type { CatalogMetadata, DiscoveryTag } from "@/contracts/catalog";
import { discoveryLabels } from "@/contracts/catalog";
const patterns: Partial<Record<DiscoveryTag, RegExp>> = {
 hiking: /مسير|مشي|هايكن[جقغ]|hiking|trail/i, swimming: /سباح|مسبح|مسابح|swim|pool/i,
 pools: /مسبح|مسابح|pool/i, sea: /بحر|sea|beach/i, cabins: /كوخ|أكواخ|اكواخ|كابين|cabin/i,
 farms: /مزرع|مزارع|farm/i, camps: /مخيم|تخييم|camp/i, wellness: /استرخاء|ينابيع|عافية|هادئ|هادي|wellness|relax/i,
 scenic: /إطلال|اطلال|مناظر|تصوير|scenic|view/i, historical: /تاريخ|آثار|اثار|قلع|histor|ruins/i,
 cultural: /ثقاف|تراث|cultur/i, local_tours: /جول|مرشد|tour/i,
 nature: /طبيعة|nature/i, adventure: /مغامر|adventure/i, food: /طعام|أكل|اكل|food/i,
};
export function queryDiscoveryTags(query: string): DiscoveryTag[] {
    const positive=query.replace(/(?:ما بدنا|ما بدي|بدون|لا أريد|لا اريد|without|not)\s+\S+/gi, "");
    return Object.entries(patterns).filter(([, pattern]) => pattern.test(positive)).map(([tag]) => tag as DiscoveryTag);
}
// Explicit mandatory clauses and clearly requested activity types are hard filters.
// Never infer accessibility or safety from discovery tags.
export function requiredDiscoveryTags(query: string): DiscoveryTag[] {
    const positive=query.replace(/(?:ما بدنا|ما بدي|بدون|لا أريد|لا اريد|without|not)\s+\S+/gi, "");
    const clauses = positive.split(/[،,.؛!?\n]/).filter(clause => /لازم|ضروري|فقط|must|only/i.test(clause));
    const activityTags:DiscoveryTag[]=["hiking","swimming","pools","cabins","farms","camps","sea"];
    const explicit=/بدي|بدنا|نريد|أريد|اريد|اقترح|want|looking for/i.test(positive)?queryDiscoveryTags(positive).filter(tag=>activityTags.includes(tag)):[];
    return [...new Set([...clauses.flatMap(queryDiscoveryTags),...explicit])];
}
export function discoveryMatches(query: string, metadata?: CatalogMetadata): DiscoveryTag[] {
    return metadata ? queryDiscoveryTags(query).filter(tag => metadata.discovery_tags.includes(tag)) : [];
}
export function discoveryReason(tags: DiscoveryTag[], locale: "ar" | "en") {
    return locale === "ar" ? `يتوافق مع وصفك عبر الوسوم المعلنة: ${tags.map(tag => discoveryLabels[tag]).join("، ")}. الوسوم لا تؤكد السلامة أو التوافر.` : `Matches declared discovery tags: ${tags.join(", ")}. Tags do not confirm safety or availability.`;
}
// Diversity only breaks exact relevance ties; it never promotes a weaker fit.
export function diversifyTies<T>(rows: T[], score: (row: T) => number, provider: (row: T) => string): T[] {
    const result: T[] = [], counts = new Map<string, number>();
    for (let start = 0; start < rows.length;) {
        let end = start + 1;
        while (end < rows.length && score(rows[end]) === score(rows[start])) end++;
        const tied = rows.slice(start, end);
        while (tied.length) {
            let selected = 0;
            for (let i = 1; i < tied.length; i++) if ((counts.get(provider(tied[i])) ?? 0) < (counts.get(provider(tied[selected])) ?? 0)) selected = i;
            const row = tied.splice(selected, 1)[0];
            result.push(row); const key = provider(row); counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        start = end;
    }
    return result;
}
