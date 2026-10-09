import ok from "../../docs/examples/recommend-success.json";
import clarification from "../../docs/examples/recommend-clarification.json";
import noMatch from "../../docs/examples/recommend-no_match.json";
import degraded from "../../docs/examples/recommend-degraded.json";
import { RecommendResponseSchema } from "./index";
// Synthetic contract fixtures; never use as a silent production fallback.
export const okFixture = RecommendResponseSchema.parse(ok);
export const clarificationFixture = RecommendResponseSchema.parse(clarification);
export const noMatchFixture = RecommendResponseSchema.parse(noMatch);
export const degradedFixture = RecommendResponseSchema.parse(degraded);
export const sharedSyntheticFixture = okFixture.recommendations[0].activity;
export const responseFixtures = { ok: okFixture, clarification: clarificationFixture, no_match: noMatchFixture, degraded: degradedFixture };
