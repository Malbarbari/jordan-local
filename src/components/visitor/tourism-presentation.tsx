"use client";
import Image from "next/image";
import { useState } from "react";
import { Compass, Mountain, Tent, Waves, Landmark, Utensils } from "lucide-react";
import { z } from "zod";
import type { TourismListing } from "@/contracts/tourism";
import { groupCost } from "@/lib/recommendation/constraints";
import detailsSeed from "../../../data/listing-details.json";
import { useAccount } from "@/components/account/context";

export const DemoPriceSchema = z.strictObject({ amount_fils:z.number().int().positive(), unit:z.enum(["per_person","per_group","per_night"]), basis:z.enum(["accommodation","meal","activity"]), status:z.literal("demo_estimate"), note_ar:z.string().min(1) });
export const DemoPricesSchema = z.record(z.uuid(), DemoPriceSchema);
// Legacy quick-view adapter derives from the same dataset as the detail API.
export const demoPrices = DemoPricesSchema.parse(Object.fromEntries(Object.entries(detailsSeed).flatMap(([id,details])=>details.quotes.filter(q=>q.status==="demo_estimate").map(q=>[id,{amount_fils:q.amount_fils,unit:q.unit,basis:q.unit==="per_night"?"accommodation":id.endsWith("015")?"meal":"activity",status:"demo_estimate",note_ar:q.conditions.join(" ")}]))));
const prices=demoPrices;
export function demoEstimate(row: TourismListing, demo: boolean) { return demo && row.activity.price_unit === "unknown" && row.provider !== null ? prices[row.activity.id] ?? null : null; }
export function TourismPrice({ row, party, demo }: { row: TourismListing; party: number | null; demo: boolean }) {
    const state=useAccount(),quote=state.details[row.activity.id]?.quotes.find(q=>!q.optional && (q.status!=="demo_estimate"||demo));
    const a = row.activity, estimate = demoEstimate(row,demo), total = groupCost(a,party);
    const unit = a.price_unit === "per_person" && party === null ? "للشخص" : "للمجموعة";
    if(a.price_unit==="unknown" && quote)return <div className="listing-price"><strong>{quote.amount_fils/1000} د.أ {quote.audience!=="everyone"&&<small>حسب الفئة</small>}</strong><span>{quote.unit==="per_night"?"للغرفة / الليلة":quote.unit==="per_ticket"?"للتذكرة":quote.unit==="per_person"?"للشخص":quote.unit==="unspecified"?"للكوخ · تأكد من الفترة":"للمجموعة"} · {quote.status==="demo_estimate"?"تقدير تجريبي":quote.status==="owner_declared"?"حسب المزود":"سعر منشور"}</span></div>;
    if(a.price_unit !== "unknown" && a.price_fils !== null) return <div className="listing-price"><strong>{a.price_unit === "free" ? "الدخول مجاني" : `${(total ?? a.price_fils)/1000} د.أ`}</strong><span>{a.price_unit === "free" ? "حسب السعر المعلن" : unit}</span></div>;
    if(estimate) return <div className="listing-price"><strong>{estimate.amount_fils/1000} د.أ <small>تقريبًا</small></strong><span>{estimate.unit === "per_night" ? "للغرفة / الليلة" : estimate.unit === "per_person" ? "للشخص" : "للمجموعة"} · {estimate.basis === "meal" ? "وجبة" : estimate.basis === "accommodation" ? "إقامة" : "تجربة"} · تقدير تجريبي</span></div>;
    if(row.metadata.estimated_price_fils !== null) return <div className="listing-price"><strong>{row.metadata.estimated_price_fils/1000} د.أ <small>تقريبًا</small></strong><span>{row.metadata.estimated_price_unit === "per_person" ? "للشخص" : "للمجموعة"} · تقدير غير مؤكد</span></div>;
    return <div className="listing-price"><strong>تحقّق من الرسوم</strong><span>السعر غير معروف · ليس مجانيًا بالضرورة</span></div>;
}
export function TourismMedia({ row, priority=false }: { row: TourismListing; priority?: boolean }) {
    const state=useAccount(),remote=state.details[row.activity.id]?.image_url;
    const [failed,setFailed] = useState(false);
    const category = row.metadata.listing_kind === "accommodation" ? "stay" : row.metadata.discovery_tags.includes("swimming") || row.metadata.discovery_tags.includes("sea") ? "water" : row.activity.category;
    const Icon = category === "stay" ? Tent : category === "water" ? Waves : category === "heritage" || category === "culture" ? Landmark : category === "food" ? Utensils : Mountain;
    if(remote&&!failed)return <Image src={remote} alt={`صورة ${row.activity.title_ar} من المزود`} fill unoptimized referrerPolicy="no-referrer" sizes="(max-width:640px) 100vw, 33vw" onError={()=>setFailed(true)}/>;
    return row.image && !failed ? <Image src={row.image.path} alt={row.image.alt_ar} fill priority={priority} sizes="(max-width:640px) 100vw, (max-width:1000px) 50vw, 33vw" onError={()=>setFailed(true)}/> : <div className={`generic-art generic-${category}`} role="img" aria-label="رسم توضيحي عام للفئة، وليس صورة للموقع"><span className="art-sun"/><Icon size={64} strokeWidth={1} aria-hidden="true"/><span className="generic-label"><Compass size={12} aria-hidden="true"/>رسم عام · {category === "stay" ? "إقامة وسط الطبيعة" : category === "water" ? "بحر ومياه" : category === "heritage" || category === "culture" ? "حكايات المكان" : category === "food" ? "نكهات محلية" : "دروب وإطلالات"}</span></div>;
}
export function ImageCredit({ row }: { row: TourismListing }) { return row.image ? <details className="image-credit"><summary>حقوق الصورة · {row.image.author}</summary><p><a href={row.image.source_url} target="_blank" rel="noopener noreferrer">{row.image.title} — {row.image.author}</a> · <a href={row.image.license_url} target="_blank" rel="noopener noreferrer">{row.image.license}</a></p><p>المصدر: Wikimedia Commons · {row.image.changes} · قصّ عرض متجاوب</p></details> : null; }
