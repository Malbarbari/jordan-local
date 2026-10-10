"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, api } from "@/components/account/context";
import { PublicUrlSchema } from "@/contracts/accounts";
import type { TourismListing, TourismProviderSchema } from "@/contracts/tourism";
import type { z } from "zod";
import { TourismMedia, ImageCredit } from "@/components/visitor/tourism-presentation";
import { TourismCard } from "@/components/visitor/tourism-explorer";
type Data = {
    provider: z.infer<typeof TourismProviderSchema> | null;
    profile: {
        name: string;
        name_en?:string;
        category?:string;
        is_demo?:boolean;
        unclaimed?:boolean;
        checked_at?:string|null;
        source_url?:string|null;
        description: string;
        phone: string | null;
        whatsapp: string | null;
        website: string | null;
        social_url: string | null;
    } | null;
    listings: TourismListing[];
};
export default function ProviderPage({ id }: {
    id: string;
}) { const s = useAccount(), [data, setData] = useState<Data | null>(null), [error, setError] = useState("");
useEffect(() => {
    if(!s.ready)return;
    let active=true;
    const rows=s.demo?.listings.filter(r=>r.activity.business_id===id);
    if(rows?.length&&s.demo?.business){
        queueMicrotask(()=>{if(active){setError("");setData({provider:rows[0].provider,profile:s.demo!.business,listings:rows});}});
    }else{
        api(`/api/businesses/${encodeURIComponent(id)}`).then(value=>{if(active){setError("");setData(value);}}).catch(e=>{if(active)setError(e.message);});
    }
    return()=>{active=false;};
},[id,s.demo,s.ready]); if (error)
    return <div className="card"><h1>المزود غير متاح</h1><p role="alert">{error}</p><Link href="/explore">الاستكشاف</Link></div>; if (!data)
    return <p role="status">جارٍ تحميل ملف المزود…</p>; const p = data.profile, website = p?.website ?? data.provider?.website; return <><div className="provider-cover"><TourismMedia row={data.listings[0]} priority/></div><ImageCredit row={data.listings[0]}/><div className="page-intro"><span className="eyebrow">من أهل المكان</span><h1>{p?.name ?? data.provider?.name}</h1>{p?.name_en&&<p lang="en" dir="ltr">{p.name_en}</p>}<p className="preference-chips"><span>{data.listings[0].location_label_ar}</span><span>{p?.category??"تجارب محلية"}</span><span>{data.listings[0].activity.data_kind==="synthetic_demo"?"نموذج تجريبي":p?.unclaimed?"دليل مستقل · ملف غير مُطالب به":"ملف المزود"}</span></p><p>{p?.description ?? "تعرف على تجربة هذا المزود من مصدره الرسمي."}</p><p className="detail-note">معلومات المزود لا تعني شراكة أو إمكانية الحجز عبر المنصة.</p><div className="detail-links">{website && PublicUrlSchema.safeParse(website).success && <a className="button" href={website} target="_blank" rel="noopener noreferrer">الموقع الإلكتروني ↗</a>}{p?.phone && /^\+?[0-9 ()-]{7,25}$/.test(p.phone) && <a className="button secondary" href={`tel:${p.phone.replace(/[ ()-]/g, "")}`}>اتصل بالمزود</a>}{p?.whatsapp && /^[1-9][0-9]{7,14}$/.test(p.whatsapp) && <a className="button secondary" href={`https://wa.me/${p.whatsapp}`} target="_blank" rel="noopener noreferrer">واتساب</a>}{p?.social_url && PublicUrlSchema.safeParse(p.social_url).success && <a className="button secondary" href={p.social_url} target="_blank" rel="noopener noreferrer">صفحة التواصل</a>}</div></div>{p?.source_url&&<p className="detail-note"><a href={p.source_url} target="_blank" rel="noopener noreferrer">مصدر التعريف</a> · {p.checked_at?.slice(0,10)} · معلومات عامة دون إثبات ملكية لحساب.</p>}<h2>تجارب هذا المزود</h2><div className="experience-grid">{data.listings.map(row => <TourismCard row={row} party={null} demo={!s.configured} key={row.activity.id}/>)}</div><div className="detail-links"><Link className="button secondary" href={`/explore?tour_location_id=${data.listings[0].activity.location_id}`}>تجارب أخرى في المنطقة</Link><Link className="button secondary" href="/businesses">اكتشف مشاريع أخرى</Link></div></>; }
