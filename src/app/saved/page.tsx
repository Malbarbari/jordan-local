"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { useAccount,api } from "@/components/account/context";
import { TourismResponseSchema,type TourismListing } from "@/contracts/tourism";
import { TourismCard } from "@/components/visitor/tourism-explorer";
export default function Saved(){const s=useAccount(),[rows,setRows]=useState<TourismListing[]>([]),[error,setError]=useState(""),[pending,setPending]=useState(true);useEffect(()=>{api("/api/tourism").then(v=>setRows(TourismResponseSchema.shape.data.parse(v))).catch(e=>setError(e.message)).finally(()=>setPending(false));},[]);const listings=[...rows,...(s.demo?.listings??[])].filter(r=>s.favorites.includes(r.activity.id));return <><div className="page-intro"><h1>أماكن عبالك تزورها</h1><p>كل مكان حفظته، لطلعة قادمة.</p></div>{!s.account&&!s.demo?<Link className="button" href="/signup">سجّل أو جرّب محليًا للحفظ</Link>:pending?<p role="status">جارٍ تحميل المحفوظات…</p>:error?<p role="alert">{error}</p>:<>{listings.length===0&&<div className="card"><p>لسه ما حفظت مكانًا متاحًا. اختَر وجهة من الاستكشاف.</p><Link href="/explore">اكتشف الأماكن</Link></div>}<div className="experience-grid">{listings.map(row=><TourismCard row={row} party={null} demo={!s.configured} key={row.activity.id}/>)}</div></>}</>;}
