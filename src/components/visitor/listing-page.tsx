"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Camera, Footprints, Landmark, Leaf, Sparkles, Waves, Tent } from "lucide-react";
import { TourismListingSchema, tourismLocations, type TourismListing } from "@/contracts/tourism";
import { emptyDetails, ListingDetailsSchema, type ListingDetails } from "@/contracts/listing-details";
import { kindLabels, type DiscoveryTag } from "@/contracts/catalog";
import { useAccount, api } from "@/components/account/context";
import { TourismMedia, ImageCredit } from "./tourism-presentation";
import { quoteCost, declaredCost } from "@/lib/tourism/cost";
import { jodToFils } from "@/components/business/form";
import ListingDialog from "./listing-dialog";

const units = { per_person: "للشخص", per_ticket: "للتذكرة", per_group: "للمجموعة", per_night: "للغرفة / الليلة", unspecified: "وحدة / فترة الفوترة تحتاج تأكيدًا" };
const audiences = { everyone: "الجميع", jordanian: "أردني", non_jordanian: "غير أردني", resident: "مقيم · راجع شروط المصدر", arab: "زائر عربي", international_overnight: "دولي مع إقامة في الأردن", international_day: "دولي دون إقامة", child_under_12: "طفل دون 12 سنة" };
const monthNames = ["كانون ٢", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين ١", "تشرين ٢", "كانون ١"];
const groupLabels = { family: "العائلة", friends: "الأصدقاء", couple: "شخصان", solo: "فردي" };
const activityVisuals: { tags: DiscoveryTag[]; label: string; Icon: typeof Leaf }[] = [
  { tags: ["hiking"], label: "هايكنغ", Icon: Footprints },
  { tags: ["swimming", "sea", "pools"], label: "سباحة", Icon: Waves },
  { tags: ["scenic"], label: "تصوير", Icon: Camera },
  { tags: ["nature"], label: "طبيعة", Icon: Leaf },
  { tags: ["adventure"], label: "مغامرة", Icon: Sparkles },
  { tags: ["historical", "cultural"], label: "استكشاف ثقافي", Icon: Landmark },
  { tags: ["wellness"], label: "استرخاء", Icon: Tent },
];

export default function ListingPage({ id }: { id: string }) {
  const s = useAccount();
  const [row, setRow] = useState<TourismListing | null>(null);
  const [details, setDetails] = useState<ListingDetails>(emptyDetails);
  const [related, setRelated] = useState<TourismListing[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(true);
  const [retry, setRetry] = useState(0);
  const [quoteId, setQuoteId] = useState("");
  const [people, setPeople] = useState(1);
  const [nights, setNights] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [budget, setBudget] = useState("");
  const [notice, setNotice] = useState("");
  const [photo, setPhoto] = useState(0);
  const [extras, setExtras] = useState<string[]>([]);

  useEffect(() => {
    const local = s.demo?.listings.find((item) => item.activity.id === id);
    if (local) {
      queueMicrotask(() => {
        setRow(local);
        setDetails(s.demo?.details[id] ?? emptyDetails);
        setPending(false);
        setError("");
      });
      return;
    }
    let active = true;
    api(`/api/listings/${encodeURIComponent(id)}`)
      .then((value) => {
        if (!active) return;
        setRow(TourismListingSchema.parse(value.listing));
        setDetails(ListingDetailsSchema.parse(value.details));
        setRelated(value.related.map((item: unknown) => TourismListingSchema.parse(item)));
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setPending(false);
      });
    return () => {
      active = false;
    };
  }, [id, s.demo, retry]);

  const quotes = details.quotes.filter((q) => !q.optional);
  const quote = quotes.find((q) => q.id === quoteId) ?? quotes[0];
  const baseTotal = quote ? quoteCost(quote, people, nights, rooms) : row ? declaredCost(row.activity, people) : null;
  const extraCosts = details.quotes.filter((q) => q.optional && extras.includes(q.id)).map((q) => quoteCost(q, people, nights, rooms));
  const total = baseTotal !== null && extraCosts.every((value) => value !== null) ? baseTotal + extraCosts.reduce<number>((sum, value) => sum + value!, 0) : null;
  const budgetFils = jodToFils(budget);

  async function share() {
    try {
      const url = location.href;
      if (navigator.share) await navigator.share({ title: row?.activity.title_ar, url });
      else await navigator.clipboard.writeText(url);
      setNotice("رابط المكان جاهز للمشاركة.");
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) setNotice("انسخ رابط الصفحة من شريط العنوان للمشاركة.");
    }
  }

  if (pending) return <p role="status" className="notice">جارٍ اكتشاف تفاصيل المكان…</p>;
  if (error || !row) {
    return (
      <div className="narrow card">
        <h1>لم نتمكن من عرض المكان</h1>
        <p role="alert">{error}</p>
        <button className="button" onClick={() => { setPending(true); setError(""); setRetry((value) => value + 1); }}>حاول مجددًا</button>
        <Link href="/explore">العودة للاستكشاف</Link>
      </div>
    );
  }

  const a = row.activity;
  const gallery = [...(row.image ? [row.image] : []), ...details.gallery].filter((item, index, all) => all.findIndex((entry) => entry.path === item.path) === index);
  const fallback = s.demo?.listings.some((item) => item.activity.id === id);
  const onSite = activityVisuals.filter((item) => item.tags.some((tag) => row.metadata.discovery_tags.includes(tag)));
  const current = gallery[photo];

  return (
    <article className="listing-page">
      <div className="detail-links">
        <Link href="/explore">← استكشف الأردن</Link>
        <button className="button secondary" onClick={() => void share()}>مشاركة المكان</button>
        <button className="button secondary" aria-pressed={s.favorites.includes(id)} onClick={() => void s.favorite(id).then(() => setNotice("تم تحديث المحفوظات.")).catch((err) => setNotice(err.message))}>
          {s.favorites.includes(id) ? "♥ محفوظ" : "♡ احفظ المكان"}
        </button>
      </div>
      {notice && <p role="status" className="notice">{notice}</p>}
      <div className="listing-cover">
        <TourismMedia row={row} priority />
        <div className="listing-cover-copy">
          <span className="eyebrow">{tourismLocations[a.location_id]} · {kindLabels[row.metadata.listing_kind]}</span>
          <h1>{a.title_ar}</h1>
        </div>
      </div>
      <div className="listing-title">
        {a.data_kind === "synthetic_demo" && <p className="notice compact-notice">نموذج تجريبي · لا يوجد حجز فعلي.</p>}
        {a.title_en && <p lang="en" dir="ltr">{a.title_en}</p>}
        <p>{a.description_ar}</p>
        {fallback && <span className="notice compact-notice">قائمة محفوظة في التجربة المحلية لهذا المتصفح فقط.</span>}
      </div>
      <div className="listing-columns">
        <section className="stack">
          {onSite.length > 0 && (
            <div className="card">
              <h2>شو ممكن تعمل هون؟</h2>
              <p className="detail-note">حسب وسوم هذه القائمة فقط، وليست قائمة شاملة لكل نشاط في المنطقة.</p>
              <div className="activity-visual-grid">
                {onSite.map((item) => (
                  <div className="activity-visual" key={item.label}>
                    <item.Icon size={22} aria-hidden="true" />
                    <strong>{item.label}</strong>
                    <span>في هذا المكان</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card">
            <h2>عن المكان</h2>
            {details.highlights.length > 0 && (
              <>
                <h3>ما الذي تكتشفه هنا؟</h3>
                <ul>{details.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
              </>
            )}
            {details.highlights.length === 0 && <p>التفاصيل الإضافية غير مكتملة بعد؛ راجع المصدر الرسمي قبل الزيارة.</p>}
          </div>
          {gallery.length > 0 && (
            <div className="card">
              <h2>صور المكان</h2>
              <div className="photo-thumbnails">
                {gallery.map((img, index) => (
                  <button className={photo === index ? "selected" : ""} key={img.path} onClick={() => setPhoto(index)} aria-label={`عرض الصورة ${index + 1}`} type="button">
                    <Image src={img.path} alt={img.alt_ar} width={240} height={160} />
                  </button>
                ))}
              </div>
              {current && (
                <ListingDialog title="صورة المكان" label="تكبير الصورة" className="button secondary">
                  <div className="gallery-large">
                    <Image src={current.path} alt={current.alt_ar} width={1000} height={700} />
                    <p>
                      <a target="_blank" rel="noopener noreferrer" href={current.source_url}>{current.author}</a>
                      {" · "}
                      <a href={current.license_url} target="_blank" rel="noopener noreferrer">{current.license}</a>
                      {" · "}
                      {current.changes}
                    </p>
                    {gallery.length > 1 && (
                      <div className="detail-links">
                        <button className="button secondary" type="button" onClick={() => setPhoto((value) => (value + gallery.length - 1) % gallery.length)}>السابقة</button>
                        <span>{photo + 1} / {gallery.length}</span>
                        <button className="button secondary" type="button" onClick={() => setPhoto((value) => (value + 1) % gallery.length)}>التالية</button>
                      </div>
                    )}
                  </div>
                </ListingDialog>
              )}
              <ImageCredit row={row} />
            </div>
          )}
          {row.provider && (
            <div className="card">
              <span className="eyebrow">تجربة من أهل المكان</span>
              <h2>{row.provider.name}</h2>
              <Link className="button secondary" href={`/businesses/${row.provider.id}`}>تعرف على المزود ↗</Link>
              {row.provider.website && <a className="text-link" href={row.provider.website} target="_blank" rel="noopener noreferrer">موقع المزود</a>}
            </div>
          )}
          <div className="card">
            <h2>معلومات عملية</h2>
            <ul className="practical-list">
              <li>الموقع: {tourismLocations[a.location_id]}</li>
              {a.duration_minutes ? <li>المدة: {a.duration_minutes} دقيقة</li> : null}
              {a.capacity_people ? <li>حتى {a.capacity_people} أشخاص حسب وصف القائمة</li> : null}
              {a.available_months?.length ? <li>موسم مذكور: {a.available_months.map((month) => monthNames[month - 1]).join("، ")}</li> : null}
              {a.group_types.length > 0 ? <li>يناسب: {a.group_types.map((group) => groupLabels[group]).join("، ")}</li> : null}
              {row.metadata.listing_kind === "destination" ? <li>وجهة عامة دون مالك تجاري خاص</li> : null}
            </ul>
            {details.practical.length > 0 && (
              <>
                <h3>قبل ما تطلع</h3>
                <ul>{details.practical.map((item) => <li key={item}>{item}</li>)}</ul>
              </>
            )}
            {row.coordinates ? (
              <a className="button" href={`https://www.google.com/maps/dir/?api=1&destination=${row.coordinates.latitude},${row.coordinates.longitude}`} target="_blank" rel="noopener noreferrer">الاتجاهات على خرائط Google ↗</a>
            ) : (
              <p>لم نضف نقطة وصول غير مؤكدة.</p>
            )}
            {a.source_url && <p><a href={a.source_url} target="_blank" rel="noopener noreferrer">المصدر والمعلومات الرسمية ↗</a></p>}
          </div>
        </section>
        <aside className="card cost-calculator">
          <span className="eyebrow">على قد ميزانيتك</span>
          <h2>احسب كلفة التجربة</h2>
          {quotes.length > 0 && (
            <>
              <label htmlFor="quote">فئة السعر</label>
              <select id="quote" value={quote?.id ?? ""} onChange={(e) => setQuoteId(e.target.value)}>
                {quotes.map((item) => <option key={item.id} value={item.id}>{item.label_ar} · {item.amount_fils / 1000} د.أ</option>)}
              </select>
              {quote && (
                <div className="quote-description">
                  <strong>{quote.amount_fils / 1000} د.أ · {units[quote.unit]}</strong>
                  <p>{quote.status === "demo_estimate" ? "تقدير تجريبي" : quote.status === "owner_declared" ? "سعر معلن من المزود" : "سعر منشور في المصدر"} · {audiences[quote.audience]}</p>
                  {quote.conditions.map((item) => <p className="detail-note" key={item}>{item}</p>)}
                  {quote.source_url && <a href={quote.source_url} target="_blank" rel="noopener noreferrer">مصدر السعر · {quote.checked_at?.slice(0, 10)}</a>}
                </div>
              )}
            </>
          )}
          <label htmlFor="cost-people">عدد الأشخاص من الفئة المختارة</label>
          <input id="cost-people" type="number" min={1} max={30} value={people} onChange={(e) => setPeople(Number(e.target.value))} />
          {quote?.unit === "per_night" && (
            <>
              <label htmlFor="cost-nights">عدد الليالي</label>
              <input id="cost-nights" type="number" min={1} max={30} value={nights} onChange={(e) => setNights(Number(e.target.value))} />
              <label htmlFor="cost-rooms">عدد الغرف / الأكواخ</label>
              <input id="cost-rooms" type="number" min={1} max={30} value={rooms} onChange={(e) => setRooms(Number(e.target.value))} />
              <p className="detail-note">عدد الغرف اختيارك؛ لا نفترض أنها تستوعب المجموعة.</p>
            </>
          )}
          {details.quotes.filter((item) => item.optional).map((item) => (
            <label className="optional-extra" key={item.id}>
              <input type="checkbox" checked={extras.includes(item.id)} onChange={(e) => setExtras((current) => e.target.checked ? [...current, item.id] : current.filter((value) => value !== item.id))} />
              {item.label_ar} · {item.amount_fils / 1000} د.أ {units[item.unit]}
              <small>{item.conditions.join(" ")}</small>
            </label>
          ))}
          <label htmlFor="cost-budget">ميزانية المجموعة (دينار · اختياري)</label>
          <input id="cost-budget" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} />
          <div className="cost-total" aria-live="polite">
            <span>مجموع البند المحدد</span>
            <strong>{total === null ? "تواصل لتأكيد الكلفة" : `${total / 1000} د.أ`}</strong>
            {total !== null && budget !== "" && budgetFils !== null && (
              <p>{total <= budgetFils ? "ضمن ميزانية هذا البند" : "يتجاوز ميزانية هذا البند"}{quote?.status === "demo_estimate" ? " · حسب التقدير فقط" : ""}</p>
            )}
          </div>
          <p className="detail-note">النقل والطعام والإضافات غير المسعّرة غير مشمولة، وليست مجانية. الحسبة ليست حجزًا.</p>
        </aside>
      </div>
      <section className="related-section">
        <h2>أماكن وتجارب قريبة في المنطقة</h2>
        <p>خيارات منفصلة في المنطقة؛ ليست بالضرورة أنشطة داخل هذا الموقع.</p>
        <div className="experience-grid compact-grid">
          {related.map((item) => (
            <Link className="card related-card" href={`/listings/${item.activity.id}`} key={item.activity.id}>
              <div className="related-art"><TourismMedia row={item} /></div>
              <h3>{item.activity.title_ar}</h3>
              <p>{tourismLocations[item.activity.location_id]}</p>
            </Link>
          ))}
        </div>
        <div className="detail-links">
          <Link className="button secondary" href={`/explore?tour_location_id=${a.location_id}`}>أماكن مشابهة بالمنطقة</Link>
          <Link className="button secondary" href="/explore?tour_tag=family">خيارات للعائلة</Link>
        </div>
      </section>
    </article>
  );
}
