"use client";
import {useAccount} from "@/components/account/context";
import {api} from "@/components/account/context";
import {UserPreferencesSchema} from "@/contracts/settings";
import {savedPreferencesToOverrides} from "@/lib/recommendation/saved-preferences";
import {localRecommendations} from "@/lib/tourism/local-recommendations";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpLeft, Sparkles, SlidersHorizontal, LoaderCircle, Users, Wallet, MapPin } from "lucide-react";
import { RecommendRequestSchema, RecommendResponseSchema, ErrorResponseSchema, type Category, type RecommendResponse, type RecommendRequest, type Preferences } from "@/contracts";
import { CatalogResponseSchema, kindLabels, discoveryLabels, type CatalogEntry, type DiscoveryTag } from "@/contracts/catalog";
import { cities } from "@/lib/recommendation/preferences";
import { jodToFils } from "@/components/business/form";
import { ActivityCard, categoryLabels } from "./activity-card";
import { Button, Input } from "@/components/ui";
const samples = [
    { name: "طبيعة مع الأصدقاء", city: "ajloun", group: "friends", party: "4", budget: "80", interests: ["nature", "adventure"] as Category[], query: "نريد طلعة طبيعة هادئة مع وقت للتصوير." },
    { name: "فن ونكهات مع العائلة", city: "amman", group: "family", party: "4", budget: "30", interests: ["culture", "food"] as Category[], query: "نبحث عن تجربة خفيفة للعائلة تجمع الفن والنكهات." },
    { name: "غروب في الصحراء", city: "wadi-rum", group: "friends", party: "6", budget: "40", interests: ["adventure", "nature"] as Category[], query: "نريد نشاطًا جماعيًا في أجواء الصحراء." }
];
export default function Explorer() {
    const account=useAccount();
    const [catalogue, setCatalogue] = useState<CatalogEntry[]>([]), [catalogueError, setCatalogueError] = useState(""), [catalogueLoading, setCatalogueLoading] = useState(true);
    const [kind, setKind] = useState(""), [tag, setTag] = useState(""), [metadataAvailable, setMetadataAvailable] = useState(true);
    const [city, setCity] = useState("ajloun"), [group, setGroup] = useState("friends"), [party, setParty] = useState("4"), [budget, setBudget] = useState("40"), [query, setQuery] = useState(""), [interests, setInterests] = useState<Category[]>(["nature", "adventure"]);
    const [result, setResult] = useState<RecommendResponse | null>(null), [pending, setPending] = useState(false), [error, setError] = useState(""), [showAll, setShowAll] = useState(false), [retry, setRetry] = useState(0);
    const lastRequest = useRef<RecommendRequest | null>(null), busy = useRef(false);
    const resultsRef = useRef<HTMLDivElement>(null);
    useEffect(() => { const controller = new AbortController(); fetch("/api/catalog", { cache: "no-store", signal: controller.signal }).then(async (response) => { const body: unknown = await response.json(); if (!response.ok)
        throw new Error("تعذّر تحميل الكتالوج."); const catalog = CatalogResponseSchema.parse(body); setCatalogue(catalog.data); setMetadataAvailable(catalog.meta.metadata_available); setCatalogueError(""); }).catch(error => { if (!controller.signal.aborted)
        setCatalogueError(error instanceof Error ? error.message : "تعذّر التحميل."); }).finally(() => { if (!controller.signal.aborted)
        setCatalogueLoading(false); }); return () => controller.abort(); }, [retry]);
    async function send(request: RecommendRequest) {
        if (busy.current)
            return;
        busy.current = true;
        setPending(true);
        setError("");
        setResult(null);
        lastRequest.current = request;
        try {
            const response = await fetch("/api/recommend", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal: AbortSignal.timeout(20000) });
            const body: unknown = await response.json();
            if (!response.ok) {
                const parsed = ErrorResponseSchema.safeParse(body);
                throw new Error(parsed.success ? parsed.data.error.message : "تعذّر البحث.");
            }
            setResult(RecommendResponseSchema.parse(body));
            requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }
        catch (error) {
            setError(error instanceof Error && error.name === "TimeoutError" ? "استغرق البحث وقتًا طويلًا. حاول مجددًا." : error instanceof Error ? error.message : "تعذّر البحث.");
        }
        finally {
            setPending(false);
            busy.current = false;
        }
    }
    async function saved(){try{setError("");const p=UserPreferencesSchema.parse(await api("/api/account/preferences"));await send(RecommendRequestSchema.parse({schema_version:1,locale:"ar",query,overrides:savedPreferencesToOverrides(p)}));}catch(e){setError(e instanceof Error?e.message:"تعذّر تحميل التفضيلات.");}}
    function submit(event: FormEvent) { event.preventDefault(); const input = { schema_version: 1, locale: "ar", query, overrides: { party_size: party === "" ? null : Number(party), budget_fils: budget === "" ? null : jodToFils(budget), budget_scope: "per_group", budget_basis: "activity_only", destination_location_ids: city ? [city] : [], group_type: group || null, interests } }; const parsed = RecommendRequestSchema.safeParse(input); if (!parsed.success) {
        setError("راجع عدد الأشخاص (1–30) والميزانية (دينار، حتى ثلاث خانات عشرية).");
        return;
    } void send(parsed.data); }
    function sample(index: number) { const value = samples[index]; setCity(value.city); setGroup(value.group); setParty(value.party); setBudget(value.budget); setInterests(value.interests); setQuery(value.query); setResult(null); setError(""); }
    function clarify(key: string, value: string) {
        if (!lastRequest.current)
            return;
        const patch: Partial<Preferences> = key === "party_size" ? { party_size: Number(value) } : key === "budget_scope" ? { budget_scope: value as Preferences["budget_scope"] } : key === "budget_basis" ? { budget_basis: "activity_only" } : { destination_location_ids: [value as keyof typeof cities], max_straight_line_km: null };
        void send({ ...lastRequest.current, overrides: { ...lastRequest.current.overrides, ...patch } });
    }
    const filtered = catalogue.filter(entry => (!kind || entry.metadata.listing_kind === kind) && (!tag || entry.metadata.discovery_tags.includes(tag as DiscoveryTag)));
    const rows = showAll ? filtered : filtered.slice(0, 6);
    return <>
  <section className="search-section" id="discover" aria-labelledby="search-title">
   <div className="section-heading"><div><span className="eyebrow"><SlidersHorizontal size={16} aria-hidden="true"/>اقتراحات على قياسك</span><h2 id="search-title">شو بتحب؟ ومع مين طالع؟</h2></div><p>احكيلنا عن طلعتك، وشوف خيارات محسوبة لمجموعتك.</p></div>
   <form className="discovery-form recommendation-form" onSubmit={submit} noValidate>
    <fieldset disabled={pending}><div className="search-controls">
     <div><label htmlFor="city"><MapPin size={16} aria-hidden="true"/>المدينة</label><select id="city" value={city} onChange={e => setCity(e.target.value)}><option value="">كل المدن</option>{Object.entries(cities).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
     <div><label htmlFor="party"><Users size={16} aria-hidden="true"/>عدد الأشخاص</label><Input id="party" type="number" min={1} max={30} step={1} value={party} onChange={e => setParty(e.target.value)}/></div>
     <div><label htmlFor="budget"><Wallet size={16} aria-hidden="true"/>ميزانية المجموعة · دينار</label><Input id="budget" inputMode="decimal" value={budget} onChange={e => setBudget(e.target.value)} placeholder="40"/></div>
     <div><label htmlFor="group">مع مَن؟</label><select id="group" value={group} onChange={e => setGroup(e.target.value)}><option value="">دون تفضيل</option><option value="friends">الأصدقاء</option><option value="family">العائلة</option><option value="couple">شخصان</option><option value="solo">بمفردي</option></select></div>
    </div>
    <fieldset className="interest-fieldset"><legend>ما الذي يشبهك؟</legend><div className="interest-options">{Object.entries(categoryLabels).map(([value, label]) => <label className={interests.includes(value as Category) ? "interest active" : "interest"} key={value}><input type="checkbox" checked={interests.includes(value as Category)} onChange={() => setInterests(current => current.includes(value as Category) ? current.filter(item => item !== value) : [...current, value as Category])}/>{label}</label>)}</div></fieldset>
    <label htmlFor="query">صِف طلعتك بكلماتك <span className="muted">(العربية أو الإنجليزية)</span></label><textarea id="query" rows={2} maxLength={1000} value={query} onChange={e => setQuery(e.target.value)} placeholder="بدي طلعة طبيعة مع صحابي بعجلون، وفيها وقت للتصوير…"/>
    <div className="form-bottom"><p>الميزانية للنشاط فقط، دون المواصلات أو الوجبات إلا إذا ذُكرت. القيم المحددة هنا لها الأولوية على النص.</p><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={18}/> : <Sparkles size={18} aria-hidden="true"/>}{pending ? "نبحث عن طلعتك…" : "اكتشف خياراتي"}<ArrowUpLeft size={18} aria-hidden="true"/></Button></div>
    </fieldset>
   </form>
   <div className="sample-row"><span>جرّب مثالًا:</span>{samples.map((value, index) => <button type="button" key={value.name} onClick={() => sample(index)} disabled={pending}>{value.name}</button>)}</div>
   <div className="sample-row"><button type="button" disabled={pending||!query.trim()} onClick={()=>void send(RecommendRequestSchema.parse({schema_version:1,locale:"ar",query,overrides:{}}))}>حلّل وصفي أولًا · دون قيم النموذج</button>{account.account&&<button type="button" disabled={pending} onClick={()=>void saved()}>اقترح بتفضيلاتي المحفوظة</button>}<Link href="/account/preferences">إدارة التفضيلات</Link></div><p className="detail-note">التفضيلات المحفوظة تطبّق المدن والميزانية والعدد ونوع المجموعة والاهتمامات فقط. أنواع الإقامة وملاحظات الوصول ليست قيودًا مؤكدة في عقد التوصيات الحالي.</p>
   {error && <div role="alert" className="notice error">{error} <Link href="/login">تسجيل الدخول</Link></div>}
  </section>
  {result && result.status!=="clarification" && account.demo && <section className="card local-demo-recommendations"><h2>خيارات مشروعك في هذا المتصفح</h2><p className="detail-note">توصيات قواعد محلية للنموذج التجريبي، منفصلة عن رد الخادم. لا تمثل ذكاءً اصطناعيًا أو حفظًا في قاعدة البيانات.</p><div className="experience-grid">{localRecommendations(account.demo.listings,result.preferences,new Date()).map(({entry,recommendation})=><ActivityCard key={entry.activity.id} activity={entry.activity} recommendation={recommendation} entry={entry} party={result.preferences.party_size??1}/>)}</div></section>}
  <div ref={resultsRef} className="results-anchor" aria-live="polite" aria-busy={pending}>
   {pending && <div className="loading-state"><LoaderCircle className="spin" size={28}/><h2>نراجع الأنشطة وميزانية مجموعتك…</h2><p>نستخدم الأنشطة المؤهلة فقط.</p></div>}
   {result && <>
    <div className="section-heading"><div><span className="eyebrow">{result.engine === "hybrid_llm" ? "ترتيب بالذكاء الاصطناعي" : result.engine === "rules_fallback" ? "اقتراحات بالقواعد" : "نحتاج معلومة إضافية"}</span><h2>{result.status === "clarification" ? "لنضبط التفاصيل أولًا" : result.status === "no_match" ? "لا يوجد نشاط يطابق كل الشروط" : "خيارات تناسب طلعتك"}</h2></div><span className="muted">{result.candidate_count} خيارًا مناسبًا</span></div>
    <div className="preference-chips"><span>{result.preferences.party_size ?? "؟"} أشخاص</span><span>{result.preferences.budget_fils === null ? "دون حد للميزانية" : `${result.preferences.budget_fils / 1000} دينار ${result.preferences.budget_scope === "per_person" ? "للشخص" : "للمجموعة"}`}</span>{result.preferences.destination_location_ids.map(id => <span key={id}>{cities[id]}</span>)}{result.preferences.interests.map(id => <span key={id}>{categoryLabels[id]}</span>)}</div>
    {result.status === "clarification" && <div className="card">{result.questions.map(question => <div className="clarification" key={question.key}><h3>{question.prompt}</h3><div className="sample-row">{question.choices.map(value => <Button key={value} type="button" onClick={() => clarify(question.key, value)}>{cities[value as keyof typeof cities] ?? ({ per_group: "للمجموعة", per_person: "لكل شخص", activity_only: "الميزانية المدخلة للنشاط فقط" } as Record<string, string>)[value] ?? value}</Button>)}</div></div>)}</div>}
    {result.status === "no_match" && <div className="empty-state"><h3>جرّب مدينة أخرى أو عدّل ميزانيتك.</h3><p>لم نغيّر شروطك تلقائيًا. الأسعار والقدرة غير المعروفة لا تُعدّ تطابقًا مؤكدًا.</p><button className="button secondary" type="button" onClick={() => { setResult(null); document.getElementById("city")?.focus(); }}>تعديل اختياراتي</button></div>}
    <div className="experience-grid">{result.recommendations.map(row => <ActivityCard key={row.activity_id} activity={row.activity} entry={catalogue.find(entry => entry.activity.id === row.activity_id)} recommendation={row} party={result.preferences.party_size ?? 4}/>)}</div>
    <div className="result-notes">{result.warnings.map((warning, i) => <p key={i}>{warning}</p>)}</div>
   </>}
  </div>
  <details className="legacy-catalogue"><summary>أمثلة عروض الميزانية · افتراضية للعرض التجريبي</summary><section className="catalogue-section" aria-labelledby="catalogue-title"><div className="section-heading"><div><span className="eyebrow">أفكار لطلعتك القادمة</span><h2 id="catalogue-title">أمثلة تساعدك تجرّب التخطيط</h2></div><span className="muted">عروض افتراضية غير قابلة للحجز</span></div>
   <p>وجهات عامة، أماكن للزيارة، أنشطة، إقامات وعروض محلية. الظهور هنا لا يؤكد السعر أو السعة أو السلامة؛ النتائج المؤكدة تلتزم بشروطك.</p>
   <div className="search-controls"><div><label htmlFor="catalog-kind">نوع القائمة</label><select id="catalog-kind" value={kind} onChange={e => { setKind(e.target.value); setShowAll(true); }}><option value="">كل الأنواع</option>{Object.entries(kindLabels).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></div><div><label htmlFor="catalog-tag">اهتمام للاستكشاف</label><select id="catalog-tag" value={tag} onChange={e => { setTag(e.target.value); setShowAll(true); }}><option value="">كل الاهتمامات</option>{Object.entries(discoveryLabels).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></div></div>
   {!metadataAvailable && <p role="status" className="notice">بعض التصنيفات أو بيانات المزودين غير متاحة. القوائم الأساسية متاحة؛ راجع إعداد migration 002.</p>}
   {catalogueLoading && <p role="status">جارٍ تحميل الأنشطة…</p>}{catalogueError && <div className="notice" role="alert">{catalogueError}<Button type="button" onClick={() => { setCatalogueLoading(true); setRetry(value => value + 1); }}>حاول مجددًا</Button></div>}
   {!catalogueLoading && !catalogueError && !catalogue.length && <p className="empty-state">لا توجد أنشطة منشورة بعد.</p>}
   {!catalogueLoading && !catalogueError && catalogue.length > 0 && !filtered.length && <p className="empty-state">لا توجد قوائم بهذا النوع والاهتمام. جرّب تصفية أخرى.</p>}
   <div className="experience-grid">{rows.map(entry => <ActivityCard key={entry.activity.id} activity={entry.activity} entry={entry} party={Number(party) || 4}/>)}</div>
   {filtered.length > 6 && <div className="center"><Button className="secondary" type="button" onClick={() => setShowAll(value => !value)}>{showAll ? "عرض أقل" : "استكشف بقية الأنشطة"}</Button></div>}
  </section></details>
 </>;
}
