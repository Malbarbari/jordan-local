"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";
import { beginDemo, demoEnabled, getMe, signIn } from "@/components/business/client";
import { useAccount } from "@/components/account/context";
export default function LoginPage() {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const { configured } = useAccount();
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError("");
        try {
            await signIn(String(form.get("email")), String(form.get("password")));
            const me = await getMe();
            router.replace(me.role === "business" ? "/business" : "/explore");
            router.refresh();
        }
        catch (error) {
            setError(error instanceof Error ? error.message : "Login failed");
        }
        finally {
            setPending(false);
        }
    }
    return <div className="narrow"><div className="page-intro"><span className="eyebrow">أهلًا بعودتك</span><h1>تسجيل الدخول</h1></div>{!configured && <div className="notice">العرض التجريبي لا يحتاج حسابًا. تسجيل الدخول والنشر الحقيقي يتطلبان إعداد Supabase.</div>}<p><Link href="/explore">استكشف الأنشطة دون تسجيل في العرض التجريبي</Link></p><p className="muted">حساب جديد؟ <Link href="/signup">انضم كفرد أو صاحب مشروع سياحي</Link></p>{demoEnabled && <div className="notice">عرض واجهة تجريبي بلا مصادقة حقيقية أو قاعدة بيانات.</div>}<Card><form onSubmit={submit} className="stack"><label htmlFor="email">البريد الإلكتروني</label><Input id="email" name="email" type="email" dir="ltr" autoComplete="username" required disabled={pending}/><label htmlFor="password">كلمة المرور</label><Input id="password" name="password" type="password" dir="ltr" autoComplete="current-password" required disabled={pending}/>{error && <p role="alert" className="error">{error}</p>}<Button disabled={pending || !configured}>{pending ? "جارٍ الدخول…" : "دخول"}</Button></form></Card>{demoEnabled && <Button onClick={() => { beginDemo(); router.push("/business"); }}>فتح العرض التجريبي دون كلمة مرور</Button>}</div>;
}
