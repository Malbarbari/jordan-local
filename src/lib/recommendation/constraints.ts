import type { Activity, Preferences, ReasonCode } from "@/contracts";
import type { CatalogMetadata } from "@/contracts/catalog";
export type Candidate = {
    activity: Activity;
    total: number | null;
    codes: ReasonCode[];
    score: number;
    catalog?: CatalogMetadata;
};
export function groupCost(a: Pick<Activity, "price_unit" | "price_fils">, n: number | null): number | null {
    if (a.price_unit === "free")
        return 0;
    if (a.price_fils === null)
        return null;
    return a.price_unit === "per_group" ? a.price_fils : a.price_unit === "per_person" && n !== null ? a.price_fils * n : null;
}
export function budgetTotal(p: Pick<Preferences, "budget_fils" | "budget_scope" | "party_size">) { return p.budget_fils === null ? null : p.budget_scope === "per_person" ? (p.party_size === null ? null : p.budget_fils * p.party_size) : p.budget_fils; }
export function freshPrice(a: Pick<Activity, "price_status" | "price_unit" | "price_checked_at" | "price_valid_until">, now: Date) {
    if (a.price_status === "unknown" || a.price_unit === "unknown")
        return false;
    if (a.price_status === "synthetic_demo")
        return true;
    if (!a.price_checked_at)
        return false;
    const checked = Date.parse(a.price_checked_at), until = a.price_valid_until ? Date.parse(a.price_valid_until) : checked + 30 * 86400000;
    return checked <= now.getTime() && until >= now.getTime();
}
export function eligibility(a: Omit<Activity, "location_id"> & { location_id: string }, p: Omit<Preferences, "destination_location_ids"> & { destination_location_ids: string[] }, now: Date): "eligible" | "excluded" | "unconfirmed" {
    if (a.status !== "published")
        return "excluded";
    if (p.destination_location_ids.length && !p.destination_location_ids.includes(a.location_id))
        return "excluded";
    if (p.party_size !== null) {
        if (a.capacity_people === null)
            return "unconfirmed";
        if (a.capacity_people < p.party_size)
            return "excluded";
    }
    if (p.group_type) {
        if (!a.group_types.includes(p.group_type))
            return "excluded";
        if (p.group_type === "family") {
            if (a.family_friendly === null)
                return "unconfirmed";
            if (!a.family_friendly)
                return "excluded";
        }
    }
    const budget = budgetTotal(p);
    if (budget !== null) {
        if (!freshPrice(a, now))
            return "unconfirmed";
        const cost = groupCost(a, p.party_size);
        if (cost === null)
            return "unconfirmed";
        if (cost > budget)
            return "excluded";
    }
    if (p.max_duration_minutes !== null) {
        if (a.duration_minutes === null)
            return "unconfirmed";
        if (a.duration_minutes > p.max_duration_minutes)
            return "excluded";
    }
    if (p.month !== null) {
        if (!a.available_months)
            return "unconfirmed";
        if (!a.available_months.includes(p.month))
            return "excluded";
    }
    return "eligible";
}
export function candidate(a: Activity, p: Preferences): Candidate {
    const cost = groupCost(a, p.party_size), budget = budgetTotal(p), codes: ReasonCode[] = [];
    const overlap = p.interests.filter(value => a.tags.includes(value));
    if (overlap.length)
        codes.push("INTEREST_MATCH");
    if (p.group_type && a.group_types.includes(p.group_type))
        codes.push("GROUP_MATCH");
    if (budget !== null && cost !== null && cost <= budget)
        codes.push("WITHIN_BUDGET");
    if (p.max_duration_minutes !== null)
        codes.push("DURATION_FIT");
    if (p.month !== null)
        codes.push("SEASON_FIT");
    const interest = p.interests.length ? overlap.length / p.interests.length : .5;
    const environment = p.environments.length ? p.environments.filter(value => a.environment.includes(value)).length / p.environments.length : .5;
    const economy = budget !== null && budget > 0 && cost !== null ? Math.max(0, 1 - cost / budget) : .5;
    return { activity: a, total: cost, codes, score: 100 * (.5 * interest + .2 * environment + .2 * .5 + .1 * economy) };
}
