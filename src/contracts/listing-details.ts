import { z } from "zod";
import { LicensedImageSchema } from "./tourism";
import { PublicUrlSchema } from "./accounts";
export const QuoteSchema = z.strictObject({ id:z.string().min(1).max(80), label_ar:z.string().min(1).max(200), currency:z.literal("JOD").default("JOD"), amount_fils:z.number().int().min(0).max(10000000), unit:z.enum(["per_person","per_group","per_ticket","per_night","unspecified"]), status:z.enum(["source_checked","owner_declared","demo_estimate"]), audience:z.enum(["everyone","jordanian","non_jordanian","resident","arab","international_overnight","international_day","child_under_12"]), conditions:z.array(z.string().max(500)).max(10), source_url:PublicUrlSchema.nullable(), checked_at:z.iso.datetime({offset:true}).nullable(), optional:z.boolean() }).refine(q=>q.status!=="source_checked" || (q.source_url!==null && q.checked_at!==null),"سعر موثق يتطلب مصدرًا وتاريخًا.");
export const ListingDetailsSchema = z.strictObject({ highlights:z.array(z.string().max(500)).max(10), practical:z.array(z.string().max(500)).max(10), quotes:z.array(QuoteSchema).max(20), gallery:z.array(LicensedImageSchema).max(10), image_url:PublicUrlSchema.nullable(), image_rights_confirmed:z.boolean() }).refine(v=>!v.image_url || v.image_rights_confirmed,"أكد حقوق الصورة.");
// Owners cannot claim a price or image has been independently verified.
export const OwnerDetailsSchema = ListingDetailsSchema.refine(v=>v.gallery.length===0 && v.quotes.every(q=>q.status==="owner_declared" && q.audience==="everyone" && q.unit!=="unspecified" && q.source_url===null),"أسعار المالك تصريحات وليست أسعارًا موثقة.");
export type Quote = z.infer<typeof QuoteSchema>;
export type ListingDetails = z.infer<typeof ListingDetailsSchema>;
export const emptyDetails:ListingDetails={highlights:[],practical:[],quotes:[],gallery:[],image_url:null,image_rights_confirmed:false};
