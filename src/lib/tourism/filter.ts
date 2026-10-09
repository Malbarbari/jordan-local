import type { TourismFilters, TourismListing } from "@/contracts/tourism";
import { neutral } from "@/lib/recommendation/preferences";
import { eligibility } from "@/lib/recommendation/constraints";
export function filterTourism(listings: TourismListing[], filters: TourismFilters, now: Date) {
    let unconfirmed = 0;
    const preferences = { ...neutral, destination_location_ids: filters.location_id ? [filters.location_id] : [], party_size: filters.party_size ?? null, group_type: filters.group_type ?? null, budget_fils: filters.budget_fils ?? null, budget_scope: "per_group" as const, budget_basis: "activity_only" as const };
    const rows = listings.filter(row => (!filters.listing_kind || row.metadata.listing_kind === filters.listing_kind) && (!filters.category || row.activity.category === filters.category) && (!filters.tag || row.metadata.discovery_tags.includes(filters.tag))).filter(row => {
        const state = eligibility(row.activity, preferences, now);
        if (state === "unconfirmed") unconfirmed++;
        return state === "eligible";
    });
    return { rows, unconfirmed };
}
