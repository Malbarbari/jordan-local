import { CreateActivitySchema } from "@/contracts";
import { CatalogMetadataSchema } from "@/contracts/catalog";
export function parseCatalogForm(form: FormData) {
    const amount = String(form.get("estimated_price_jod") ?? "").trim();
    return CatalogMetadataSchema.safeParse({ listing_kind: form.get("listing_kind") ?? "activity", discovery_tags: form.getAll("discovery_tags"), estimated_price_fils: amount ? jodToFils(amount) : null, estimated_price_unit: amount ? form.get("estimated_price_unit") : null });
}
export function jodToFils(value: string) {
    value = value.replace(/[٠-٩]/g, char => String("٠١٢٣٤٥٦٧٨٩".indexOf(char))).replace("٫", ".");
    if (!/^\d+(?:\.\d{1,3})?$/.test(value))
    return NaN; const [whole, fraction = ""] = value.split("."); return Number(whole) * 1000 + Number(fraction.padEnd(3, "0")); }
export function parseListing(form: FormData) { const text = (key: string) => String(form.get(key) ?? "").trim(); const number = (key: string) => text(key) === "" ? null : Number(text(key)); const unit = text("price_unit"); return CreateActivitySchema.safeParse({ title_ar: text("title_ar"), title_en: text("title_en") || null, description_ar: text("description_ar"), description_en: text("description_en") || null, location_id: text("location_id"), category: text("category"), tags: form.getAll("tags"), environment: form.getAll("environment"), group_types: form.getAll("group_types"), family_friendly: text("family_friendly") === "unknown" ? null : text("family_friendly") === "true", price_fils: unit === "unknown" ? null : unit === "free" ? 0 : jodToFils(text("price_jod")), price_unit: unit, price_valid_until: null, price_notes: text("price_notes"), duration_minutes: number("duration_minutes"), capacity_people: number("capacity_people"), available_months: text("available_months") === "" ? null : text("available_months").split(",").map(Number), image_path: null }); }
