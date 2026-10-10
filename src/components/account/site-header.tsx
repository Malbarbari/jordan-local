"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AccountNavigation } from "./navigation";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <Link href="/" className="brand" onClick={() => setOpen(false)}>
        <span className="brand-symbol" aria-hidden="true">ج</span>
        <span>طشه<small lang="en" dir="ltr">TASHAH</small></span>
      </Link>
      <button type="button" className="nav-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((value) => !value)}>
        {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        <span className="sr-only">{open ? "إغلاق القائمة" : "فتح القائمة"}</span>
      </button>
      <div id="site-nav" className={open ? "site-nav open" : "site-nav"} onClick={() => setOpen(false)}>
        <AccountNavigation />
      </div>
    </header>
  );
}
