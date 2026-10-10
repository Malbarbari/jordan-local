"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { api, useAccount } from "./context";
import { BusinessSettingsSchema, UserPreferencesSchema, emptyBusinessSettings, emptyPreferences, licenseLabels } from "@/contracts/settings";
import { tourismLocations } from "@/contracts/tourism";
import { kindLabels } from "@/contracts/catalog";
import { categoryLabels } from "@/components/visitor/activity-card";
import { jodToFils } from "@/components/business/form";
type Values = Record<string, unknown>;
export default function SettingsForm({business=false}:{business?:boolean}) {
    const account=useAccount();
    return <PersistedSettingsForm key={`${account.account?.user_id??"guest"}:${business}`} business={business}/>;
}
function PersistedSettingsForm({ business = false }: {
    business?: boolean;
}) {
    const account = useAccount(), [values, setValues] = useState<Values | null>(null), [error, setError] = useState(""), [message, setMessage] = useState(""), [pending, setPending] = useState(false), [retry, setRetry] = useState(0), [license, setLicense] = useState("undisclosed");
    const path = business ? "/api/business/settings" : "/api/account/preferences";
    useEffect(() => {
        if (!account.ready || !account.account || (business && !account.account.business))
            return;
        let active = true;
        api(path).then(data => { const parsed = business ? BusinessSettingsSchema.parse(data.settings) : UserPreferencesSchema.parse(data); if (active) {
            setValues(parsed);
            if (business)
                setLicense((parsed as typeof emptyBusinessSettings).license_status);
            setError("");
        } }).catch(e => { if (active)
            setError(e instanceof Error ? e.message : "تعذّر التحميل."); });
        return () => { active = false; };
    }, [account.ready, account.account, business, path, retry]);
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");
        setError("");
        const form = new FormData(event.currentTarget);
        const text = (key: string) => String(form.get(key) ?? "").trim();
        const number = (key: string) => text(key) === "" ? null : Number(text(key));
        const money = (key: string) => text(key) === "" ? null : jodToFils(text(key));
        const input = business ? { ...emptyBusinessSettings, name_en: text("name_en") || null, service_area: form.getAll("service_area"), activity_types: form.getAll("activity_types"), profile_image_url: text("profile_image_url") || null, image_rights_confirmed: form.has("image_rights_confirmed"), minimum_group_size: number("minimum_group_size"), maximum_group_size: number("maximum_group_size"), price_range_min_fils: money("price_range_min_fils"), price_range_max_fils: money("price_range_max_fils"), license_status: license, licensing_authority: license === "yes" ? text("licensing_authority") || null : null, registration_number: license === "yes" ? text("registration_number") || null : null, license_expires_on: license === "yes" ? text("license_expires_on") || null : null } : { ...emptyPreferences, home_city: text("home_city") || null, preferred_categories: form.getAll("preferred_categories"), preferred_cities: form.getAll("preferred_cities"), preferred_budget_fils: money("preferred_budget_fils"), preferred_group_size: number("preferred_group_size"), preferred_activity_types: form.getAll("preferred_activity_types"), group_type: text("group_type") || null, accessibility_notes: text("accessibility_notes"), trip_style: text("trip_style") };
        const parsed = business ? BusinessSettingsSchema.safeParse(input) : UserPreferencesSchema.safeParse(input);
        if (!parsed.success) {
            setError(parsed.error.issues.map(issue => issue.message).join(" · "));
            return;
        }
        setPending(true);
        try {
            await api(path, "PATCH", parsed.data);
            setMessage("حُفظت البيانات في حسابك.");
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "لم تُحفظ البيانات.");
        }
        finally {
            setPending(false);
        }
    }
    if (!account.ready)
        return <p role="status">جارٍ تحميل الحساب…</p>;
    if (!account.account)
        return <div className="narrow card"><h1>{business ? "إعدادات المنشأة والترخيص" : "تفضيلات طلعتك"}</h1><p>الحفظ مرتبط بحساب Supabase حقيقي. التجربة المحلية لا تحفظ هذه البيانات في قاعدة الإنتاج.</p><Link className="button" href="/login">تسجيل الدخول</Link><Link href="/signup">إنشاء حساب</Link><Link href="/explore">متابعة الاستكشاف التجريبي</Link></div>;
    if (business && !account.account.business)
        return <div className="narrow card"><h1>أنشئ ملف منشأتك أولًا</h1><Link className="button" href="/business/profile">ملف المنشأة</Link></div>;
    const scalar = (key: string) => typeof values?.[key] === "number" ? String(values[key]) : String(values?.[key] ?? "");
    const input = (key: string, label: string, type = "text", maxLength = 200) => <div className="stack" key={key}><label htmlFor={key}>{label}</label><input className="input" id={key} name={key} type={type} maxLength={maxLength} defaultValue={key.endsWith("_fils") && typeof values?.[key] === "number" ? String(Number(values[key]) / 1000) : scalar(key)} {...(type === "number" ? { min: 1, max: 30, step: 1 } : {})}/></div>;
    const checks = (key: string, label: string, options: Record<string, string>) => <fieldset className="interest-fieldset"><legend>{label}</legend><div className="interest-options">{Object.entries(options).map(([id, name]) => <label className="interest" key={id}><input name={key} type="checkbox" value={id} defaultChecked={Array.isArray(values?.[key]) && values[key].includes(id)}/>{name}</label>)}</div></fieldset>;
    return <div className="narrow"><div className="page-intro"><h1>{business ? "إعدادات المنشأة والترخيص" : "تفضيلات طلعتك"}</h1><p>{business ? "معلومات يصرّح بها صاحب المشروع. التصريح بالترخيص لا يعني أننا تحققنا منه. نطاق السعر والعدد تعريفي؛ شروط كل عرض هي المرجع للتوصيات." : "ميزانية النشاط للمجموعة، دون المواصلات. احتياجات الوصول ملاحظات شخصية ولا تؤكد ملاءمة أي مكان."}</p></div>{error && <div role="alert" className="notice error">{error}{!values && <button className="button secondary" onClick={() => setRetry(n => n + 1)}>إعادة التحميل</button>}</div>}{!values && !error && <p role="status">جارٍ تحميل البيانات…</p>}{values && <form className="card stack" aria-busy={pending} onSubmit={submit}><fieldset className="stack min-w-0 border-0 p-0" disabled={pending}>
 {business ? <>{input("name_en", "اسم المشروع بالإنجليزية (اختياري)")}{checks("service_area", "مناطق الخدمة", tourismLocations)}{checks("activity_types", "أنواع العروض", Object.fromEntries(Object.entries(kindLabels).filter(([id]) => id !== "destination")))}{input("profile_image_url", "رابط صورة الملف · HTTPS (اختياري)", "url", 500)}<label><input type="checkbox" name="image_rights_confirmed" defaultChecked={values.image_rights_confirmed === true}/>أملك حق استخدام هذه الصورة</label>{input("minimum_group_size", "الحد الأدنى للأشخاص", "number")}{input("maximum_group_size", "الحد الأقصى للأشخاص (اختياري)", "number")}{input("price_range_min_fils", "أسعار تبدأ من · دينار (اختياري)")}{input("price_range_max_fils", "أسعار تصل إلى · دينار (اختياري)")}<label htmlFor="license_status">هل منشأتك مرخصة؟</label><select id="license_status" name="license_status" value={license} onChange={e => setLicense(e.target.value)}>{Object.entries(licenseLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>{license === "yes" && <>{input("licensing_authority", "جهة الترخيص · خاصة (اختياري)")}{input("registration_number", "رقم التسجيل · خاص (اختياري)", "text", 100)}{input("license_expires_on", "تاريخ انتهاء الترخيص · خاص (اختياري)", "date")}</>}<p className="detail-note">لا ننشر جهة الترخيص أو رقم التسجيل أو تاريخ الانتهاء. رفع الوثائق والتحقق الإداري غير متاحين في هذا الإصدار.</p></> : <><label htmlFor="home_city">مدينتك (اختياري)</label><select id="home_city" name="home_city" defaultValue={scalar("home_city")}><option value="">غير محددة</option>{Object.entries(tourismLocations).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>{checks("preferred_cities", "وجهات مفضلة", tourismLocations)}{checks("preferred_categories", "اهتماماتك", categoryLabels)}{checks("preferred_activity_types", "أنواع التجارب", kindLabels)}{input("preferred_budget_fils", "ميزانية النشاط للمجموعة · دينار (اختياري)")}{input("preferred_group_size", "عدد الأشخاص (اختياري)", "number")}<label htmlFor="group_type">نوع المجموعة</label><select id="group_type" name="group_type" defaultValue={scalar("group_type")}><option value="">غير محدد</option><option value="friends">أصدقاء</option><option value="family">عائلة</option><option value="couple">زوجان</option><option value="solo">فرد</option></select>{input("accessibility_notes", "احتياجات الوصول (اختياري)", "text", 300)}{input("trip_style", "أسلوب الرحلة (اختياري)", "text", 100)}<p>تطبيق التفضيلات على التوصيات اختياري من صفحة الاستكشاف. المدن الموسعة تبقى في استكشاف الأردن.</p></>}
 <button className="button" disabled={pending}>{pending ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</button></fieldset></form>}{message && <p role="status" className="notice">{message}</p>}<p><Link className="button secondary" href={business ? "/business/manage" : "/explore"}>{business ? "إدارة العروض" : "استكشف وخطّط"}</Link> <Link href="/account">حسابي</Link></p></div>;
}
