import { expect,it } from "vitest";
import { quickNatureDefaults } from "../../src/lib/recommendation/quick-defaults";
import { normalize,questionsFor } from "../../src/lib/recommendation/preferences";
it("supports the final Arabic demo with explicit UI defaults",()=>{const query="بدي طشّة طبيعة قريبة من عمّان بميزانية ٢٠ دينار";const overrides=quickNatureDefaults(query);const p=normalize({schema_version:1,locale:"ar",query,overrides});expect(p.budget_fils).toBe(20000);expect(p.party_size).toBe(1);expect(questionsFor(p,query,overrides)).toEqual([])});
it("does not replace a specified group or unrelated requests",()=>{expect(quickNatureDefaults("إحنا 4 صحاب بعمّان معنا 20 دينار")).toEqual({})});
