"use client";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { ArrowUpLeft, Search, Compass, Sparkles } from "lucide-react";

const examples = [
  { label: "بدي أكواخ بعجلون", query: "بدي أكواخ بعجلون", location_id: "ajloun", tag: "cabins" },
  { label: "طلعة حلوة بإربد", query: "طلعة حلوة بإربد", location_id: "irbid" },
  { label: "بدي هايكنق ومغامرة", query: "بدي هايكنق ومغامرة", tag: "hiking" },
  { label: "أماكن سباحة بالأردن", query: "أماكن سباحة بالأردن", tag: "swimming" },
  { label: "رحلة لشخصين بميزانية 50 دينار", query: "رحلة لشخصين بميزانية 50 دينار", party_size: "2", budget: "50", tag: "couples" },
  { label: "بدي أكتشف أماكن مش معروفة", query: "بدي أكتشف أماكن مش معروفة" },
];

export default function HomeHero() {
  const [query, setQuery] = useState("");
  function discover(detail: Record<string, string>) {
    window.dispatchEvent(new CustomEvent("tourism-discover", { detail }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    discover({ query });
  }
  return (
    <section className="premium-hero" aria-labelledby="hero-title">
      <div className="hero-photograph">
        <Image src="/images/tourism/wadi-rum.jpg" alt="جبال وادي رم والرمال في جنوب الأردن" fill priority sizes="(max-width:1200px) 100vw, 1280px" />
      </div>
      <div className="hero-shade" />
      <div className="premium-hero-copy">
        <span className="hero-kicker"><Compass size={17} aria-hidden="true" />الأردن، من زاوية أقرب</span>
        <h1 id="hero-title">اكتشف الأردن على طريقتك</h1>
        <p>أماكن مميزة، تجارب محلية، وطلعات تناسب ذوقك وميزانيتك.</p>
        <form className="hero-search" onSubmit={submit}>
          <label className="sr-only" htmlFor="hero-query">صِف الطلعة التي تريدها</label>
          <Search size={21} aria-hidden="true" />
          <input id="hero-query" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={1000} placeholder="احكيلنا شو عبالك اليوم..." />
          <button className="button" type="submit">اكتشف طلعتك<ArrowUpLeft size={18} aria-hidden="true" /></button>
        </form>
        <div className="hero-examples">
          <span>جرّب مثالًا</span>
          {examples.map((example) => (
            <button
              type="button"
              key={example.label}
              onClick={() => {
                setQuery(example.query);
                const detail = Object.fromEntries(
                  (Object.entries(example) as [string, string | undefined][])
                    .filter((entry): entry is [string, string] => entry[0] !== "label" && entry[1] !== undefined)
                );
                discover(detail);
              }}
            >
              {example.label}
            </button>
          ))}
        </div>
        <a className="hero-planner" href="#discover">
          <Sparkles size={16} aria-hidden="true" />اقترحلي تجربة ضمن ميزانية مجموعتي
          <ArrowUpLeft size={16} aria-hidden="true" />
        </a>
      </div>
      <div className="hero-bottom">
        <span>وادي رم <small>جنوب الأردن</small></span>
        <details className="hero-credit">
          <summary>حقوق الصورة</summary>
          <a href="https://commons.wikimedia.org/wiki/File:Wadi_Rum_03.jpg" target="_blank" rel="noopener noreferrer">Wadi Rum 03 — Bernard Gagnon · Wikimedia Commons</a>
          <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0 · صورة مصغرة وقصّ عرض متجاوب</a>
        </details>
      </div>
    </section>
  );
}
