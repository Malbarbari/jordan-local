"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAccount, api } from "@/components/account/context";
import { ActivitySchema, CreateActivitySchema, type Activity } from "@/contracts";
import { sharedSyntheticFixture } from "@/contracts/fixtures";
import { CatalogMetadataSchema, defaultMetadata, kindLabels, discoveryLabels, type CatalogMetadata } from "@/contracts/catalog";
import { TourismListingSchema, tourismLocations } from "@/contracts/tourism";
import { emptyDetails, OwnerDetailsSchema, ListingDetailsSchema, type ListingDetails } from "@/contracts/listing-details";
import { jodToFils } from "./form";
import { cities } from "@/lib/recommendation/preferences";
export default function Manager() {
    const s = useAccount(), [rows, setRows] = useState<Activity[]>([]), [editing, setEditing] = useState<Activity | null>(null), [editMetadata, setEditMetadata] = useState<CatalogMetadata | null>(null), [editDetails, setEditDetails] = useState<ListingDetails | null>(null), [pending, setPending] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState(""), [savedId, setSavedId] = useState<string | null>(null), [loading, setLoading] = useState(true);
    useEffect(() => { if (!s.ready)
        return; queueMicrotask(() => { if (s.demo) {
        setRows(s.demo.listings.map(r => ActivitySchema.parse(r.activity)));
        setLoading(false);
    }
    else if (s.account?.business) {
        api("/api/activities?mine=true").then(v => setRows(v.map((r: unknown) => ActivitySchema.parse(r)))).catch(e => setError(e.message)).finally(() => setLoading(false));
    }
    else
        setLoading(false); }); }, [s.ready, s.demo, s.account]);
    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setMessage("");
        const form = e.currentTarget, f = new FormData(form), unit = String(f.get("price_unit")), amount = jodToFils(String(f.get("price") ?? "")), kind = String(f.get("kind"));
        const parsed = CreateActivitySchema.safeParse({ title_ar: f.get("title"), title_en: editing?.title_en ?? null, description_ar: f.get("description"), description_en: editing?.description_en ?? null, location_id: f.get("location"), category: f.get("category"), tags: editing?.tags ?? [f.get("category")], environment: editing?.environment ?? [], group_types: f.getAll("groups"), family_friendly: f.get("family") === "on" ? true : null, price_unit: unit === "per_night" ? "unknown" : unit, price_fils: unit === "unknown" || unit === "per_night" ? null : unit === "free" ? 0 : amount, price_valid_until: editing?.price_valid_until ?? null, price_notes: f.get("notes") || "", duration_minutes: editing?.duration_minutes ?? null, capacity_people: f.get("capacity") ? Number(f.get("capacity")) : null, available_months: editing?.available_months ?? null, image_path: editing?.image_path ?? null });
        const metadata = CatalogMetadataSchema.safeParse({ listing_kind: kind, discovery_tags: Array.from(new Set([String(f.get("tag")), ...(editMetadata?.discovery_tags ?? [])])), estimated_price_fils: null, estimated_price_unit: null });
        const details = OwnerDetailsSchema.safeParse({ ...(editDetails ?? emptyDetails), image_url: f.get("image_url") || null, image_rights_confirmed: f.get("rights") === "on", quotes: unit === "per_night" ? [{ id: "night", label_ar: "إقامة · غرفة واحدة", amount_fils: amount, unit: "per_night", audience: "everyone", status: "owner_declared", conditions: [String(f.get("notes") || "السعر لغرفة واحدة؛ تأكد من السعة والتوافر.")], source_url: null, checked_at: null, optional: false }] : (editDetails?.quotes??[]).filter(q=>q.unit!=="per_night").map(q=>({...q,status:"owner_declared" as const})) });
        if (!parsed.success || !metadata.success || !details.success || (unit === "per_night" && (kind !== "accommodation" || amount === null || amount <= 0))) {
            setError("راجع العنوان والوصف والسعة والسعر والصورة. السعر الليلي متاح للإقامة فقط؛ تأكيد حقوق الصورة مطلوب عند إضافتها.");
            return;
        }
        setPending(true);
        try {
            if (s.demo) {
                if (!s.demo.business)
                    throw new Error("أنشئ ملف مشروعك أولًا.");
                const now = new Date().toISOString(), id = editing?.id ?? crypto.randomUUID(), activity = ActivitySchema.parse({ ...sharedSyntheticFixture, ...parsed.data, id, business_id: "00000000-0000-4000-8000-000000000010", price_status: parsed.data.price_unit === "unknown" ? "unknown" : "synthetic_demo", price_checked_at: parsed.data.price_unit === "unknown" ? null : now, created_at: editing?.created_at ?? now, updated_at: now, status: "published" });
                const row = TourismListingSchema.parse({ activity, metadata: metadata.data, provider: { id: activity.business_id, name: s.demo.business.name, website: s.demo.business.website, source_url: null, verification_status: "owner_declared" }, image: null, coordinates: null, currency: "JOD", location_label_ar: tourismLocations[activity.location_id], location_label_en: activity.location_id });
                const demoDetails = { ...details.data, quotes: details.data.quotes.map(q => ({ ...q, status: "demo_estimate" as const })) };
                s.saveDemo({ ...s.demo, listings: [row, ...s.demo.listings.filter(r => r.activity.id !== id)], details: { ...s.demo.details, [id]: demoDetails } });
                setMessage("نُشرت القائمة داخل التجربة المحلية على هذا المتصفح فقط. يمكنك اكتشافها الآن.");
            }
            else {
                const id = savedId ?? editing?.id;
                const row = ActivitySchema.parse(await api(`/api/activities${id ? `/${id}` : ""}`, id ? "PATCH" : "POST", parsed.data));
                setSavedId(row.id);
                setRows(v => [row, ...v.filter(r => r.id !== row.id)]);
                await api(`/api/activities/${row.id}/catalog`, "PATCH", metadata.data);
                await api(`/api/activities/${row.id}/details`, "PATCH", details.data);
                setMessage(row.status==="archived"?"حُفظ التعديل؛ القائمة ما زالت مؤرشفة.":"القائمة محفوظة ومنشورة. يمكنك فتحها من الاستكشاف.");
                await s.refresh();
            }
            setEditing(null);
            setEditMetadata(null);
            setEditDetails(null);
            setSavedId(null);
            form.reset();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "لم تُحفظ القائمة.");
        }
        finally {
            setPending(false);
        }
    }
    async function edit(row: Activity) { setError(""); setPending(true); try {
        if (s.demo) {
            setEditMetadata(s.demo.listings.find(r => r.activity.id === row.id)?.metadata ?? null);
            setEditDetails(s.demo.details[row.id] ?? null);
        }
        else {
            const [metadata, details] = await Promise.all([api(`/api/activities/${row.id}/catalog`), api(`/api/activities/${row.id}/details`)]);
            setEditMetadata(CatalogMetadataSchema.parse(metadata));
            setEditDetails(details ? ListingDetailsSchema.parse(details) : null);
        }
        setEditing(row);
        setSavedId(null);
        document.getElementById("listing-editor")?.scrollIntoView();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load listing details");
    }
    finally {
        setPending(false);
    } }
    async function archive(row: Activity) { if (!confirm(`أرشفة «${row.title_ar}» وإخفاؤها من الاستكشاف؟`))
        return; setError(""); setPending(true); try {
        if (s.demo)
            s.saveDemo({ ...s.demo, listings: s.demo.listings.filter(r => r.activity.id !== row.id), favorites: s.demo.favorites.filter(id => id !== row.id) });
        else {
            await api(`/api/activities/${row.id}`, "DELETE");
            setRows(v => v.map(r => r.id === row.id ? { ...r, status: "archived" } : r));
        }
        setMessage(s.demo ? "أُزيلت من التجربة المحلية." : "تمت الأرشفة؛ القائمة مخفية عن الزوار.");
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "تعذّرت الأرشفة.");
    }
    finally {
        setPending(false);
    } }
    if (!s.ready || loading)
        return <p role="status">جارٍ تحميل قوائمك…</p>;
    if (!(s.demo?.business || s.account?.business))
        return <div className="narrow card"><h1>كل تجربة محلية، إلها مكان هون</h1><p>أنشئ ملف مشروعك ثم أضف أول تجربة.</p><Link href={s.account || s.demo ? "/business/profile" : "/signup"} className="button">ابدأ بملف مشروعك</Link></div>;
    const ownDetails = editing ? (editDetails ?? s.details[editing.id]) : null, night = ownDetails?.quotes.find(q => q.unit === "per_night"), metadata = editing ? (editMetadata ?? s.demo?.listings.find(r => r.activity.id === editing.id)?.metadata ?? defaultMetadata(editing)) : null;
    return <><div className="page-intro"><span className="eyebrow">من مشروعك، لطلعة الناس القادمة</span><h1>لوحة مشروعك السياحي</h1><div className="detail-links"><Link href="/business/profile">ملف المنشأة</Link><Link href="/explore">استكشاف القوائم</Link><a href="#listing-editor">أضف تجربة جديدة</a></div></div><div className="business-stats"><strong>{rows.filter(r => r.status === "published").length} قوائم منشورة</strong><span>{rows.filter(r => r.status === "archived").length} مؤرشفة</span></div>{message && <p role="status" className="notice">{message}</p>}{error && <p role="alert" className="error">{error}{savedId && " القائمة الأساسية محفوظة. أعد حفظ نفس النموذج لإكمال التفاصيل دون تكرار القائمة."}</p>}<div className="manager-grid"><section className="stack"><h2>قوائمي</h2>{rows.length === 0 && <p>أضف تجربتك الأولى، وخلّي الناس تتعرف عليك.</p>}{rows.map(row => <article key={row.id} className="card stack"><h3>{row.title_ar}</h3><span>{row.status === "published" ? "منشورة" : "مؤرشفة"}</span><p>{row.description_ar}</p><div className="detail-links">{row.status === "published" && <Link href={`/listings/${row.id}`}>عرض القائمة</Link>}<button className="button secondary" disabled={pending} onClick={() => void edit(row)}>تعديل</button>{row.status === "published" && <button className="button secondary" disabled={pending} onClick={() => void archive(row)}>أرشفة</button>}</div></article>)}</section><section className="card" id="listing-editor"><h2>{editing ? "تعديل تجربتك" : "أضف تجربة جديدة"}</h2>{editing && <button className="text-link" onClick={() => { setEditing(null); setEditMetadata(null); setEditDetails(null); setSavedId(null); }}>إلغاء التعديل</button>}<form className="stack" key={editing?.id ?? "new"} onSubmit={submit}><fieldset className="stack" disabled={pending} style={{ border: 0, padding: 0 }}><label htmlFor="listing-title">عنوان التجربة</label><input id="listing-title" name="title" defaultValue={editing?.title_ar ?? ""} required maxLength={200}/><label htmlFor="listing-description">وصف التجربة</label><textarea id="listing-description" name="description" defaultValue={editing?.description_ar ?? ""} required maxLength={4000}/><label htmlFor="listing-location">المدينة</label><select id="listing-location" name="location" defaultValue={editing?.location_id ?? "irbid"}>{Object.entries(cities).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select><label htmlFor="listing-kind">نوع القائمة</label><select id="listing-kind" name="kind" defaultValue={metadata?.listing_kind ?? "activity"}>{["activity", "visitable_place", "accommodation", "business_offer"].map(k => <option value={k} key={k}>{kindLabels[k as keyof typeof kindLabels]}</option>)}</select><label htmlFor="listing-category">التصنيف</label><select id="listing-category" name="category" defaultValue={editing?.category ?? "nature"}><option value="nature">طبيعة</option><option value="adventure">مغامرة</option><option value="food">طعام</option><option value="culture">ثقافة</option><option value="heritage">تراث</option></select><label htmlFor="listing-tag">اهتمام الاكتشاف</label><select id="listing-tag" name="tag" defaultValue={metadata?.discovery_tags[0] ?? "nature"}>{["nature", "hiking", "cabins", "swimming", "family", "couples", "food", "cultural", "wellness", "adventure"].map(v => <option key={v} value={v}>{discoveryLabels[v as keyof typeof discoveryLabels]}</option>)}</select><fieldset><legend>المجموعات المناسبة</legend>{(["family", "friends", "couple", "solo"] as const).map((group, index) => <label key={group}><input type="checkbox" name="groups" value={group} defaultChecked={(editing?.group_types ?? ["friends"]).includes(group)}/>{["عائلة", "أصدقاء", "شخصان", "فرد"][index]}</label>)}</fieldset><label htmlFor="listing-unit">وحدة السعر</label><select id="listing-unit" name="price_unit" defaultValue={night ? "per_night" : editing?.price_unit ?? "per_person"}><option value="per_person">لكل شخص</option><option value="per_group">للمجموعة</option><option value="per_night">للغرفة / الليلة · إقامة</option><option value="free">مجاني</option><option value="unknown">تواصل لمعرفة السعر</option></select><label htmlFor="listing-price">السعر بالدينار</label><input id="listing-price" name="price" inputMode="decimal" defaultValue={night ? night.amount_fils / 1000 : editing?.price_fils !== null && editing ? editing.price_fils / 1000 : ""}/><label htmlFor="listing-notes">ما الذي يشمله السعر؟</label><textarea id="listing-notes" name="notes" defaultValue={editing?.price_notes ?? ""} maxLength={2000}/><label htmlFor="listing-capacity">أقصى عدد للمجموعة (اختياري)</label><input id="listing-capacity" name="capacity" type="number" min={1} defaultValue={editing?.capacity_people ?? ""}/><label><input type="checkbox" name="family" defaultChecked={editing?.family_friendly === true}/> مناسب للعائلة</label><label htmlFor="listing-image">رابط صورة HTTPS (اختياري)</label><input id="listing-image" name="image_url" type="url" defaultValue={ownDetails?.image_url ?? ""} dir="ltr"/><p className="detail-note">نستخدم رابط صورتك؛ رفع الملفات غير متاح في هذه النسخة.</p><label><input type="checkbox" name="rights" defaultChecked={ownDetails?.image_rights_confirmed ?? false}/> أملك حقوق نشر الصورة أو إذن استخدامها</label><button className="button">{pending ? "جارٍ الحفظ…" : editing ? "حفظ التعديل" : "نشر القائمة"}</button></fieldset></form></section></div></>;
}
