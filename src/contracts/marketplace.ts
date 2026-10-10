import { z } from "zod";
import { TourismListingSchema, TourismLocationSchema } from "./tourism";
import { ListingDetailsSchema } from "./listing-details";
import { PublicUrlSchema } from "./accounts";
// Public directory evidence never confers an authenticated ownership claim.
export const DirectoryProviderSchema = z.strictObject({
    id: z.uuid(), name: z.string().min(1).max(200), name_en: z.string().min(1).max(200),
    description: z.string().min(10).max(2000), category: z.string().min(1).max(100),
    location_id: TourismLocationSchema, is_demo: z.boolean(), unclaimed: z.literal(true),
    website: PublicUrlSchema.nullable(), source_url: PublicUrlSchema.nullable(),
    checked_at: z.iso.datetime({ offset: true }).nullable(),
    phone: z.string().regex(/^\+?[0-9 ()-]{7,25}$/).nullable(),
    whatsapp: z.string().regex(/^[1-9][0-9]{7,14}$/).nullable(), social_url: PublicUrlSchema.nullable(),
}).refine(p => p.is_demo ? !p.website && !p.source_url && !p.phone && !p.whatsapp && !p.social_url : !!p.source_url && !!p.checked_at, "Real providers require evidence; fictional businesses cannot have real contacts.");
export const MarketplaceSchema = z.strictObject({
    providers: z.array(DirectoryProviderSchema), listings: z.array(TourismListingSchema),
    details: z.record(z.uuid(), ListingDetailsSchema),
}).superRefine((m, ctx) => {
    const providers = new Map(m.providers.map(p => [p.id, p]));
    if (providers.size !== m.providers.length || new Set(m.listings.map(r => r.activity.id)).size !== m.listings.length)
        ctx.addIssue({ code: "custom", message: "Marketplace IDs must be unique." });
    for (const r of m.listings) {
        const p = providers.get(r.activity.business_id ?? "");
        if (!p || r.provider?.id !== p.id || r.provider.name !== p.name || p.is_demo !== (r.activity.data_kind === "synthetic_demo"))
            ctx.addIssue({ code: "custom", message: "Offer must reference its actual real or fictional provider." });
        if (!p?.is_demo && m.details[r.activity.id]?.quotes.some(q => q.status === "demo_estimate"))
            ctx.addIssue({ code: "custom", message: "Never attribute fictional prices to a real provider." });
    }
    for (const id of Object.keys(m.details))
        if (!m.listings.some(r => r.activity.id === id))
            ctx.addIssue({ code: "custom", message: "Details require an existing offer." });
});
export type DirectoryProvider = z.infer<typeof DirectoryProviderSchema>;
