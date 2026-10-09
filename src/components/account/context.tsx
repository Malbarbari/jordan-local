"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { z } from "zod";
import { ProfileInputSchema, BusinessInputSchema } from "@/contracts/accounts";
import { TourismListingSchema } from "@/contracts/tourism";
import { ListingDetailsSchema, type ListingDetails } from "@/contracts/listing-details";
import { createClient } from "@/lib/supabase/client";
type Profile = z.infer<typeof ProfileInputSchema>;
const DemoSchema = z.strictObject({ profile: ProfileInputSchema, business: BusinessInputSchema.nullable(), listings: z.array(TourismListingSchema).max(100), details: z.record(z.uuid(), ListingDetailsSchema), favorites: z.array(z.uuid()).max(500) });
type Demo = z.infer<typeof DemoSchema>;
type Account = {
    user_id: string;
    profile: Profile | null;
    business: {
        id: string;
        name: string;
    } | null;
};
const key = "jordan-local-local-demo-v2";
export async function api(path: string, method = "GET", input?: unknown) { const r = await fetch(path, { method, cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(15000), ...(input !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) } : {}) }); const value = await r.json(); if (!r.ok)
    throw new Error(value.error?.message ?? "تعذّر إتمام الطلب."); return value.data; }
type State = {
    configured: boolean;
    account: Account | null;
    demo: Demo | null;
    details: Record<string, ListingDetails>;
    ready: boolean;
    error: string;
    refresh: () => Promise<void>;
    startDemo: (role: "traveler" | "business") => void;
    saveDemo: (value: Demo) => void;
    logout: () => Promise<void>;
    favorite: (id: string) => Promise<void>;
    favorites: string[];
};
const Context = createContext<State | null>(null);
export function AccountProvider({ children, configured }: {
    children: ReactNode;
    configured: boolean;
}) {
    const [account, setAccount] = useState<Account | null>(null), [demo, setDemo] = useState<Demo | null>(null), [details, setDetails] = useState<Record<string, ListingDetails>>({}), [favorites, setFavorites] = useState<string[]>([]), [ready, setReady] = useState(false), [error, setError] = useState("");
    const refresh = useCallback(async () => { if (!configured)
        return; try {
        setError("");
        const { data: { user }, error } = await createClient().auth.getUser();
        if (error && !user) {
            setAccount(null);
            setFavorites([]);
            return;
        }
        if (!user) {
            setAccount(null);
            setFavorites([]);
            return;
        }
        const value = await api("/api/account");
        setAccount(value);
        setFavorites(await api("/api/favorites"));
    }
    catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر تحميل الحساب.");
    }
    finally {
        setReady(true);
    } }, [configured]);
    useEffect(() => { queueMicrotask(() => { if (!configured) {
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = DemoSchema.safeParse(JSON.parse(raw));
                if (parsed.success)
                    setDemo(parsed.data);
            }
        }
        catch { }
        setReady(true);
    }
    else
        void refresh(); }); const controller = new AbortController(); fetch("/api/listing-details", { signal: controller.signal }).then(async (r) => { if (r.ok)
        setDetails(z.record(z.uuid(), ListingDetailsSchema).parse((await r.json()).data)); }).catch(() => { }); if (!configured)
        return () => controller.abort(); const { data } = createClient().auth.onAuthStateChange(() => { setTimeout(() => void refresh(), 0); }); return () => { controller.abort(); data.subscription.unsubscribe(); }; }, [configured, refresh]);
    function saveDemo(value: Demo) { if (configured)
        throw new Error("التجربة المحلية غير متاحة في الوضع الحقيقي."); const parsed = DemoSchema.parse(value); localStorage.setItem(key, JSON.stringify(parsed)); setDemo(parsed); }
    function startDemo(role: "traveler" | "business") { saveDemo({ profile: { display_name: "زائر تجريبي", account_type: role }, business: null, listings: [], details: {}, favorites: [] }); }
    async function logout() { if (demo) {
        localStorage.removeItem(key);
        setDemo(null);
        return;
    } if (configured) {
        const { error } = await createClient().auth.signOut();
        if (error)
            throw new Error("تعذّر تسجيل الخروج.");
        setAccount(null);
        setFavorites([]);
    } }
    async function favorite(id: string) { if (demo) {
        saveDemo({ ...demo, favorites: demo.favorites.includes(id) ? demo.favorites.filter(v => v !== id) : [...demo.favorites, id] });
        return;
    } if (!account)
        throw new Error("سجّل الدخول لحفظ المكان."); await api(`/api/favorites${favorites.includes(id) ? `/${id}` : ""}`, favorites.includes(id) ? "DELETE" : "POST", favorites.includes(id) ? undefined : { listing_id: id }); setFavorites(v => v.includes(id) ? v.filter(n => n !== id) : [...v, id]); }
    return <Context.Provider value={{ configured, account, demo, details: { ...details, ...demo?.details }, ready, error, refresh, startDemo, saveDemo, logout, favorite, favorites: demo?.favorites ?? favorites }}>{children}</Context.Provider>;
}
export function useAccount() { const state = useContext(Context); if (!state)
    throw new Error("AccountProvider missing"); return state; }
