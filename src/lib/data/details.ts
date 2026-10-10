import seed from "../../../data/listing-details.json";
import { ListingDetailsSchema,type ListingDetails } from "@/contracts/listing-details";
import { dataMode } from "@/lib/runtime";
import { createClient } from "@/lib/supabase/server";
import { HttpError } from "@/lib/http";
import { marketplace } from "./marketplace";
export const seedDetails:Record<string,ListingDetails>=Object.fromEntries(Object.entries({...seed,...marketplace.details}).map(([id,payload])=>[id,ListingDetailsSchema.parse(payload)]));
export async function loadDetails():Promise<Record<string,ListingDetails>>{if(dataMode()==="seed")return seedDetails;const client=await createClient();const {data,error}=await client.from("listing_details").select("listing_id,payload").limit(1001);if(error||!data||data.length>1000)throw new HttpError(503,"DETAILS_UNAVAILABLE","تعذّر تحميل الأسعار والتفاصيل.");const result:Record<string,ListingDetails>={};for(const row of data){const parsed=ListingDetailsSchema.safeParse(row.payload);if(parsed.success)result[row.listing_id]=parsed.data;}return result;}
