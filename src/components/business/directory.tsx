"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, api } from "@/components/account/context";
import type { DirectoryProvider } from "@/contracts/marketplace";
import type { TourismListing } from "@/contracts/tourism";
import { tourismLocations } from "@/contracts/tourism";
import { TourismMedia, TourismPrice, ImageCredit } from "@/components/visitor/tourism-presentation";
export type DirectoryRow = {
    provider: TourismListing["provider"];
    profile: DirectoryProvider | null;
    listings: TourismListing[];
};
export default function BusinessDirectory({ featured = false }: {
    featured?: boolean;
}) {
    const account = useAccount(), [rows, setRows] = useState<DirectoryRow[]>([]), [error, setError] = useState(""), [pending, setPending] = useState(true), [retry, setRetry] = useState(0), [query, setQuery] = useState(""), [city, setCity] = useState("");
    useEffect(() => { let active = true; api("/api/businesses").then(value => { if (active) {
        setRows(value);
        setError("");
    } }).catch(e => { if (active)
        setError(e.message); }).finally(() => { if (active)
        setPending(false); }); return () => { active = false; }; }, [retry]);
    const demo = account.demo?.business && account.demo.listings.length ? [{ provider: account.demo.listings[0].provider, profile: null, listings: account.demo.listings }] : [];
    const all = [...rows, ...demo], filtered = all.filter(r => r.provider && (!city || r.listings.some(o => o.activity.location_id === city)) && (!query || `${r.profile?.name ?? r.provider.name} ${r.profile?.category ?? ""} ${r.listings.map(o => o.activity.title_ar).join(" ")}`.includes(query)));
    // Mix genuine and clearly labeled fictional examples; never claim paid placement.
    const visible = featured ? [...filtered.filter(r => r.profile?.is_demo).slice(0, 2), ...filtered.filter(r => !r.profile?.is_demo).slice(0, 4)] : filtered;
    return <section className="local-section business-directory" aria-labelledby="business-directory-title"><div className="section-heading"><div><span className="eyebrow">قريبين من المكان، وأهله</span><h2 id="business-directory-title">اكتشف تجارب من أهل البلد</h2></div><Link className="text-link" href={featured ? "/businesses" : "/signup"}>{featured ? "كل المشاريع المحلية ↗" : "شارك تجربتك معنا ↗"}</Link></div><p className="section-subtitle">تعرف على شركات ومشاريع سياحية محلية، واكتشف التجارب اللي بتقدمها.</p>
    {!featured && <div className="search-controls"><div><label htmlFor="business-search">اسم أو تخصص المشروع</label><input id="business-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="مسير، طبخ، مزرعة…"/></div><div><label htmlFor="business-region">المنطقة</label><select id="business-region" value={city} onChange={e => setCity(e.target.value)}><option value="">كل الأردن</option>{Object.entries(tourismLocations).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div></div>}
    {pending && <p role="status">جارٍ تحميل المشاريع المحلية…</p>}{error && <div role="alert" className="notice error">{error}<button className="button secondary" onClick={() => { setPending(true); setRetry(n => n + 1); }}>حاول مجددًا</button></div>}
    {!pending && !error && <><p className="detail-note">دليل مستقل؛ الملفات الحقيقية غير مُطالب بها ولا تعني شراكة. النماذج التجريبية شركات وعروض خيالية.</p><div className="experience-grid">{visible.map(({ provider, profile, listings }) => { const row = listings.find(r => r.activity.price_unit !== "unknown") ?? listings[0], synthetic = row.activity.data_kind === "synthetic_demo"; return <article key={provider!.id} className="experience-card business-card"><div className="experience-art"><TourismMedia row={row}/><span className="category-pill">{profile?.category ?? "تجارب محلية"}</span>{synthetic && <span className="illustration-label">نموذج تجريبي</span>}</div><div className="experience-body"><span className="eyebrow">{row.location_label_ar} · {listings.length} عروض</span><h3>{profile?.name ?? provider!.name}</h3>{profile?.name_en && <small lang="en" dir="ltr">{profile.name_en}</small>}<p className="description">{profile?.description ?? "تعرف على تجارب هذا المزود وتواصل معه لتأكيد التفاصيل."}</p><p className="provider-featured">{row.activity.title_ar}</p><TourismPrice row={row} party={null} demo={synthetic}/><Link className="button secondary" href={`/businesses/${provider!.id}`}>اكتشف العروض ↗</Link><ImageCredit row={row}/></div></article>; })}</div>{!visible.length && <p role="status">لا توجد مشاريع بهذه الخيارات. جرّب منطقة أو كلمة أخرى.</p>}</>}
  </section>;
}
