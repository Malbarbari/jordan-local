import { PreferencesSchema, type RecommendRequest, type Preferences, type LocationId, type Category } from "@/contracts";
export const neutral: Preferences = { locale: "ar", budget_fils: null, budget_scope: null, budget_basis: "unclear", party_size: null, origin_location_id: null, destination_location_ids: [], max_straight_line_km: null, group_type: null, interests: [], environments: [], max_duration_minutes: null, month: null, requested_date: null };
export const cities: Record<LocationId, string> = { amman: "عمّان", irbid: "إربد", ajloun: "عجلون", jerash: "جرش", "umm-qais": "أم قيس", "as-salt": "السلط", madaba: "مادبا", dana: "ضانا", "wadi-rum": "وادي رم" };
const aliases: Record<LocationId, RegExp> = { amman: /عمان|عمّان|amman/i, irbid: /اربد|إربد|irbid/i, ajloun: /عجلون|ajloun/i, jerash: /جرش|jerash/i, "umm-qais": /أم قيس|ام قيس|umm qais/i, "as-salt": /السلط|as.?salt/i, madaba: /مادبا|madaba/i, dana: /ضانا|dana/i, "wadi-rum": /وادي رم|wadi rum/i };
function normalizeArabic(query: string) { return query.normalize("NFKC").replace(/[\u064b-\u065f\u0670]/g, "").replace(/[٠-٩۰-۹]/g, char => String(char.charCodeAt(0) - (char <= "٩" ? 0x660 : 0x6f0))).replace(/٫/g, "."); }
export function parseQuery(query: string): Partial<Preferences> {
    const q = normalizeArabic(query);
    const parsed: Partial<Preferences> = {};
    const destinations = (Object.entries(aliases) as [
        LocationId,
        RegExp
    ][]).filter(([, pattern]) => pattern.test(q)).map(([id]) => id);
    const from = q.match(/(?:من|from)\s+(إربد|اربد|irbid|عمان|عمّان|amman)/i);
    if (from) {
        parsed.origin_location_id = /irbid|اربد|إربد/i.test(from[1]) ? "irbid" : "amman";
        parsed.destination_location_ids = destinations.filter(id => id !== parsed.origin_location_id);
    }
    else if (destinations.length)
        parsed.destination_location_ids = destinations;
    const counts = q.match(/(?:نحن|إحنا|احنا|we are|عددنا)\s*(-?\d+(?:\.\d+)?)|(?:مجموعة من|group of|for)\s*(-?\d+(?:\.\d+)?)|(-?\d+(?:\.\d+)?)\s*(?:أشخاص|اشخاص|أصدقاء|اصدقاء|صحاب|people|persons|friends)/i);
    if (counts)
        parsed.party_size = Number(counts[1] ?? counts[2] ?? counts[3]);
    else if (/شخصين|شخصان|اثنين|إثنين|زوجين|two people/i.test(q))
        parsed.party_size = 2;
    else if (/أربعة|اربعة|four/i.test(q))
        parsed.party_size = 4;
    if (parsed.party_size != null && (!Number.isInteger(parsed.party_size) || parsed.party_size < 1 || parsed.party_size > 30)) parsed.party_size = null;
    const amount = q.match(/(?<![\d.])(-?\d+(?:\.\d+)?)\s*(?:دينار|دنانير|jod|jd)/i);
    if (amount) {
        const [whole, dec = ""] = amount[1].split(".");
        const fils = Number(whole) * 1000 + Number(dec.padEnd(3, "0"));
        parsed.budget_fils = !amount[1].startsWith("-") && dec.length <= 3 && Number.isSafeInteger(fils) && fils >= 0 && fils <= 10000000 ? fils : null;
        parsed.budget_scope = /لكل شخص|للشخص|per person|each/i.test(q) ? "per_person" : /للمجموعة|كلنا|معنا|إجمالي|اجمالي|total|whole group|group budget/i.test(q) ? "per_group" : null;
    }
    if (/رحلة كاملة|كل الرحلة|whole trip|transport|مواصلات/i.test(q))
        parsed.budget_basis = "whole_trip";
    else if (/نشاط فقط|الأنشطة فقط|activity.only/i.test(q))
        parsed.budget_basis = "activity_only";
    if (/عائلة|عائلي|عائلية|family|children|أطفال/i.test(q))
        parsed.group_type = "family";
    else if (/أصدقاء|اصدقاء|صحاب|friends/i.test(q))
        parsed.group_type = "friends";
    else if (/couple|زوجين|رومانسي/i.test(q))
        parsed.group_type = "couple";
    else if (/solo|وحدي/i.test(q)) {
        parsed.group_type = "solo";
        parsed.party_size = 1;
    }
    const interests: Category[] = [];
    if (/طبيعة|nature|forest|غابة/i.test(q))
        interests.push("nature");
    if (/مغامر|هايكن[قغج]|adventure|hik[ei]/i.test(q))
        interests.push("adventure");
    if (/طعام|اكل|أكل|food|baking|نكهات/i.test(q))
        interests.push("food");
    if (/ثقاف|فن|رسم|culture|art|mosaic/i.test(q))
        interests.push("culture");
    if (/تراث|heritage|history/i.test(q))
        interests.push("heritage");
    if (interests.length)
        parsed.interests = interests;
    return parsed;
}
export function normalize(request: RecommendRequest, extracted?: Preferences) {
    return PreferencesSchema.parse({ ...neutral, ...(extracted ?? parseQuery(request.query)), ...request.overrides, locale: request.locale });
}
export function questionsFor(p: Preferences, query: string, overrides: Partial<Preferences> = {}) {
    const questions: {
        key: string;
        prompt: string;
        choices: string[];
    }[] = [];
    if (p.party_size === null)
        questions.push({ key: "party_size", prompt: "كم شخصًا في المجموعة؟", choices: ["1", "2", "4", "6"] });
    if (p.budget_fils !== null && p.budget_scope === null)
        questions.push({ key: "budget_scope", prompt: "هل الميزانية للمجموعة أم لكل شخص؟", choices: ["per_group", "per_person"] });
    if (p.budget_fils !== null && p.budget_basis !== "activity_only")
        questions.push({ key: "budget_basis", prompt: "ما الميزانية المخصصة للنشاط فقط، دون المواصلات؟", choices: ["activity_only"] });
    if (!overrides.destination_location_ids?.length && /العقبة|عقبة|البتراء|بترا|البحر الميت|وادي الموجب|ماعين|معين|طبقة فحل|بيلا|الأغوار|الاغوار|جبل نيبو|المغطس|aqaba|petra|dead sea|mujib|pella|jordan valley|nebo|baptism|main hot springs/i.test(query))
        questions.push({ key: "destination_location_ids", prompt: "هذه الوجهة متاحة في استكشاف الأردن؛ توصيات الميزانية تدعم المدن التالية فقط.", choices: Object.keys(cities) });
    if (overrides.budget_fils === undefined && /\d\s*(?:دينار|دنانير|jod|jd)/i.test(normalizeArabic(query)) && p.budget_fils === null)
        questions.push({ key: "budget_basis", prompt: "أدخل ميزانية صحيحة للنشاط في حقل الميزانية، حتى ثلاث خانات عشرية.", choices: [] });
    if (overrides.budget_fils === undefined && p.budget_fils === null && /ميزانيتي قليلة|ميزانية قليلة|رخيص|اقتصادي|low budget|cheap/i.test(query))
        questions.push({ key: "budget_basis", prompt: "كم ميزانية النشاط؟ أدخل مبلغًا في حقل الميزانية لنلتزم بحدك.", choices: [] });
    const hardDistance = /driv|بالسيارة|كيلومتر|\bkm\b|minutes away/i.test(query);
    const explicitlyChoseCities = overrides.max_straight_line_km === null && Boolean(overrides.destination_location_ids?.length);
    if (p.max_straight_line_km !== null || (hardDistance && !explicitlyChoseCities) || (/قريب|nearby/i.test(query) && !p.destination_location_ids.length))
        questions.push({ key: "destination_location_ids", prompt: "اختر المدن المقبولة. لا نحسب مسافة الطريق أو وقت القيادة في هذه النسخة.", choices: Object.keys(cities) });
    return questions;
}
