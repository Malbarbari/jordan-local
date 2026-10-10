"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Users, ArrowUpLeft } from "lucide-react";
import type { Activity, Recommendation } from "@/contracts";
import { cities } from "@/lib/recommendation/preferences";
import { defaultMetadata, discoveryLabels, kindLabels, type CatalogEntry } from "@/contracts/catalog";
import ListingDialog from "./listing-dialog";
import licensedImages from "../../../data/tourism.images.json";

export const categoryLabels = { nature: "طبيعة", culture: "فن وثقافة", food: "طعام ونكهات", adventure: "مغامرة", heritage: "تراث" };

export function ActivityCard({ activity: a, recommendation: r, party = 4, entry }: { activity: Activity; recommendation?: Recommendation; party?: number; entry?: CatalogEntry }) {
  const synthetic = a.data_kind === "synthetic_demo";
  const metadata = entry?.metadata ?? defaultMetadata(a);
  const estimate = metadata.estimated_price_fils === null ? null : metadata.estimated_price_fils * (metadata.estimated_price_unit === "per_person" ? party : 1);
  const total = r ? r.total_cost_fils : a.price_unit === "per_person" && a.price_fils !== null ? a.price_fils * party : a.price_fils;
  const photo = Object.values(licensedImages).find(image => image.path === a.image_path);
  const art = <Image src={photo?.path ?? (a.image_path && /^\/images\/(forest|desert|urban|countryside)\.svg$/.test(a.image_path) ? a.image_path : "/images/countryside.svg")} alt={photo ? `${photo.alt_ar} · صورة عامة للمنطقة، وليست توثيقًا لمرافق العرض` : "رسم توضيحي عام، وليس صورة لهذا المكان"} fill sizes="(max-width:640px) 100vw, (max-width:1000px) 50vw, 33vw" />;
  const price = (
    <div className="price-row">
      <div>
        <strong>
          {total === null ? estimate === null ? "تواصل لمعرفة السعر" : `${estimate / 1000} د.أ تقريبًا` : total === 0 ? "مجاني" : new Intl.NumberFormat("ar-JO", { maximumFractionDigits: 3 }).format(total / 1000)}
          {total !== null && total !== 0 && <small> د.أ</small>}
        </strong>
        <span>{total !== null ? `إجمالي المجموعة · ${party} أشخاص` : "السعر غير معروف"}{synthetic ? " · افتراضي" : estimate !== null ? " · تقديري" : ""}</span>
      </div>
    </div>
  );
  return (
    <article className="experience-card activity-card compact-card">
      <div className="experience-art">{art}<span className="category-pill">{categoryLabels[a.category]}</span><span className="illustration-label">{photo ? "صورة للمنطقة" : "رسم توضيحي"}{synthetic ? " · افتراضي" : ""}</span></div>
      {photo && <details className="image-credit"><summary>حقوق الصورة · {photo.author}</summary><p><a href={photo.source_url} target="_blank" rel="noopener noreferrer">{photo.title}</a> · <a href={photo.license_url} target="_blank" rel="noopener noreferrer">{photo.license}</a> · {photo.changes}</p></details>}
      <div className="experience-body">
        <div className="eyebrow"><MapPin size={13} aria-hidden="true" />{cities[a.location_id]}</div>
        <h3><Link href={`/listings/${a.id}`}>{a.title_ar}</Link></h3>
        <p className="description">{a.description_ar}</p>
        {entry?.provider && (
          <p className="provider-name">
            {a.business_id === "00000000-0000-4000-8000-000000000010" && a.image_path !== null ? <span>{entry.provider.name}</span> : <Link href={`/businesses/${entry.provider.id}`}>{entry.provider.name}</Link>}
            {synthetic && " · تجريبي"}
          </p>
        )}
        <div className="preference-chips">{metadata.discovery_tags.slice(0, 2).map((tag) => <span key={tag}>{discoveryLabels[tag]}</span>)}</div>
        {r && <p className="match-reason">{r.reasons[0]}</p>}
        {price}
        <Link className="card-explore" href={`/listings/${a.id}`}>تفاصيل التجربة <ArrowUpLeft size={16} aria-hidden="true" /></Link>
        <ListingDialog title={a.title_ar} label="نظرة سريعة" className="text-link">
          <div className="detail-hero">{art}<span className="illustration-label">{photo ? "صورة عامة للمنطقة" : "رسم توضيحي عام"}</span></div>
          <div className="detail-body">
            <span className="eyebrow">{cities[a.location_id]} · {kindLabels[metadata.listing_kind]}</span>
            <h2>{a.title_ar}</h2>
            <p>{a.description_ar}</p>
            {price}
            <div className="facts">
              {a.duration_minutes !== null && <span><Clock size={15} aria-hidden="true" />{a.duration_minutes} دقيقة</span>}
              {a.capacity_people !== null && <span><Users size={15} aria-hidden="true" />حتى {a.capacity_people} أشخاص</span>}
            </div>
            {r && <><h3>لماذا يناسبك؟</h3><ul className="reason-list">{r.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul></>}
            {a.business_id && <p>المزود: {entry?.provider?.name ?? "تفاصيل المزود غير متاحة"}{entry?.provider?.is_demo ? " · افتراضي" : ""}</p>}
            {a.business_id === null && a.record_kind === "place" && <p>وجهة عامة · ليست ملكية خاصة</p>}
            {estimate !== null && <p className="detail-note">تقدير المجموعة: {estimate / 1000} دينار · {synthetic ? "افتراضي" : "غير مؤكد"}، لا يُستخدم كتطابق مؤكد للميزانية.</p>}
            <p className="detail-note">{synthetic ? "عرض افتراضي لا يقبل الحجز." : "تأكد من السعر والتوافر مع المزود."} {a.price_notes}</p>
            {a.source_url && /^https:\/\/(?:[a-z-]+\.)?visitjordan\.com\//.test(a.source_url) && <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="button secondary">المصدر الرسمي ↗</a>}
          </div>
        </ListingDialog>
      </div>
    </article>
  );
}
