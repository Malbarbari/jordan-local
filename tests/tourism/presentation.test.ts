import { describe, expect, it } from "vitest";
import marketplace from "../../data/marketplace.json";
const seed=marketplace.listings;
import { TourismListingSchema } from "@/contracts/tourism";
import { DemoPricesSchema, demoEstimate, demoPrices as prices } from "@/components/visitor/tourism-presentation";
import { groupCost } from "@/lib/recommendation/constraints";

describe("frontend demo pricing boundary",()=>{
 it("labels every estimate and restricts it to existing, owned, unknown-price introductions",()=>{
  const parsed=DemoPricesSchema.parse(prices);
  for(const [id,price] of Object.entries(parsed)) {
   const row=TourismListingSchema.parse(seed.find(row=>row.activity.id===id));
   expect(row.provider).not.toBeNull();expect(row.metadata.listing_kind).not.toBe("destination");
   expect(row.activity.price_unit).toBe("unknown");expect(price.status).toBe("demo_estimate");
   expect(groupCost(row.activity,4)).toBeNull();
  }
 });
 it("never exposes a demo estimate in live mode or overrides declared prices",()=>{
  const row=TourismListingSchema.parse(seed.find(row=>row.activity.id.endsWith("105")));
  expect(demoEstimate(row,false)).toBeNull();expect(demoEstimate(row,true)?.amount_fils).toBe(65000);
  expect(demoEstimate({...row,activity:{...row.activity,price_unit:"per_group",price_fils:99000}},true)).toBeNull();
 });
 it("rejects fractional money and missing disclosure",()=>{
  const id=Object.keys(prices)[0], value=Object.values(prices)[0];
  expect(DemoPricesSchema.safeParse({[id]:{...value,amount_fils:1.5}}).success).toBe(false);
  expect(DemoPricesSchema.safeParse({[id]:{...value,status:"verified"}}).success).toBe(false);
 });
});
