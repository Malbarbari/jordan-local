import source from "../../../data/tourism.real.json";
import { TourismListingSchema, type TourismListing } from "@/contracts/tourism";
import { dataMode } from "@/lib/runtime";
import { HttpError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { loadActivities } from "./activities";
import { enrichCatalog } from "./catalog";
import { tourismLocations } from "@/contracts/tourism";
import { marketplace } from "./marketplace";
export const realTourism: TourismListing[] = source.map(row => TourismListingSchema.parse(row));
export async function loadTourism(): Promise<TourismListing[]> {
    if (dataMode() === "seed") return [...realTourism, ...marketplace.listings];
    const client = await createClient();
    const { data, error } = await client.from("tourism_listings").select("id,business_id,payload").eq("status", "published").order("id").limit(1001);
    if (error || !data) throw new HttpError(503, "TOURISM_DATABASE_UNAVAILABLE", "تعذّر تحميل الوجهات الحقيقية. راجع migration 003 وseed_tourism.sql؛ لم نستبدل قاعدة البيانات بنسخة محلية.");
    if (data.length > 1000) throw new HttpError(503, "CATALOG_LIMIT", "الكتالوج أكبر من حد النسخة الحالية.");
    const curated = data.map(row => {
        const parsed = TourismListingSchema.parse(row.payload);
        if (parsed.activity.id !== row.id || parsed.activity.business_id !== row.business_id) throw new HttpError(503, "CATALOG_INCONSISTENT", "تعذّر التحقق من هوية القائمة.");
        return parsed;
    });
    // Newly submitted genuine business offers remain discoverable through the
    // current v1 POST/storage, without forcing a second business data model.
    const businessOffers = (await loadActivities()).filter(row => row.business_id !== null && row.data_kind === "provider_submitted");
    const { entries } = await enrichCatalog(businessOffers);
    const submitted = entries.map(({ activity, metadata, provider }) => TourismListingSchema.parse({ activity: { ...activity, image_path: null }, metadata, provider: provider ? { id:provider.id, name:provider.name, website:null, source_url:null, verification_status:"owner_declared" } : null, image:null, coordinates:null, currency:"JOD", location_label_ar:tourismLocations[activity.location_id], location_label_en:activity.location_id }));
    const ids = new Set(curated.map(row => row.activity.id));
    return [...curated, ...submitted.filter(row => !ids.has(row.activity.id))];
}
