"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAccount, api } from "@/components/account/context";
import { BusinessInputSchema, type BusinessInput } from "@/contracts/accounts";
import { cities } from "@/lib/recommendation/preferences";
export default function BusinessProfile() {
    const s = useAccount(), [profile, setProfile] = useState<BusinessInput | null>(null), [error, setError] = useState(""), [message, setMessage] = useState(""), [pending, setPending] = useState(false), [loading, setLoading] = useState(true);
    useEffect(() => { if (!s.ready)
        return; queueMicrotask(() => { if (s.demo) {
        setProfile(s.demo.business);
        setLoading(false);
    }
    else if (s.account) {
        api("/api/business/profile").then(value => { if (value)
            setProfile(BusinessInputSchema.parse({ name: value.name, description: value.description, location_id: value.location_id, category: value.category, phone: value.phone, whatsapp: value.whatsapp, website: value.website, social_url: value.social_url })); }).catch(e => setError(e.message)).finally(() => setLoading(false));
    }
    else
        setLoading(false); }); }, [s.ready, s.demo, s.account]);
    async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget), value = Object.fromEntries(["name", "description", "location_id", "category", "phone", "whatsapp", "website", "social_url"].map(k => [k, f.get(k) || null])), parsed = BusinessInputSchema.safeParse(value); setError(""); if (!parsed.success) {
        setError("راجع الحقول. أضف وصفًا من 10 أحرف، وروابط HTTPS عامة، ورقم واتساب دوليًا دون +.");
        return;
    } setPending(true); try {
        if (s.demo)
            s.saveDemo({ ...s.demo, business: parsed.data, profile: { ...s.demo.profile, account_type: "business" } });
        else {
            await api("/api/business/profile", "POST", parsed.data);
            await s.refresh();
        }
        setProfile(parsed.data);
        setMessage(s.demo ? "حُفظ الملف على هذا المتصفح فقط." : "ملف المنشأة محفوظ. يمكنك نشر تجربتك الأولى.");
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر الحفظ.");
    }
    finally {
        setPending(false);
    } }
    if (!s.ready || loading)
        return <p role="status">جارٍ تحميل الملف…</p>;
    if (!s.account && !s.demo)
        return <div className="narrow card"><h1>خلّي الناس تكتشف مشروعك</h1><Link href="/signup" className="button">إنشاء حساب عمل</Link></div>;
    return <div className="narrow"><div className="page-intro"><span className="eyebrow">المشروع المحلي، بطل الحكاية</span><h1>ملف منشأتك السياحية</h1><p>اكتب معلوماتك الحقيقية؛ لا تمثل المعالم العامة كملكية خاصة.</p></div><form className="card stack" key={profile?.name ?? "new"} onSubmit={submit}><label htmlFor="business-name">اسم المشروع</label><input id="business-name" name="name" defaultValue={profile?.name ?? ""} required maxLength={200}/><label htmlFor="business-description">عن المشروع</label><textarea id="business-description" name="description" defaultValue={profile?.description ?? ""} required minLength={10} maxLength={2000}/><label htmlFor="business-location">المدينة</label><select id="business-location" name="location_id" defaultValue={profile?.location_id ?? "irbid"}>{Object.entries(cities).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select>{([['category', 'مجال المشروع'], ['phone', 'الهاتف (اختياري)'], ['whatsapp', 'واتساب · مثال 962790000000 (اختياري)'], ['website', 'الموقع الإلكتروني (اختياري)'], ['social_url', 'صفحة التواصل (اختياري)']] as const).map(([key, label]) => <div className="stack" key={key}><label htmlFor={`business-${key}`}>{label}</label><input id={`business-${key}`} name={key} defaultValue={profile?.[key] ?? ""} maxLength={key === "category" ? 100 : 500} required={key === "category"} dir={key === "category" ? "rtl" : "ltr"}/></div>)}<button className="button" disabled={pending}>{pending ? "جارٍ الحفظ…" : "حفظ ملف المنشأة"}</button></form>{message && <p role="status" className="notice">{message}</p>}{error && <p role="alert" className="error">{error}</p>}<p><Link className="button secondary" href="/business/manage">إدارة ونشر القوائم ↗</Link></p></div>;
}
