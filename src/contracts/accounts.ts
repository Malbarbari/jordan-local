import { z } from "zod";
import { LocationIdSchema } from "./index";
export const ProfileInputSchema = z.strictObject({ display_name:z.string().trim().min(2).max(100), account_type:z.enum(["traveler","business"]) });
export const SignupSchema = ProfileInputSchema.extend({ email:z.email(), password:z.string().min(8).max(128) });
export const PublicUrlSchema = z.url().refine(value=>{ const u=new URL(value);return u.protocol==="https:" && !u.username && !u.password && !/^(localhost|.*\.local|\d+\.\d+\.\d+\.\d+|\[.*\])$/i.test(u.hostname); },"استخدم رابط HTTPS عامًا.");
export const BusinessInputSchema = z.strictObject({ name:z.string().trim().min(2).max(200), description:z.string().trim().min(10).max(2000), location_id:LocationIdSchema, category:z.string().trim().min(2).max(100), phone:z.string().regex(/^\+?[0-9 ()-]{7,25}$/).nullable(), whatsapp:z.string().regex(/^[1-9][0-9]{7,14}$/).nullable(), website:PublicUrlSchema.nullable(), social_url:PublicUrlSchema.nullable() });
export type BusinessInput = z.infer<typeof BusinessInputSchema>;
