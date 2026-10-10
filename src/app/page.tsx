import Link from "next/link";
import { ArrowUpLeft, Compass, Users, Leaf } from "lucide-react";
import Explorer from "@/components/visitor/explorer";
import TourismExplorer from "@/components/visitor/tourism-explorer";
import BusinessDirectory from "@/components/business/directory";
import HomeHero from "@/components/visitor/home-hero";
export default function Home() {
 return <><HomeHero/><div className="value-strip"><span><Compass size={22} aria-hidden="true"/><strong>مكان جديد، على ذوقك</strong>من الوجهات المعروفة للدروب الأقل اكتشافًا</span><span><Users size={22} aria-hidden="true"/><strong>طلعة تجمع ناسك</strong>خطّط بحسب اهتماماتكم وميزانيتكم</span><span><Leaf size={22} aria-hidden="true"/><strong>تجارب من أهل المكان</strong>مساحة أكبر للأعمال المحلية</span></div><TourismExplorer featured/><BusinessDirectory featured/><Explorer/><section className="business-callout"><div><span className="eyebrow">صاحب مكان أو تجربة؟</span><h2>خلّي الناس تكتشف حكايتك.</h2><p>عرّف الزوار بتجربتك، وساعدهم يلاقوا طلعة تناسبهم.</p></div><Link href="/business" className="button">أضف تجربتك<ArrowUpLeft size={18} aria-hidden="true"/></Link></section></>;
}
