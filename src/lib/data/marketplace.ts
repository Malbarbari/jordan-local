import source from "../../../data/marketplace.json";
import { MarketplaceSchema } from "@/contracts/marketplace";
import { ActivitySchema } from "@/contracts";
export const marketplace = MarketplaceSchema.parse(source);
// Preserve API v1 geography; conditional and nightly prices stay additive.
export const marketplaceActivities = marketplace.listings.flatMap(row => {
    const parsed = ActivitySchema.safeParse(row.activity);
    return parsed.success ? [parsed.data] : [];
});
