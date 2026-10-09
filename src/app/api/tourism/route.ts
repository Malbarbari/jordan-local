import { TourismFiltersSchema, TourismResponseSchema } from "@/contracts/tourism";
import { loadTourism } from "@/lib/data/tourism";
import { filterTourism } from "@/lib/tourism/filter";
import { rankTourism } from "@/lib/tourism/ranking";
import { dataMode } from "@/lib/runtime";
import { failure, HttpError, json } from "@/lib/http";
export async function GET(request: Request) {
    try {
        const params = new URL(request.url).searchParams;
        const input: Record<string, unknown> = {};
        for (const [key,value] of params) {
            if (key in input) throw new HttpError(400, "VALIDATION_ERROR", "لا تكرر حقول التصفية.");
            input[key] = ["budget_fils","party_size"].includes(key) ? /^\d+$/.test(value) ? Number(value) : NaN : value;
        }
        const filters = TourismFiltersSchema.safeParse(input);
        if (!filters.success) throw new HttpError(400, "VALIDATION_ERROR", "راجع حقول تصفية الوجهات.");
        const listings = await loadTourism();
        const { rows, unconfirmed } = filterTourism(listings, filters.data, new Date());
        return json(TourismResponseSchema.parse({ data: rankTourism(rows, filters.data.query), meta: { count: rows.length, total: listings.length, unconfirmed_count: unconfirmed, data_mode:dataMode(), engine:"rules_discovery" } }));
    } catch(error) { return failure(error); }
}
