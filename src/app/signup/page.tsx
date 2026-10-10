"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignupSchema } from "@/contracts/accounts";
import { createClient } from "@/lib/supabase/client";
import { useAccount, api } from "@/components/account/context";
export default function Signup() {
    const { configured, startDemo, refresh } = useAccount(), [role, setRole] = useState<"traveler" | "business">("traveler"), [pending, setPending] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState(""), router = useRouter();
    async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget), input = SignupSchema.safeParse({ display_name: f.get("display_name"), email: f.get("email"), password: f.get("password"), account_type: role }); setError(""); setMessage(""); if (!input.success) {
        setError("راجع الاسم والبريد، واستخدم كلمة مرور من 8 أحرف على الأقل.");
        return;
    } setPending(true); try {
        const { data, error } = await createClient().auth.signUp({ email: input.data.email, password: input.data.password, options: { data: { display_name: input.data.display_name, account_type: role }, emailRedirectTo: `${location.origin}/auth/callback` } });
        if (error)
            throw new Error("تعذّر إنشاء الحساب. راجع البريد أو حاول لاحقًا.");
        if (!data.session) {
            setMessage("راجع بريدك لتأكيد الحساب، ثم سجّل الدخول. لم يتم تسجيل دخولك بعد.");
            return;
        }
        await api("/api/account", "PATCH", { display_name: input.data.display_name, account_type: role });
        await refresh();
        router.push(role === "business" ? "/business/profile" : "/account");
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر التسجيل.");
    }
    finally {
        setPending(false);
    } }
    return <div className="narrow"><div className="page-intro"><span className="eyebrow">أهلًا فيك</span><h1>كيف حاب تستخدم Tashah؟</h1><p>اكتشف مكانك القادم، أو خلّي الناس تكتشف تجربتك.</p></div><div className="account-choices">{([["traveler", "بدي أكتشف أماكن وتجارب", "احفظ الأماكن وخطّط طلعتك."], ["business", "عندي شركة أو مشروع سياحي", "عرّف الناس بتجربتك المحلية."]] as const).map(([value, title, copy]) => <button type="button" key={value} aria-pressed={role === value} className={`account-choice ${role === value ? "selected" : ""}`} onClick={() => setRole(value)}><strong>{title}</strong><span>{copy}</span></button>)}</div>{configured ? <form className="card stack" onSubmit={submit}><label htmlFor="signup-name">اسمك</label><input id="signup-name" name="display_name" required minLength={2} maxLength={100} autoComplete="name"/><label htmlFor="signup-email">البريد الإلكتروني</label><input id="signup-email" name="email" type="email" dir="ltr" autoComplete="email" required/><label htmlFor="signup-password">كلمة المرور</label><input id="signup-password" name="password" type="password" dir="ltr" autoComplete="new-password" minLength={8} maxLength={128} required/><button className="button" disabled={pending}>{pending ? "جارٍ إنشاء الحساب…" : "إنشاء حساب"}</button></form> : <div className="card stack"><h2>جرّب الفكرة قبل التسجيل</h2><p>الحسابات الحقيقية تتطلب إعداد Supabase. هذه تجربة منفصلة تحفظ بيانات افتراضية على متصفحك فقط؛ لا تحتاج بريدًا أو كلمة مرور.</p><button className="button" onClick={() => { startDemo(role); router.push(role === "business" ? "/business/profile" : "/account"); }}>بدء تجربة محلية</button></div>}{message && <p role="status" className="notice">{message}</p>}{error && <p role="alert" className="error">{error}</p>}<p>عندك حساب؟ <Link href="/login">سجّل الدخول</Link></p></div>;
}
