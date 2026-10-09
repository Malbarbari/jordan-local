import Dashboard from "@/components/business/dashboard";
import { dataMode } from "@/lib/runtime";
import Link from "next/link";
export default function BusinessPage() { return <><div className="notice"><strong>مشروعك السياحي يستاهل ينشاف.</strong><div className="detail-links"><Link className="button" href="/business/manage">لوحة المشروع</Link><Link className="button secondary" href="/business/profile">ملف المنشأة</Link><Link href="/signup">إنشاء حساب عمل</Link></div></div><Dashboard readOnly={dataMode() === "seed"}/></>; }
