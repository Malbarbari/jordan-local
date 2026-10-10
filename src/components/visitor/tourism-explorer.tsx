"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { MapPin, Search, ArrowUpLeft, SlidersHorizontal, Mountain, Footprints, Tent, Waves, Landmark, Coffee, Users, Sun } from "lucide-react";
import { TourismFiltersSchema, TourismResponseSchema, tourismLocations, type TourismListing } from "@/contracts/tourism";
import { discoveryLabels, kindLabels } from "@/contracts/catalog";
import { ErrorResponseSchema } from "@/contracts";
import { categoryLabels } from "./activity-card";
import { Button, Input } from "@/components/ui";
import { jodToFils } from "@/components/business/form";
import { TourismPrice, TourismMedia, ImageCredit } from "./tourism-presentation";
import { useAccount } from "@/components/account/context";
import { filterTourism } from "@/lib/tourism/filter";
import { rankTourism } from "@/lib/tourism/ranking";

const categories = [
 {label:"طبيعة وإطلالات",tag:"nature",Icon:Mountain}, {label:"هايكنغ ومغامرات",tag:"hiking",Icon:Footprints},
 {label:"أكواخ وإقامات",tag:"cabins",Icon:Tent}, {label:"سباحة وبحر",tag:"swimming",Icon:Waves},
 {label:"أماكن تاريخية",tag:"historical",Icon:Landmark}, {label:"تجارب محلية",tag:"food",Icon:Coffee},
 {label:"رحلات عائلية",tag:"family",Icon:Users}, {label:"استرخاء ومنتجعات",tag:"wellness",Icon:Sun},
];
const regions = ["irbid","ajloun","umm-qais","jerash","amman","dead-sea","petra","wadi-rum","aqaba","wadi-mujib"];
const blank = {query:"",location_id:"",listing_kind:"",category:"",tag:"",party_size:"",group_type:"",budget:""};
type Controls = typeof blank;

export function TourismCard({ row, party, demo=false }: { row: TourismListing; party: number|null; demo?:boolean }) {
 const a=row.activity;
 return <article className="experience-card tourism-card compact-card">
  <Link href={`/listings/${a.id}`} className="card-media-link">
   <div className="experience-art"><TourismMedia row={row}/><span className="category-pill">{kindLabels[row.metadata.listing_kind]}{a.data_kind==="synthetic_demo"?" · تجريبي":""}</span></div>
  </Link>
  <div className="experience-body">
   <div className="eyebrow"><MapPin size={13} aria-hidden="true"/>{tourismLocations[a.location_id]}</div>
   <h3><Link href={`/listings/${a.id}`}>{a.title_ar}</Link></h3>
   <p className="description">{a.description_ar}</p>
   <div className="preference-chips">{row.metadata.discovery_tags.slice(0,2).map(tag=><span key={tag}>{discoveryLabels[tag]}</span>)}</div>
   {row.provider && <p className="provider-name">{row.provider.name}</p>}
   <TourismPrice row={row} party={party} demo={demo}/>
   <Link className="card-explore" href={`/listings/${a.id}`}>تفاصيل المكان <ArrowUpLeft size={16} aria-hidden="true"/></Link>
   <ImageCredit row={row}/>
  </div>
 </article>;
}

export default function TourismExplorer({ featured=false }: { featured?:boolean }) {
 const account=useAccount();
 const [controls,setControls]=useState<Controls>(blank), [rows,setRows]=useState<TourismListing[]>([]), [catalog,setCatalog]=useState<TourismListing[]>([]), [pending,setPending]=useState(true), [error,setError]=useState(""), [requestQuery,setRequestQuery]=useState<string|null>(null), [retry,setRetry]=useState(0), [showAll,setShowAll]=useState(false), [sort,setSort]=useState("relevant"), [party,setParty]=useState<number|null>(null);
 const [meta,setMeta]=useState({count:0,total:0,unconfirmed_count:0,data_mode:"seed"}), [filtersOpen,setFiltersOpen]=useState(false);
 function apply(values:Controls, sync=true) {
  const parsed=TourismFiltersSchema.safeParse({query:values.query,...(values.location_id?{location_id:values.location_id}:{}),...(values.listing_kind?{listing_kind:values.listing_kind}:{}),...(values.category?{category:values.category}:{}),...(values.tag?{tag:values.tag}:{}),...(values.party_size?{party_size:Number(values.party_size)}:{}),...(values.group_type?{group_type:values.group_type}:{}),...(values.budget?{budget_fils:jodToFils(values.budget)}:{})});
  if(!parsed.success) {setError("راجع عدد الأشخاص (1–30) وميزانية المجموعة بالدينار، حتى ثلاث خانات عشرية.");setPending(false);return;}
  const params=new URLSearchParams(); for(const [key,value] of Object.entries(parsed.data)) if(String(value)!=="") params.set(key,String(value));
  setControls(values);setError("");setPending(true);setParty(parsed.data.party_size??null);setShowAll(false);setRequestQuery(params.toString());setRetry(n=>n+1);
  if(sync) {const url=new URL(window.location.href);for(const key of Object.keys(blank)) url.searchParams.delete(`tour_${key}`);for(const [key,value] of Object.entries(values)) if(value) url.searchParams.set(`tour_${key}`,value);window.history.pushState(null,"",url);}
 }
 useEffect(()=>{
  function restore() {const params=new URLSearchParams(window.location.search), values={...blank};for(const key of Object.keys(blank) as (keyof Controls)[]) values[key]=params.get(`tour_${key}`)??"";apply(values,false);}
  function discover(event:Event) {const detail=(event as CustomEvent<Partial<Controls>>).detail;apply({...blank,...detail});document.getElementById("tourism")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});}
  queueMicrotask(restore);window.addEventListener("popstate",restore);window.addEventListener("tourism-discover",discover);return()=>{window.removeEventListener("popstate",restore);window.removeEventListener("tourism-discover",discover);};
 // apply uses only stable setters; restoration always starts from the URL.
 },[]);
 useEffect(()=>{const controller=new AbortController();fetch("/api/tourism",{cache:"no-store",signal:controller.signal}).then(async r=>{if(r.ok)setCatalog(TourismResponseSchema.parse(await r.json()).data);}).catch(()=>{});return()=>controller.abort();},[]);
 useEffect(()=>{
  if(requestQuery===null)return;const controller=new AbortController();fetch(`/api/tourism${requestQuery?`?${requestQuery}`:""}`,{cache:"no-store",signal:controller.signal}).then(async response=>{const body:unknown=await response.json();if(!response.ok){const parsed=ErrorResponseSchema.safeParse(body);throw new Error(parsed.success?parsed.data.error.message:"تعذّر تحميل الوجهات.");}const parsed=TourismResponseSchema.parse(body);if(!controller.signal.aborted){setRows(parsed.data);setMeta(parsed.meta);}}).catch(error=>{if(!controller.signal.aborted){setRows([]);setError(error instanceof Error?error.message:"تعذّر التحميل.");}}).finally(()=>{if(!controller.signal.aborted)setPending(false);});return()=>controller.abort();
 },[requestQuery,retry]);
 function submit(event:FormEvent) {event.preventDefault();apply(controls);}
 function shortcut(patch:Partial<Controls>) {apply({...blank,...patch});document.getElementById("tourism-results")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});}
 const localFilters=TourismFiltersSchema.safeParse({query:controls.query,...(controls.location_id?{location_id:controls.location_id}:{}),...(controls.tag?{tag:controls.tag}:{}),...(controls.party_size?{party_size:Number(controls.party_size)}:{}),...(controls.group_type?{group_type:controls.group_type}:{}),...(controls.budget?{budget_fils:jodToFils(controls.budget)}:{}),...(controls.listing_kind?{listing_kind:controls.listing_kind}:{}),...(controls.category?{category:controls.category}:{})});
 const local=localFilters.success?filterTourism(account.demo?.listings??[],localFilters.data,new Date()).rows:[];
 const sorted=rankTourism([...rows,...local],controls.query).sort((a,b)=>sort==="name"?a.activity.title_ar.localeCompare(b.activity.title_ar,"ar"):sort==="region"?a.location_label_ar.localeCompare(b.location_label_ar,"ar"):0);
 const idle=featured && !Object.values(controls).some(Boolean);
 const chips=[
  controls.query && {key:"query" as const,label:controls.query},
  controls.location_id && {key:"location_id" as const,label:tourismLocations[controls.location_id as keyof typeof tourismLocations]??controls.location_id},
  controls.tag && {key:"tag" as const,label:discoveryLabels[controls.tag as keyof typeof discoveryLabels]??controls.tag},
  controls.listing_kind && {key:"listing_kind" as const,label:kindLabels[controls.listing_kind as keyof typeof kindLabels]??controls.listing_kind},
  controls.category && {key:"category" as const,label:categoryLabels[controls.category as keyof typeof categoryLabels]??controls.category},
  controls.party_size && {key:"party_size" as const,label:`${controls.party_size} أشخاص`},
  controls.group_type && {key:"group_type" as const,label:({family:"العائلة",friends:"الأصدقاء",couple:"شخصان",solo:"فردي"} as Record<string,string>)[controls.group_type]??controls.group_type},
  controls.budget && {key:"budget" as const,label:`ميزانية ${controls.budget} د.أ`},
 ].filter((chip): chip is {key:keyof Controls;label:string} => Boolean(chip));
 return <>
  {featured && <section className="category-section" aria-labelledby="category-title"><div className="section-heading"><div><span className="eyebrow">على مزاجك</span><h2 id="category-title">أي طلعة تشبهك اليوم؟</h2></div><p>اختَر اهتمامك، واكتشف طريقًا جديدًا.</p></div><div className="category-grid">{categories.map(({label,tag,Icon})=><button className={`category-tile ${controls.tag===tag?"selected":""}`} type="button" key={tag} onClick={()=>shortcut({tag})} aria-pressed={controls.tag===tag}><Icon size={29} strokeWidth={1.4} aria-hidden="true"/><span>{label}</span><ArrowUpLeft size={15} aria-hidden="true"/></button>)}</div></section>}
  <section id="tourism" className="tourism-section" aria-labelledby="tourism-title">
   <div className="section-heading"><div><span className="eyebrow">مكان جديد. حكاية جديدة.</span><h2 id="tourism-title">اكتشف الأردن، بطريقتك.</h2></div><span className="muted">{meta.total || "…"} وجهة وتجربة</span></div>
   <form className={`discovery-form tourism-form ${filtersOpen?"filters-open":""}`} onSubmit={(event)=>{submit(event);setFiltersOpen(false);}} noValidate>
    <button type="button" className="filter-drawer-toggle" onClick={()=>setFiltersOpen(v=>!v)}><SlidersHorizontal size={16} aria-hidden="true"/>{filtersOpen?"إغلاق التصفية":"تصفية النتائج"}</button>
    <fieldset disabled={pending} className="filters-panel"><label htmlFor="tourism-query" className="sr-only">ما الذي تريد اكتشافه؟</label><div className="search-line"><Search size={21} aria-hidden="true"/><Input id="tourism-query" value={controls.query} maxLength={1000} onChange={e=>setControls({...controls,query:e.target.value})} placeholder="أكواخ وإطلالات، آثار وحكايات، أو يوم على البحر…"/><Button type="submit">استكشف الوجهات<ArrowUpLeft size={17} aria-hidden="true"/></Button></div>
    <div className="search-controls quick-controls"><div><label htmlFor="tourism-location">المدينة / المنطقة</label><select id="tourism-location" value={controls.location_id} onChange={e=>apply({...controls,location_id:e.target.value})}><option value="">كل الأردن</option>{Object.entries(tourismLocations).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div><div><label htmlFor="tourism-tag">اهتمامك</label><select id="tourism-tag" value={controls.tag} onChange={e=>apply({...controls,tag:e.target.value})}><option value="">كل الاهتمامات</option>{Object.entries(discoveryLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div><div><label htmlFor="tourism-sort">ترتيب النتائج</label><select id="tourism-sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="relevant">الأكثر صلة</option><option value="name">الاسم</option><option value="region">المنطقة</option></select></div></div>
    <details className="advanced-filters"><summary><SlidersHorizontal size={16} aria-hidden="true"/>المزيد من الخيارات · الميزانية والمجموعة</summary><div className="search-controls tourism-controls"><div><label htmlFor="tourism-kind">نوع القائمة</label><select id="tourism-kind" value={controls.listing_kind} onChange={e=>apply({...controls,listing_kind:e.target.value})}><option value="">كل الأنواع</option>{Object.entries(kindLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div><div><label htmlFor="tourism-category">التصنيف</label><select id="tourism-category" value={controls.category} onChange={e=>apply({...controls,category:e.target.value})}><option value="">كل التصنيفات</option>{Object.entries(categoryLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div><div><label htmlFor="tourism-party">عدد الأشخاص (اختياري)</label><Input id="tourism-party" type="number" min={1} max={30} value={controls.party_size} onChange={e=>setControls({...controls,party_size:e.target.value})}/></div><div><label htmlFor="tourism-group">نوع المجموعة</label><select id="tourism-group" value={controls.group_type} onChange={e=>apply({...controls,group_type:e.target.value})}><option value="">بدون تحديد</option><option value="friends">أصدقاء</option><option value="family">عائلة</option><option value="couple">شخصان</option><option value="solo">فردي</option></select></div><div><label htmlFor="tourism-budget">ميزانية المجموعة · دينار</label><Input id="tourism-budget" inputMode="decimal" value={controls.budget} onChange={e=>setControls({...controls,budget:e.target.value})}/></div></div><p className="detail-note">الميزانية للنشاط فقط. التقديرات التجريبية لا تضمن مطابقتها.</p><Button type="submit">تطبيق الخيارات</Button></details>
    {chips.length>0 && <div className="filter-chips">{chips.map(chip=><button type="button" key={chip.key} className="filter-chip" onClick={()=>apply({...controls,[chip.key]:""})}>{chip.label} ×</button>)}</div>}
    <div className="filter-reset"><Button type="button" className="secondary" onClick={()=>{apply({...blank});setFiltersOpen(false);}}>مسح التصفية</Button><a href="#discover" className="text-link">تريد اقتراحًا محسوبًا لمجموعتك؟ ↗</a></div>
   </fieldset></form>
   <div id="tourism-results" aria-live="polite" aria-busy={pending}>{!idle && pending && <div className="experience-grid loading-grid" role="status" aria-label="جارٍ تحميل الوجهات">{[1,2,3].map(n=><div key={n} className="card-skeleton"/>)}</div>}{error && <div role="alert" className="notice error">{error}<Button type="button" onClick={()=>{setError("");setPending(true);setRetry(n=>n+1);}}>حاول مجددًا</Button></div>}
    {!idle && !pending && !error && <><div className="tourism-result-count"><span>{sorted.length} نتيجة لطلعتك</span><span>خيارات على ذوقك</span></div>{meta.unconfirmed_count>0 && <p className="detail-note">{meta.unconfirmed_count} قائمة لم تؤكد السعر أو السعة المطلوبة.</p>}{sorted.length===0 && <div className="empty-state"><Mountain size={35} aria-hidden="true"/><h3>لنوسّع دائرة الاكتشاف قليلًا.</h3><p>لم نفترض سعرًا أو سعة غير معروفة. جرّب منطقة أو اهتمامًا آخر.</p><Button type="button" onClick={()=>apply({...blank})}>عرض الوجهات دون شروط</Button></div>}<div className="experience-grid compact-grid reveal-grid">{(showAll?sorted:sorted.slice(0,featured?6:9)).map(row=><TourismCard key={row.activity.id} row={row} party={party} demo={meta.data_mode==="seed"}/>)}</div>{sorted.length>(featured?6:9) && <div className="center"><Button type="button" className="secondary" onClick={()=>setShowAll(n=>!n)}>{showAll?"عرض أقل":`استكشف كل النتائج (${sorted.length})`}</Button></div>}</>}
   </div>
  </section>
  {featured && <section className="region-section" aria-labelledby="region-title"><div className="section-heading"><div><span className="eyebrow">من الشمال للجنوب</span><h2 id="region-title">كل منطقة، إلها حكاية.</h2></div><p>مدن عتيقة، غابات خضراء، وصحراء بلا حدود.</p></div><div className="region-grid">{regions.map(id=>{const matches=catalog.filter(r=>r.activity.location_id===id),row=matches.find(r=>r.image);return <div className="region-tile" key={id}><button type="button" onClick={()=>shortcut({location_id:id})}><div className="region-art">{row?<TourismMedia row={row}/>:<MapPin size={35} aria-hidden="true"/>}</div><span><strong>{tourismLocations[id as keyof typeof tourismLocations]}</strong><small>{catalog.length?`${matches.length} قوائم`:"…"}</small></span><ArrowUpLeft size={18} aria-hidden="true"/></button>{row && <ImageCredit row={row}/>}</div>;})}</div></section>}
 </>;
}
