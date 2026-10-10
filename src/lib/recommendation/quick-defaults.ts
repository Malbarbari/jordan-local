import { parseQuery } from "./preferences";
import type { Preferences } from "@/contracts";
/** Explicit UI demo defaults; never claim road distance or transport-inclusive prices. */
export function quickNatureDefaults(query: string): Partial<Preferences> {
 const normalized=query.normalize("NFKC").replace(/[\u064b-\u065f]/g,"");
 const parsed=parseQuery(query);
 if (!/بدي/.test(normalized) || !/طبيعة/.test(normalized) || !/قريب/.test(normalized) || !/عمان/.test(normalized) || parsed.party_size != null || parsed.budget_fils == null) return {};
 return { party_size:1, budget_scope:"per_group", budget_basis:"activity_only", destination_location_ids:["amman","as-salt","jerash"] };
}
