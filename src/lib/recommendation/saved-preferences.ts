import { LocationIdSchema, type Preferences } from "@/contracts";
import type { UserPreferences } from "@/contracts/settings";
// The expanded geography stays on /api/tourism. Never remap a saved city to another place.
export function savedPreferencesToOverrides(p: UserPreferences): Partial<Preferences> {
    if (p.preferred_cities.some(city => !LocationIdSchema.safeParse(city).success))
        throw new Error("بعض وجهاتك متاحة في استكشاف الأردن فقط. عدّل المدن للتخطيط بالميزانية.");
    return { party_size: p.preferred_group_size, budget_fils: p.preferred_budget_fils, budget_scope: "per_group", budget_basis: "activity_only", destination_location_ids: p.preferred_cities.map(city => LocationIdSchema.parse(city)), group_type: p.group_type, interests: p.preferred_categories };
}
