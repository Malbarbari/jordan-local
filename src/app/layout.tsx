import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AccountProvider } from "@/components/account/context";
import { DemoBanner } from "@/components/account/navigation";
import SiteHeader from "@/components/account/site-header";
import { dataMode, hasSupabase } from "@/lib/runtime";

export const metadata: Metadata = {
  title: "Jordan Local | الأردن من زاوية أقرب",
  description: "اكتشف وجهات الأردن وتجارب أهله، وخطّط طلعتك بحسب اهتماماتك وميزانية مجموعتك.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AccountProvider configured={dataMode() === "supabase" && hasSupabase()}>
          <a href="#main-content" className="skip-link">انتقل إلى المحتوى</a>
          <SiteHeader />
          <DemoBanner />
          <main className="shell" id="main-content">{children}</main>
          <footer className="shell site-footer">
            <div>
              <strong>Jordan Local · الأردن من زاوية أقرب.</strong>
              <p>أماكن تستاهل الزيارة، وتجارب محلية تستاهل تنعرف.</p>
            </div>
            <div className="footer-links">
              <Link href="/explore">استكشف الأردن</Link>
              <Link href="/businesses">المشاريع المحلية</Link>
              <Link href="/business">شارك تجربتك</Link>
              <Link href="/#discover">خطّط طلعتك</Link>
            </div>
            <details className="footer-disclosure">
              <summary>عن النسخة والأسعار</summary>
              <p>منصة اكتشاف دون حجز أو دفع. التقديرات التجريبية أمثلة افتراضية، والأسعار غير المعروفة ليست مجانية. التوصيات بالقواعد في الوضع الافتراضي؛ يظهر استخدام الذكاء الاصطناعي عند تفعيله. العروض الافتراضية غير قابلة للحجز.</p>
            </details>
          </footer>
        </AccountProvider>
      </body>
    </html>
  );
}
