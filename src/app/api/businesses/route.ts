import { loadTourism } from "@/lib/data/tourism";
import { marketplace } from "@/lib/data/marketplace";
import { failure, json } from "@/lib/http";
import { dataMode } from "@/lib/runtime";
export async function GET() {
    try {
        const listings = await loadTourism();
        const grouped = new Map<string, typeof listings>();
        for (const row of listings)
            if (row.provider) {
                const group = grouped.get(row.provider.id) ?? [];
                group.push(row);
                grouped.set(row.provider.id, group);
            }
        return json({ data: Array.from(grouped, ([id, offers]) => ({ provider: offers[0].provider, profile: marketplace.providers.find(p => p.id === id) ?? null, listings: offers })), meta: { data_mode: dataMode() } });
    }
    catch (e) {
        return failure(e);
    }
}
