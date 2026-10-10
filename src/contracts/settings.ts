import { z } from "zod";
import { CategorySchema, GroupTypeSchema } from "./index";
import { ListingKindSchema } from "./catalog";
import { TourismLocationSchema } from "./tourism";
import { PublicUrlSchema } from "./accounts";
export const UserPreferencesSchema = z.strictObject({
    home_city: TourismLocationSchema.nullable(), preferred_categories: z.array(CategorySchema).max(5),
    preferred_cities: z.array(TourismLocationSchema).max(18), preferred_budget_fils: z.number().int().min(0).max(10000000).nullable(),
    preferred_group_size: z.number().int().min(1).max(30).nullable(), preferred_activity_types: z.array(ListingKindSchema).max(5),
    group_type: GroupTypeSchema.nullable(), accessibility_notes: z.string().trim().max(300), trip_style: z.string().trim().max(100),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export const emptyPreferences: UserPreferences = { home_city: null, preferred_categories: [], preferred_cities: [], preferred_budget_fils: null, preferred_group_size: null, preferred_activity_types: [], group_type: null, accessibility_notes: "", trip_style: "" };
export const LicenseStatusSchema = z.enum(["yes", "no", "pending", "undisclosed"]);
const BusinessSettingsBaseSchema = z.strictObject({
    name_en: z.string().trim().max(200).nullable(), service_area: z.array(TourismLocationSchema).max(18),
    activity_types: z.array(z.enum(["activity", "accommodation", "business_offer", "visitable_place"])).max(4), profile_image_url: PublicUrlSchema.nullable(), image_rights_confirmed: z.boolean(),
    minimum_group_size: z.number().int().min(1).max(30), maximum_group_size: z.number().int().min(1).max(30).nullable(),
    price_range_min_fils: z.number().int().min(0).max(10000000).nullable(), price_range_max_fils: z.number().int().min(0).max(10000000).nullable(),
    license_status: LicenseStatusSchema, licensing_authority: z.string().trim().max(200).nullable(), registration_number: z.string().trim().max(100).nullable(), license_expires_on: z.iso.date().nullable(),
});
export const BusinessSettingsSchema = BusinessSettingsBaseSchema.refine(v => !v.profile_image_url || v.image_rights_confirmed, "أكد حقوق صورة الملف.")
    .refine(v => v.maximum_group_size === null || v.maximum_group_size >= v.minimum_group_size, "الحد الأقصى أقل من الحد الأدنى.")
    .refine(v => (v.price_range_min_fils === null && v.price_range_max_fils === null) || (v.price_range_min_fils !== null && v.price_range_max_fils !== null && v.price_range_max_fils >= v.price_range_min_fils), "نطاق السعر يحتاج حدين صحيحين.")
    .refine(v => v.license_status === "yes" || (!v.licensing_authority && !v.registration_number && !v.license_expires_on), "تفاصيل الترخيص متاحة عند التصريح بنعم فقط.");
export type BusinessSettings = z.infer<typeof BusinessSettingsSchema>;
export const emptyBusinessSettings: BusinessSettings = { name_en: null, service_area: [], activity_types: [], profile_image_url: null, image_rights_confirmed: false, minimum_group_size: 1, maximum_group_size: null, price_range_min_fils: null, price_range_max_fils: null, license_status: "undisclosed", licensing_authority: null, registration_number: null, license_expires_on: null };
export const licenseLabels = { yes: "المزود يصرّح بأنه مرخص · لم نتحقق", no: "المزود يصرّح بأنه غير مرخص", pending: "قيد الترخيص حسب تصريح المزود", undisclosed: "لم يفصح المزود عن الترخيص" };
export const PublicBusinessSettingsSchema = BusinessSettingsBaseSchema.pick({ name_en: true, service_area: true, activity_types: true, profile_image_url: true, minimum_group_size: true, maximum_group_size: true, price_range_min_fils: true, price_range_max_fils: true, license_status: true }).extend({ business_id: z.uuid(), license_verification_status: z.enum(["unverified", "verified"]) });
