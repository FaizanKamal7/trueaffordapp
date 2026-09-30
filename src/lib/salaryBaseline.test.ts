import { describe, expect, it } from "vitest";
import { salaryBaselineScenario, salaryFaqAnswer } from "./salaryBaseline";
import { computeResults } from "./state/computeResults";
import { formatUSD } from "./format";

describe("salaryFaqAnswer", () => {
  const scenario = salaryBaselineScenario(70_000);
  const results = computeResults(scenario);

  it("reaches all three tiers at $70,000 (the FAQ copy assumes it)", () => {
    expect(results.isUnaffordable).toBe(false);
    expect(results.comfortableMax).toBeGreaterThan(scenario.downPaymentDollars);
  });

  it.each(["en", "es"] as const)("quotes the same tier figures as /salary/70000/ (%s)", (locale) => {
    const answer = salaryFaqAnswer(70_000, locale);
    expect(answer).toContain(formatUSD(results.comfortableMax));
    expect(answer).toContain(formatUSD(results.stretchMax));
    expect(answer).toContain(formatUSD(results.riskyMax));
  });
});
