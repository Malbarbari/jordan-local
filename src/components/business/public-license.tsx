"use client";
import { useEffect, useState } from "react";
import { api } from "@/components/account/context";
import { PublicBusinessSettingsSchema, licenseLabels } from "@/contracts/settings";
export default function PublicLicense({ id }: {
    id: string;
}) {
    const [label, setLabel] = useState("جارٍ قراءة تصريح الترخيص…");
    useEffect(() => { let active = true; api(`/api/businesses/${encodeURIComponent(id)}/settings`).then(value => { if (active)
        setLabel(value ? licenseLabels[PublicBusinessSettingsSchema.parse(value).license_status] : "لا توجد بيانات ترخيص مصرح بها لهذا الملف."); }).catch(() => { if (active)
        setLabel("تصريح الترخيص غير متاح الآن؛ هذا لا يثبت حالة الترخيص."); }); return () => { active = false; }; }, [id]);
    return <p className="notice" role="status">{label} · التصريح منفصل عن فحص مصدر معلومات العرض.</p>;
}
