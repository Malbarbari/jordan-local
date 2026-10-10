"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TourismResponseSchema, type TourismListing } from "@/contracts/tourism";
import { TourismCard } from "./tourism-explorer";

const POPULAR = new Set(["petra", "wadi-rum", "jerash", "dead-sea", "amman"]);
const HIDDEN = new Set(["umm-qais", "dana", "ajloun", "wadi-mujib", "as-salt", "madaba"]);

function pick(rows: TourismListing[], match: (row: TourismListing) => boolean, limit: number) {
  const used = new Set<string>();
  const selected: TourismListing[] = [];
  for (const row of rows) {
    if (selected.length >= limit || used.has(row.activity.id) || !match(row)) continue;
    used.add(row.activity.id);
    selected.push(row);
  }
  return selected;
}

export default function HomeShowcase() {
  const [rows, setRows] = useState<TourismListing[]>([]);
  const [mode, setMode] = useState("seed");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tourism", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const parsed = TourismResponseSchema.parse(await response.json());
        setRows(parsed.data);
        setMode(parsed.meta.data_mode);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  const popular = pick(rows, (row) => row.metadata.listing_kind === "destination" && POPULAR.has(row.activity.location_id), 4);
  const gems = pick(
    rows,
    (row) =>
      HIDDEN.has(row.activity.location_id) &&
      (row.metadata.listing_kind === "destination" || row.metadata.listing_kind === "visitable_place") &&
      !popular.some((item) => item.activity.id === row.activity.id),
    4,
  );
  const recommended = pick(
    rows,
    (row) => row.metadata.listing_kind === "activity" || row.metadata.discovery_tags.includes("hiking") || row.metadata.discovery_tags.includes("adventure"),
    3,
  );
  const offers = pick(rows, (row) => row.metadata.listing_kind === "business_offer" && row.provider !== null, 3);
  const demo = mode === "seed";
  if (!rows.length) return null;
  return (
    <>
      {popular.length > 0 && (
        <section className="showcase-section" aria-labelledby="popular-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">وجهات معروفة</span>
              <h2 id="popular-title">أماكن يحب الناس يبدأوا منها</h2>
            </div>
            <Link className="text-link" href="/explore">كل الوجهات ↗</Link>
          </div>
          <p className="section-subtitle">اختيار تحريري من الوجهات العامة المصدرة، دون أرقام زيارة أو تقييمات مخترعة.</p>
          <div className="experience-grid compact-grid">{popular.map((row) => <TourismCard key={row.activity.id} row={row} party={null} demo={demo} />)}</div>
        </section>
      )}
      {gems.length > 0 && (
        <section className="showcase-section editorial-split" aria-labelledby="gems-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">بعيدًا عن الزحمة</span>
              <h2 id="gems-title">جواهر مخفية في الأردن</h2>
            </div>
            <p>غابات، قرى، ومسارات أقل ذكرًا — حسب البيانات المتوفرة لدينا.</p>
          </div>
          <div className="experience-grid compact-grid">{gems.map((row) => <TourismCard key={row.activity.id} row={row} party={null} demo={demo} />)}</div>
        </section>
      )}
      {recommended.length > 0 && (
        <section className="showcase-section" aria-labelledby="experiences-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">طلعات جاهزة للإلهام</span>
              <h2 id="experiences-title">تجارب تستاهل تجربها</h2>
            </div>
            <a className="text-link" href="#discover">خطّط حسب ميزانيتك ↗</a>
          </div>
          <div className="experience-grid compact-grid">{recommended.map((row) => <TourismCard key={row.activity.id} row={row} party={null} demo={demo} />)}</div>
        </section>
      )}
      {offers.length > 0 && (
        <section className="showcase-section" aria-labelledby="offers-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">من أهل المكان</span>
              <h2 id="offers-title">عروض أنشطة محلية</h2>
            </div>
            <Link className="text-link" href="/businesses">دليل المشاريع ↗</Link>
          </div>
          <div className="experience-grid compact-grid">{offers.map((row) => <TourismCard key={row.activity.id} row={row} party={null} demo={demo} />)}</div>
        </section>
      )}
    </>
  );
}
