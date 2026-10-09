import { CatalogResponseSchema } from "@/contracts/catalog";
import { loadActivities } from "@/lib/data/activities";
import { enrichCatalog } from "@/lib/data/catalog";
import { failure, json } from "@/lib/http";
export async function GET() {
    try {
        const { entries, available } = await enrichCatalog(await loadActivities());
        return json(CatalogResponseSchema.parse({ data: entries, meta: { count: entries.length, metadata_available: available } }));
    } catch (error) { return failure(error); }
}
