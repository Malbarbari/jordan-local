import seedMetadata from "../../../data/catalog.seed.json";
import { CatalogEntrySchema, CatalogMetadataSchema, PublicProviderSchema, defaultMetadata, type CatalogEntry } from "@/contracts/catalog";
import type { Activity } from "@/contracts";
import { dataMode } from "@/lib/runtime";
import { createClient } from "@/lib/supabase/server";

export async function enrichCatalog(activities: Activity[]): Promise<{ entries: CatalogEntry[]; available: boolean }> {
    const metadata = new Map<string, unknown>();
    const providers = new Map<string, unknown>();
    let available = true;
    if (dataMode() === "seed") {
        for (const row of seedMetadata) metadata.set(row.activity_id, row.metadata);
        providers.set("00000000-0000-4000-8000-000000000010", { id: "00000000-0000-4000-8000-000000000010", name: "مزود افتراضي لاختبار العرض", is_demo: true, verification_status: "unverified" });
    } else { try {
        const client = await createClient();
        const [m, p] = await Promise.all([
            client.from("catalog_metadata").select("activity_id,listing_kind,discovery_tags,estimated_price_fils,estimated_price_unit").limit(1001),
            client.from("catalog_providers").select("id,name,is_demo,verification_status").limit(1001),
        ]);
        available = !m.error && !p.error;
        if (!m.error) for (const row of m.data ?? []) { const { activity_id, ...value } = row; metadata.set(activity_id, value); }
        if (!p.error) for (const row of p.data ?? []) providers.set(row.id, row);
    } catch { available = false; }
    }
    const entries = activities.map(activity => {
        const m = CatalogMetadataSchema.safeParse(metadata.get(activity.id));
        const p = PublicProviderSchema.safeParse(providers.get(activity.business_id ?? ""));
        if ((metadata.has(activity.id) && !m.success) || (activity.business_id && providers.has(activity.business_id) && !p.success)) available = false;
        const entry = CatalogEntrySchema.safeParse({ activity, metadata: m.success ? m.data : defaultMetadata(activity), provider: p.success ? p.data : null });
        if (entry.success) return entry.data;
        available = false;
        return CatalogEntrySchema.parse({ activity, metadata: defaultMetadata(activity), provider: null });
    });
    return { entries, available };
}
