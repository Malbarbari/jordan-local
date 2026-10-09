import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AccountProvider } from "@/components/account/context";
import { AccountNavigation, DemoBanner } from "@/components/account/navigation";
import { dataMode, hasSupabase } from "@/lib/runtime";
export const metadata: Metadata = { title: "Jordan Local | الأردن من زاوية أقرب", description: "اكتشف وجهات الأردن وتجارب أهله، وخطّط طلعتك بحسب اهتماماتك وميزانية مجموعتك." };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl">
            <body>
                <AccountProvider configured={dataMode()==="supabase" && hasSupabase()}>
                <a href="#main-content" className="skip-link">انتقل إلى المحتوى</a>
                <header className="site-header">
                    <Link href="/" className="brand"><span className="brand-symbol" aria-hidden="true">ج</span><span>جوردن لوكال<small lang="en" dir="ltr">JORDAN LOCAL</small></span></Link>
                    <AccountNavigation/>
                </header>
                <DemoBanner/><main className="shell" id="main-content">{children}</main>
                <footer className="shell site-footer"><div><strong>Jordan Local · الأردن من زاوية أقرب.</strong><p>أماكن تستاهل الزيارة، وتجارب محلية تستاهل تنعرف.</p></div><div className="footer-links"><Link href="/explore">استكشف الأردن</Link><Link href="/business">شارك تجربتك</Link><Link href="/#discover">خطّط طلعتك</Link></div><details className="footer-disclosure"><summary>عن النسخة الأولية والأسعار</summary><p>منصة اكتشاف دون حجز أو دفع. التقديرات التجريبية أمثلة افتراضية، والأسعار غير المعروفة ليست مجانية. التوصيات بالقواعد في الوضع الافتراضي؛ يظهر استخدام الذكاء الاصطناعي عند تفعيله. العروض الافتراضية غير قابلة للحجز. معاينة نموذج المنشأة مؤقتة عند غياب إعداد قاعدة البيانات. حقوق الصور متاحة في البطاقات والتفاصيل.</p></details></footer>
                </AccountProvider>
            </body>
        </html>
    );
}
