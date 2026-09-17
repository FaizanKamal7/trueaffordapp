import { describe, expect, it } from "vitest";
import { encodeScenario, decodeScenario, scenarioToQueryString } from "./serialize";
import { DEFAULT_SCENARIO } from "./schema";
import type { ScenarioState } from "./schema";

describe("scenario round-trip", () => {
  it("encodes an all-default scenario as an empty query string", () => {
    expect(scenarioToQueryString(DEFAULT_SCENARIO)).toBe("");
  });

  it("round-trips a fully custom scenario exactly", () => {
    const custom: ScenarioState = {
      grossAnnualIncome: 120_000,
      netMonthlyIncome: 7_800,
      otherMonthlyDebts: 550,
      childcare: 1400,
      healthcare: 200,
      groceries: 700,
      transport: 450,
      otherExpenses: 100,
      stateCode: "CA",
      downPaymentDollars: 90_000,
      interestRateOverride: 0.0725,
      creditBand: "700-719",
      termYears: 15,
      hoaMonthly: 320,
      evaluatedHomePrice: 550_000,
      rentersInsuranceMonthly: 25,
      utilitiesMonthly: 175,
      evaluatedRent: 2_400,
      budgetHousingOverride: 2_100,
      tenureYears: 10,
      extraMonthlyPayment: 200,
      carDownPaymentDollars: 5_000,
      carTradeInValueDollars: 6_000,
      carTermMonths: 72,
      carInterestRateOverride: 0.09,
      carCreditBand: "660-679",
      carInsuranceMonthly: 150,
      evaluatedCarPrice: 32_000,
    };

    const decoded = decodeScenario(encodeScenario(custom));
    expect(decoded).toEqual(custom);
  });

  it("only serializes fields that differ from the default, keeping links short", () => {
    const nearlyDefault: ScenarioState = { ...DEFAULT_SCENARIO, stateCode: "NY" };
    const params = encodeScenario(nearlyDefault);
    expect(Array.from(params.keys())).toEqual(["st"]);
  });

  it("round-trips the interest rate as a human percent in the URL, decimal internally", () => {
    const state: ScenarioState = { ...DEFAULT_SCENARIO, interestRateOverride: 0.0675 };
    const params = encodeScenario(state);
    expect(params.get("ir")).toBe("6.75");
    expect(decodeScenario(params).interestRateOverride).toBeCloseTo(0.0675, 10);
  });

  it("never throws on garbage query params, falling back to defaults field by field", () => {
    const garbage = new URLSearchParams("gi=not-a-number&st=ZZ&cb=nonsense&tm=99&dp=-500&ir=abc");
    expect(() => decodeScenario(garbage)).not.toThrow();
    const decoded = decodeScenario(garbage);
    expect(decoded.grossAnnualIncome).toBe(DEFAULT_SCENARIO.grossAnnualIncome);
    expect(decoded.stateCode).toBe(DEFAULT_SCENARIO.stateCode);
    expect(decoded.creditBand).toBe(DEFAULT_SCENARIO.creditBand);
    expect(decoded.termYears).toBe(DEFAULT_SCENARIO.termYears);
    expect(decoded.downPaymentDollars).toBe(DEFAULT_SCENARIO.downPaymentDollars);
    expect(decoded.interestRateOverride).toBeUndefined();
  });

  it("round-trips the auto loan interest rate as a human percent in the URL, decimal internally", () => {
    const state: ScenarioState = { ...DEFAULT_SCENARIO, carInterestRateOverride: 0.1499 };
    const params = encodeScenario(state);
    expect(params.get("cir")).toBe("14.99");
    expect(decodeScenario(params).carInterestRateOverride).toBeCloseTo(0.1499, 10);
  });

  it("only accepts valid car loan terms (36/48/60/72), falling back to the default otherwise", () => {
    const valid = decodeScenario(new URLSearchParams("ctm=72"));
    expect(valid.carTermMonths).toBe(72);

    const invalid = decodeScenario(new URLSearchParams("ctm=61"));
    expect(invalid.carTermMonths).toBe(DEFAULT_SCENARIO.carTermMonths);
  });

  it("never throws on garbage car-related query params, falling back to defaults field by field", () => {
    const garbage = new URLSearchParams("ctm=nonsense&ccb=nonsense&cir=abc&cdp=-500");
    expect(() => decodeScenario(garbage)).not.toThrow();
    const decoded = decodeScenario(garbage);
    expect(decoded.carTermMonths).toBe(DEFAULT_SCENARIO.carTermMonths);
    expect(decoded.carCreditBand).toBe(DEFAULT_SCENARIO.carCreditBand);
    expect(decoded.carInterestRateOverride).toBeUndefined();
    expect(decoded.carDownPaymentDollars).toBe(DEFAULT_SCENARIO.carDownPaymentDollars);
  });

  it("handles an empty query string as all-defaults", () => {
    expect(decodeScenario(new URLSearchParams(""))).toEqual(DEFAULT_SCENARIO);
  });
});
