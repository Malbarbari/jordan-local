"use client";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "./context";

export function AccountNavigation() {
  const { account, demo, logout } = useAccount();
  const [error, setError] = useState("");
  return (
    <nav aria-label="التنقل الرئيسي">
      <Link href="/explore">استكشف</Link>
      <Link href="/businesses">المشاريع</Link>
      <Link href="/business">للأعمال</Link>
      {account || demo ? (
        <>
          <Link href="/saved">محفوظاتي</Link>
          <Link href="/account">حسابي</Link>
          <button className="text-link" onClick={() => void logout().catch((e) => setError(e.message))}>خروج</button>
        </>
      ) : (
        <>
          <Link href="/login">دخول</Link>
          <Link href="/signup" className="nav-cta">انضم إلينا</Link>
        </>
      )}
      {error && <span role="alert">{error}</span>}
    </nav>
  );
}

export function DemoBanner() {
  const { demo, error } = useAccount();
  return (
    <>
      {demo && (
        <div className="demo-banner">
          تجربة محلية على هذا المتصفح فقط. <Link href="/account">إدارة التجربة</Link>
        </div>
      )}
      {error && <div className="notice error" role="alert">{error}</div>}
    </>
  );
}
