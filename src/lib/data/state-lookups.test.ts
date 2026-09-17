import { describe, expect, it } from "vitest";
import { getPropertyTaxRate, PROPERTY_TAX_BY_STATE } from "./property-tax-by-state";
import { getInsuranceRate, INSURANCE_BY_STATE } from "./homeowners-insurance-by-state";

describe("state data lookups", () => {
  it("has property tax data for all 50 states plus DC", () => {
    expect(Object.keys(PROPERTY_TAX_BY_STATE).length).toBe(51);
  });

  it("has insurance data for all 50 states plus DC", () => {
    expect(Object.keys(INSURANCE_BY_STATE).length).toBe(51);
  });

  it("every property tax rate is a plausible positive fraction (0 < rate < 5%)", () => {
    for (const entry of Object.values(PROPERTY_TAX_BY_STATE)) {
      expect(entry.effectiveRatePct).toBeGreaterThan(0);
      expect(entry.effectiveRatePct).toBeLessThan(0.05);
    }
  });

  it("every entry carries a source and lastUpdated date for the methodology page", () => {
    for (const entry of Object.values(PROPERTY_TAX_BY_STATE)) {
      expect(entry.source).toBeTruthy();
      expect(entry.lastUpdated).toBeTruthy();
    }
    for (const entry of Object.values(INSURANCE_BY_STATE)) {
      expect(entry.source).toBeTruthy();
      expect(entry.lastUpdated).toBeTruthy();
    }
  });

  it("looks up by lowercase or uppercase state code", () => {
    expect(getPropertyTaxRate("tx").stateCode).toBe("TX");
    expect(getPropertyTaxRate("TX").stateCode).toBe("TX");
  });

  it("throws a clear error for an unknown state code rather than returning undefined silently", () => {
    expect(() => getPropertyTaxRate("ZZ")).toThrow(/ZZ/);
    expect(() => getInsuranceRate("ZZ")).toThrow(/ZZ/);
  });
});
