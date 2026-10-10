"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CategorySchema, EnvironmentSchema, GroupTypeSchema, LocationIdSchema, type Activity } from "@/contracts";
import { Badge, Button, Card, Input } from "@/components/ui";
import { ApiError, createListing, demoEnabled, getMe, listOwn, signOut } from "./client";
import { ActivitiesResponseSchema } from "@/contracts";
import { sharedSyntheticFixture } from "@/contracts/fixtures";
import { parseListing, parseCatalogForm } from "./form";
import { kindLabels, discoveryLabels, type CatalogMetadata } from "@/contracts/catalog";
import { cities } from "@/lib/recommendation/preferences";
const optionLabels: Record<string, string> = { ...cities, nature: "طبيعة", culture: "فن وثقافة", food: "طعام ونكهات", adventure: "مغامرة", heritage: "تراث", forest: "غابة", desert: "صحراء", urban: "مدينة", countryside: "ريف", family: "عائلة", friends: "أصدقاء", couple: "شخصان", solo: "بمفرده", unknown: "غير معروف", free: "مجاني", per_person: "لكل شخص", per_group: "للمجموعة", true: "نعم", false: "لا" };
const fieldLabels: Record<string,string> = { title_ar: "العنوان بالعربية", title_en: "العنوان بالإنجليزية", description_ar: "الوصف بالعربية", description_en: "الوصف بالإنجليزية", price_jod: "السعر", duration_minutes: "المدة", capacity_people: "حجم المجموعة", available_months: "أشهر الموسم", price_notes: "ملاحظات السعر" };
const validationMessages: Record<string,string> = { title_ar: "أدخل عنوانًا من 1 إلى 200 حرف.", description_ar: "أدخل وصفًا من 1 إلى 4000 حرف.", price_jod: "للأسعار المدفوعة أدخل مبلغًا موجبًا بالدينار، حتى ثلاث خانات عشرية.", duration_minutes: "أدخل عددًا صحيحًا من 1 إلى 1440 دقيقة أو اتركه فارغًا.", capacity_people: "أدخل عدد أشخاص صحيحًا لا يقل عن 1 أو اتركه فارغًا.", available_months: "استخدم أرقام أشهر صحيحة من 1 إلى 12 مفصولة بفواصل أو اترك الحقل فارغًا." };
export default function Dashboard({ readOnly = false }: { readOnly?: boolean }) {
    const formRef = useRef<HTMLFormElement>(null);
    function fillExample() {
        const form = formRef.current;
        if (!form) return;
        const values: Record<string,string> = { title_ar: "مسار طبيعة هادئ — مثال تجريبي", title_en: "Quiet nature experience — demo", description_ar: "نشاط افتراضي لاختبار النشر. ليس عرضًا حقيقيًا ولا يقبل الحجوزات.", description_en: "Fictional demo activity, not bookable.", location_id: "ajloun", category: "nature", family_friendly: "true", price_unit: "per_person", price_jod: "8", price_notes: "سعر تجريبي للنشاط فقط، دون المواصلات أو الوجبات.", duration_minutes: "120", capacity_people: "8", available_months: "3,4,5,9,10,11" };
        for (const [key,value] of Object.entries(values)) {
            const element = form.elements.namedItem(key);
            if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) element.value = value;
        }
        form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(element => { element.checked = ["nature", "forest", "friends", "family"].includes(element.value); });
        setFields({}); setError(""); setMessage("تمت تعبئة مثال افتراضي. راجع البيانات قبل الإرسال.");
        form.querySelector<HTMLInputElement>('#title_ar')?.focus();
    }
    const [rows, setRows] = useState<Activity[]>([]);
    const [previewMetadata, setPreviewMetadata] = useState<Record<string, CatalogMetadata>>({});
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const [fields, setFields] = useState<Record<string, string>>({});
    const [message, setMessage] = useState("");
    const [metadataRetry, setMetadataRetry] = useState<{ id: string; metadata: CatalogMetadata } | null>(null);
    async function saveMetadata(id: string, metadata: CatalogMetadata) {
        const response = await fetch(`/api/activities/${id}/catalog`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(metadata) });
        if (!response.ok) throw new Error("القائمة الأساسية منشورة. لم تُحفظ تفاصيل النوع والوسوم؛ أعد محاولة حفظ التفاصيل دون إعادة نشر القائمة.");
    }
    const load = useCallback(async () => { setLoading(true); setError(""); try {
        if (readOnly && !demoEnabled) {
            const response = await fetch("/api/activities", { cache: "no-store" });
            if (!response.ok) throw new Error("تعذّر تحميل الكتالوج التجريبي.");
            const body: unknown = await response.json();
            setRows(ActivitiesResponseSchema.parse(body).data);
            setAllowed(true);
            return;
        }
        const me = await getMe();
        if (me.role !== "business" || !me.business_id)
            throw new ApiError("This account has no business access.", 403);
        setAllowed(true);
        setRows(await listOwn());
    }
    catch (error) {
        setError(error instanceof Error ? error.message : "Unable to load");
        if (error instanceof ApiError && [401, 403].includes(error.status)) {
            setAllowed(false);
            setRows([]);
        }
    }
    finally {
        setLoading(false);
    } }, [readOnly]);
    useEffect(() => { void load(); }, [load]);
    async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const parsed = parseListing(new FormData(form)); setFields({}); setMessage(""); setError(""); if (!parsed.success) {
        setFields(Object.fromEntries(parsed.error.issues.map(issue => [issue.path[0] === "price_fils" ? "price_jod" : String(issue.path[0]), validationMessages[issue.path[0] === "price_fils" ? "price_jod" : String(issue.path[0])] ?? issue.message])));
        const firstKey = parsed.error.issues[0].path[0] === "price_fils" ? "price_jod" : String(parsed.error.issues[0].path[0]);
        requestAnimationFrame(() => document.getElementById(firstKey)?.focus());
        return;
    }
    const catalog = parseCatalogForm(new FormData(form));
    if (!catalog.success || (catalog.data.estimated_price_fils !== null && parsed.data.price_unit !== "unknown")) {
        setError("راجع نوع القائمة والتقدير: التقدير اختياري، مبلغ موجب، ويُستخدم فقط مع سعر غير معروف."); return;
    }
    setPending(true); try {
        if (readOnly && !demoEnabled) {
            const now = new Date().toISOString();
            const row: Activity = { ...sharedSyntheticFixture, ...parsed.data, title_en: parsed.data.title_en ?? null, description_en: parsed.data.description_en ?? null, id: crypto.randomUUID(), price_status: parsed.data.price_unit === "unknown" ? "unknown" : "synthetic_demo", price_checked_at: parsed.data.price_unit === "unknown" ? null : now, created_at: now, updated_at: now };
            setRows(current => [row, ...current]);
            setPreviewMetadata(current => ({ ...current, [row.id]: catalog.data }));
            setMessage("تم التحقق من النموذج وعرض معاينة مؤقتة فقط. لم يُنشر النشاط ولم يُحفظ في قاعدة بيانات أو يُضف للتوصيات. فعّل Supabase للنشر الحقيقي.");
            form.reset();
            return;
        }
        const row = await createListing(parsed.data);
        let metadataError = "";
        if (!demoEnabled) {
            try { await saveMetadata(row.id, catalog.data); setMetadataRetry(null); }
            catch (error) { setMetadataRetry({ id: row.id, metadata: catalog.data }); metadataError = error instanceof Error ? error.message : "تعذّر حفظ التفاصيل الإضافية."; }
        }
        setMessage(`تم إنشاء: ${row.title_ar}${demoEnabled ? " — تجربة مؤقتة فقط" : ""}`);
        setRows(current => [row, ...current.filter(item => item.id !== row.id)]);
        form.reset();
        await load();
        if (metadataError) setError(metadataError);
    }
    catch (error) {
        if (error instanceof ApiError)
            setFields(Object.fromEntries(Object.entries(error.fields).map(([key, value]) => [key === "price_fils" ? "price_jod" : key, value])));
        setError(error instanceof Error ? error.message : "Create failed");
    }
    finally {
        setPending(false);
    } }
    const field = (name: string, label: string, type = "text") => <div className="field" key={name}><label htmlFor={name}>{label}</label>{name.startsWith("description_") ? <textarea id={name} name={name} rows={3} aria-invalid={!!fields[name]} aria-describedby={fields[name] ? `${name}-error` : undefined}/> : <Input id={name} name={name} type={type} step={type === "number" ? "1" : undefined} aria-invalid={!!fields[name]} aria-describedby={fields[name] ? `${name}-error` : undefined}/>}{fields[name] && <p id={`${name}-error`} className="error">{fields[name]}</p>}</div>;
    const select = (name: string, label: string, values: readonly string[]) => <div className="field" key={name}><label htmlFor={name}>{label}</label><select id={name} name={name} aria-invalid={!!fields[name]} aria-describedby={fields[name] ? `${name}-error` : undefined}>{values.map(value => <option key={value} value={value}>{kindLabels[value as keyof typeof kindLabels] ?? discoveryLabels[value as keyof typeof discoveryLabels] ?? optionLabels[value] ?? value}</option>)}</select>{fields[name] && <p id={`${name}-error`} className="error">{fields[name]}</p>}</div>;
    const choices = (name: string, label: string, values: readonly string[]) => <fieldset className="field"><legend>{label}</legend><div className="check-options">{values.map(value => <label key={value}><input type="checkbox" name={name} value={value}/> {kindLabels[value as keyof typeof kindLabels] ?? discoveryLabels[value as keyof typeof discoveryLabels] ?? optionLabels[value] ?? value}</label>)}</div></fieldset>;
    return <div className="business-page"><div className="page-intro"><span className="eyebrow">للأعمال المحلية / Tashah</span><h1>تجربتك إلها ناسها.<br/>خلّيهم يلاقوك.</h1><p>عرّف الزوار بمكانك، واحكي لهم شو بيميز تجربتك. معلومات واضحة تساعدها تظهر للناس اللي بتناسبهم، دون ضمان ترتيب.</p></div>{readOnly && !demoEnabled && <div className="notice">جرّب النموذج وشوف معاينة تجربتك. المعاينة مؤقتة؛ النشر الدائم يحتاج حساب منشأة وإعداد Supabase.</div>}{demoEnabled && <div className="notice">عرض واجهة تجريبي: بيانات افتراضية، بلا مصادقة حقيقية. الإضافات مؤقتة وتختفي عند إعادة تحميل الصفحة.</div>}{loading && <p role="status">جارٍ تحميل الأنشطة</p>}{error && <p role="alert" className="error">{error}</p>}{message && <p role="status">{message}</p>}{metadataRetry && <Button disabled={pending} onClick={async () => { setPending(true); try { await saveMetadata(metadataRetry.id, metadataRetry.metadata); setMetadataRetry(null); setError(""); setMessage("تم حفظ تفاصيل القائمة المنشورة."); } catch(error) { setError(error instanceof Error ? error.message : "تعذّر الحفظ."); } finally { setPending(false); } }}>إعادة حفظ تفاصيل القائمة المنشورة</Button>}<div className="sample-row"><Button onClick={() => void load()} disabled={loading || pending}>تحديث القائمة</Button>{allowed && !readOnly && <Button className="secondary" onClick={async () => { try { await signOut(); setAllowed(false); setRows([]); setMessage("تم تسجيل الخروج."); } catch(error) { setError(error instanceof Error ? error.message : "تعذّر الخروج."); } }}>تسجيل الخروج</Button>}</div>{!allowed && !loading && <p><Link href="/login">تسجيل الدخول</Link> - يلزم حساب منشأة.</p>}{allowed && <div className="grid"><details className="business-list"><summary>{readOnly ? "الكتالوج والمعاينات المؤقتة" : "أنشطتي"} ({rows.length})</summary>{!loading && rows.length === 0 && <p>لا توجد أنشطة بعد. أضف نشاطك الأول.</p>}{rows.map(row => <Card key={row.id}><h2>{row.title_ar}</h2>{previewMetadata[row.id] && <><Badge>{kindLabels[previewMetadata[row.id].listing_kind]} · معاينة مؤقتة</Badge><p>{previewMetadata[row.id].discovery_tags.map(tag => discoveryLabels[tag]).join("، ")}</p>{previewMetadata[row.id].estimated_price_fils !== null && <p>تقدير غير مؤكد: {previewMetadata[row.id].estimated_price_fils! / 1000} دينار · {optionLabels[previewMetadata[row.id].estimated_price_unit!]}</p>}</>}<Badge>{row.status === "published" ? "منشور" : "مؤرشف"}</Badge><Badge>{row.data_kind === "synthetic_demo" ? "عرض افتراضي غير قابل للحجز" : row.record_kind === "place" && row.business_id === null ? "وجهة عامة · دون مالك خاص" : "حسب بيانات المزود"}</Badge><p>{row.description_ar}</p><p>{row.price_unit === "unknown" ? "السعر غير معروف" : `${(row.price_fils ?? 0) / 1000} دينار — ${optionLabels[row.price_unit] ?? row.price_unit}`}</p><p className="muted">{row.price_notes}</p><small dir="ltr">{row.id}</small></Card>)}</details><Card className="business-editor"><span className="eyebrow">01 المعلومات · 02 التصنيف · 03 السعر</span><h2>{readOnly ? "جرّب نموذج النشاط" : "نشر نشاط"}</h2><div className="sample-row"><Button type="button" className="secondary" onClick={fillExample} disabled={pending}>تعبئة مثال افتراضي</Button></div><form ref={formRef} className="business-form" onSubmit={submit} noValidate><fieldset disabled={pending} style={{ border: 0, padding: 0 }}>{select("listing_kind", "نوع القائمة", ["activity", "visitable_place", "accommodation", "business_offer"])}{choices("discovery_tags", "وسوم الاكتشاف", Object.keys(discoveryLabels))}{field("title_ar", "العنوان بالعربية")}{field("title_en", "العنوان بالإنجليزية (اختياري)")}{field("description_ar", "الوصف بالعربية")}{field("description_en", "الوصف بالإنجليزية (اختياري)")}{select("location_id", "المدينة", LocationIdSchema.options)}{select("category", "التصنيف", CategorySchema.options)}{choices("tags", "الاهتمامات", CategorySchema.options)}{choices("environment", "البيئة", EnvironmentSchema.options)}{choices("group_types", "المجموعات المناسبة", GroupTypeSchema.options)}{select("family_friendly", "مناسب للعائلة", ["unknown", "true", "false"])}{select("price_unit", "وحدة السعر", ["unknown", "free", "per_person", "per_group"])}{field("price_jod", "السعر بالدينار (للوحدات المدفوعة)")}{field("price_notes", "ملاحظات السعر وما يشمله")}{field("estimated_price_jod", "تقدير اختياري بالدينار (فقط للسعر غير المعروف)")}{select("estimated_price_unit", "وحدة التقدير", ["per_group", "per_person"])}{field("duration_minutes", "المدة بالدقائق (اختياري)", "number")}{field("capacity_people", "الحد الأقصى للمجموعة (اختياري)", "number")}{field("available_months", "أشهر الموسم: أرقام مفصولة بفواصل (اختياري)")}<p className="muted">الموسم لا يؤكد التوافر. يتم تحديد ملكية المنشأة ومصدر البيانات على الخادم.</p>{Object.keys(fields).length > 0 && <p role="alert" className="error">راجع الحقول: {Object.entries(fields).map(([key, value]) => `${fieldLabels[key] ?? key}: ${value}`).join("; ")}</p>}<Button type="submit" disabled={pending}>{pending ? "جارٍ المعالجة…" : readOnly ? "تحقق واعرض المعاينة" : "نشر النشاط"}</Button></fieldset></form></Card></div>}</div>;
}
