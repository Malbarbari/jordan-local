import { z } from "zod";
import { ActivitySchema, type Activity } from "./index";

// Additive catalogue contract. The frozen v1 Activity DTO remains unchanged.
export const ListingKindSchema = z.enum(["destination", "visitable_place", "activity", "accommodation", "business_offer"]);
export const DiscoveryTagSchema = z.enum(["nature", "hiking", "swimming", "sea", "adventure", "family", "couples", "budget", "cabins", "cultural", "wellness", "farms", "pools", "camps", "scenic", "historical", "local_tours", "food"]);
export const CatalogMetadataSchema = z.strictObject({
    listing_kind: ListingKindSchema,
    discovery_tags: z.array(DiscoveryTagSchema).max(18),
    estimated_price_fils: z.number().int().positive().max(2147483647).nullable(),
    estimated_price_unit: z.enum(["per_person", "per_group"]).nullable(),
}).refine(v => (v.estimated_price_fils === null) === (v.estimated_price_unit === null), { path: ["estimated_price_fils"], message: "Estimate requires both amount and unit." });
export const PublicProviderSchema = z.strictObject({ id: z.uuid(), name: z.string().min(1).max(200), is_demo: z.boolean(), verification_status: z.enum(["unverified", "contact_checked"]) });
export const CatalogEntrySchema = z.strictObject({ activity: ActivitySchema, metadata: CatalogMetadataSchema, provider: PublicProviderSchema.nullable() }).refine(v => v.metadata.listing_kind !== "destination" || (v.activity.record_kind === "place" && v.activity.business_id === null && v.provider === null), { message: "Public destinations cannot have private ownership." }).refine(v => v.metadata.listing_kind !== "business_offer" || (v.activity.business_id !== null && v.activity.record_kind === "offer"), { message: "A business offer requires its actual provider reference." }).refine(v => v.provider === null || v.provider.id === v.activity.business_id, { message: "Provider must match the actual listing owner." }).refine(v => v.metadata.estimated_price_fils === null || v.activity.price_unit === "unknown", { message: "Estimates cannot replace a declared price." });
export const CatalogResponseSchema = z.strictObject({ data: z.array(CatalogEntrySchema), meta: z.strictObject({ count: z.number().int().nonnegative(), metadata_available: z.boolean() }) });
export type CatalogMetadata = z.infer<typeof CatalogMetadataSchema>;
export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;
export type DiscoveryTag = z.infer<typeof DiscoveryTagSchema>;
export const kindLabels = { destination: "وجهة عامة", visitable_place: "مكان للزيارة والاسترخاء", activity: "نشاط وتجربة", accommodation: "إقامة", business_offer: "عرض منشأة محلية" };
export const discoveryLabels: Record<DiscoveryTag, string> = { nature: "طبيعة", hiking: "مسير", swimming: "سباحة", sea: "بحر", adventure: "مغامرة", family: "عائلات", couples: "للأزواج", budget: "اقتصادي", cabins: "أكواخ", cultural: "ثقافة", wellness: "استرخاء", farms: "مزارع", pools: "مسابح", camps: "مخيمات", scenic: "إطلالات", historical: "تاريخ", local_tours: "جولات محلية", food: "طعام" };
export function defaultMetadata(a: Activity): CatalogMetadata {
    return { listing_kind: a.record_kind === "place" && a.business_id === null ? "destination" : "activity", discovery_tags: a.tags.map(t => t === "culture" ? "cultural" : t === "heritage" ? "historical" : t), estimated_price_fils: null, estimated_price_unit: null };
}
