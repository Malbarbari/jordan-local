"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAccount, api } from "@/components/account/context";
import { ProfileInputSchema } from "@/contracts/accounts";
export default function Account() {
    const s = useAccount(), [message, setMessage] = useState(""), [error, setError] = useState(""), [pending, setPending] = useState(false);
    const profile = s.demo?.profile ?? s.account?.profile;
    async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget), input = ProfileInputSchema.safeParse({ display_name: f.get("display_name"), account_type: f.get("account_type") }); if (!input.success) {
        setError("راجع الاسم ونوع الحساب.");
        return;
    } setPending(true); setError(""); try {
        if (s.demo)
            s.saveDemo({ ...s.demo, profile: input.data });
        else {
            await api("/api/account", "PATCH", input.data);
            await s.refresh();
        }
        setMessage(s.demo ? "حُفظ الاسم في التجربة المحلية." : "حُفظ الملف الشخصي.");
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "لم يُحفظ الملف.");
    }
    finally {
        setPending(false);
    } }
    if (!s.ready)
        return <p role="status">جارٍ تحميل الحساب…</p>;
    if (!s.account && !s.demo)
        return <div className="narrow card"><h1>حسابك، وطلعتك القادمة</h1><Link className="button" href="/signup">أنشئ حسابًا أو جرّب محليًا</Link><Link href="/login">تسجيل الدخول</Link></div>;
    return <div className="narrow"><div className="page-intro"><h1>أهلًا، {profile?.display_name ?? "صديقنا"}</h1><p>أماكنك المفضلة، وتجاربك، بمكان واحد.</p></div><form className="card stack" key={profile?.display_name} onSubmit={submit}><label htmlFor="profile-name">الاسم</label><input id="profile-name" name="display_name" defaultValue={profile?.display_name ?? ""} required minLength={2} maxLength={100}/><label htmlFor="account-type">نوع الحساب</label><select id="account-type" name="account_type" defaultValue={profile?.account_type ?? "traveler"}><option value="traveler">فرد · استكشاف الأردن</option><option value="business">عمل سياحي · مشاركة التجارب</option></select><button className="button" disabled={pending}>حفظ الملف</button></form><div className="detail-links"><Link className="button secondary" href="/account/preferences">تفضيلات طلعتك</Link><Link className="button secondary" href="/saved">محفوظاتي</Link><Link className="button secondary" href="/business/profile">ملف مشروعي السياحي</Link><Link className="button secondary" href="/business/manage">إدارة القوائم</Link></div>{message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}</div>;
}
