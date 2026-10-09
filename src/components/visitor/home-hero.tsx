"use client";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { ArrowUpLeft, Search, Compass, Sparkles } from "lucide-react";
const examples = [
 {label:"مكان هادئ بإربد",query:"بدي مكان هادئ بإربد",location_id:"irbid",tag:"nature"},
 {label:"4 صحاب · 60 دينار",query:"إحنا 4 صحاب بإربد، بدنا طلعة حلوة بميزانية 60 دينار",location_id:"irbid",tag:"nature"},
 {label:"أكواخ وإطلالات بالشمال",query:"وين في أكواخ وإطلالات قريبة من إربد؟",tag:"cabins"},
 {label:"مغامرة وهايكنغ",query:"بدي مغامرة وهايكنغ بميزانية 30 دينار",tag:"hiking"},
 {label:"طلعة رومانسية لشخصين",query:"اقترحلي طلعة رومانسية لشخصين",tag:"couples"},
 {label:"سباحة وطبيعة",query:"بدي أماكن سباحة وطبيعة بالأردن",tag:"swimming"},
];
export default function HomeHero() {
 const [query,setQuery]=useState("");
 function submit(event:FormEvent) {event.preventDefault();window.dispatchEvent(new CustomEvent("tourism-discover",{detail:{query}}));}
 return <section className="premium-hero" aria-labelledby="hero-title"><div className="hero-photograph"><Image src="/images/tourism/wadi-rum.jpg" alt="جبال وادي رم والرمال في جنوب الأردن" fill priority sizes="(max-width:1200px) 100vw, 1200px"/></div><div className="hero-shade"/>
  <div className="premium-hero-copy"><span className="hero-kicker"><Compass size={17} aria-hidden="true"/>الأردن، من زاوية أقرب</span><h1 id="hero-title">اكتشف الأردن<br/><em>على طريقتك</em></h1><p>أماكن مميزة، تجارب محلية، وطلعات تناسب ذوقك وميزانيتك.</p><form className="hero-search" onSubmit={submit}><label className="sr-only" htmlFor="hero-query">صِف الطلعة التي تريدها</label><Search size={21} aria-hidden="true"/><input id="hero-query" value={query} onChange={e=>setQuery(e.target.value)} maxLength={1000} placeholder="احكيلنا شو عبالك..."/><button className="button" type="submit">اكتشف طلعتك<ArrowUpLeft size={18} aria-hidden="true"/></button></form><div className="hero-examples"><span>شو رأيك بـ</span>{examples.map(example=><button type="button" key={example.label} onClick={()=>{setQuery(example.query);window.dispatchEvent(new CustomEvent("tourism-discover",{detail:{query:example.query,tag:example.tag,...("location_id" in example ? {location_id:example.location_id} : {})}}));}}>{example.label}</button>)}</div><a className="hero-planner" href="#discover"><Sparkles size={16} aria-hidden="true"/>اقترحلي تجربة ضمن ميزانية مجموعتي <ArrowUpLeft size={16} aria-hidden="true"/></a></div>
  <div className="hero-bottom"><span>01 / وادي رم <small>جنوب الأردن</small></span><details className="hero-credit"><summary>حقوق الصورة</summary><a href="https://commons.wikimedia.org/wiki/File:Wadi_Rum_03.jpg" target="_blank" rel="noopener noreferrer">Wadi Rum 03 — Bernard Gagnon · Wikimedia Commons</a><a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0 · صورة مصغرة وقصّ عرض متجاوب</a></details></div>
 </section>;
}
