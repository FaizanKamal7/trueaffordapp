import { describe, expect, it } from "vitest";
import { getAutoSalesTaxRate, AUTO_SALES_TAX_BY_STATE } from "./auto-sales-tax-by-state";
import { getDefaultAutoLoanRate } from "./auto-loan-rates-by-credit-band";
import { CREDIT_BANDS } from "./pmi-rates";

const NO_SALES_TAX_STATES = ["AK", "DE", "MT", "NH", "OR"];

describe("auto sales tax data", () => {
  it("has data for all 50 states plus DC", () => {
    expect(Object.keys(AUTO_SALES_TAX_BY_STATE).length).toBe(51);
  });

  it("every rate is a plausible non-negative fraction (0 <= rate < 15%)", () => {
    for (const entry of Object.values(AUTO_SALES_TAX_BY_STATE)) {
      expect(entry.ratePct).toBeGreaterThanOrEqual(0);
      expect(entry.ratePct).toBeLessThan(0.15);
    }
  });

  it("every entry carries a source and lastUpdated date for the methodology page", () => {
    for (const entry of Object.values(AUTO_SALES_TAX_BY_STATE)) {
      expect(entry.source).toBeTruthy();
      expect(entry.lastUpdated).toBeTruthy();
    }
  });

  it("reflects the well-known sales-tax-free states as 0%", () => {
    for (const code of NO_SALES_TAX_STATES) {
      expect(getAutoSalesTaxRate(code).ratePct).toBe(0);
    }
  });

  it("looks up by lowercase or uppercase state code", () => {
    expect(getAutoSalesTaxRate("tx").stateCode).toBe("TX");
    expect(getAutoSalesTaxRate("TX").stateCode).toBe("TX");
  });

  it("throws a clear error for an unknown state code rather than returning undefined silently", () => {
    expect(() => getAutoSalesTaxRate("ZZ")).toThrow(/ZZ/);
  });
});

describe("auto loan rate data", () => {
  it("has a rate for every credit band", () => {
    for (const band of CREDIT_BANDS) {
      expect(getDefaultAutoLoanRate(band)).toBeGreaterThan(0);
    }
  });

  it("rates strictly increase as credit quality worsens", () => {
    const rates = CREDIT_BANDS.map((band) => getDefaultAutoLoanRate(band));
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThan(rates[i - 1]);
    }
  });

  it("the prime-to-subprime spread is dramatically wider than a typical mortgage spread (a real feature of auto lending)", () => {
    const primeRate = getDefaultAutoLoanRate("760+");
    const deepSubprimeRate = getDefaultAutoLoanRate("620-639");
    // Mortgage spread (see interest-rates-by-credit-band.ts) tops out around ~1.4 points; auto should be far wider.
    expect(deepSubprimeRate - primeRate).toBeGreaterThan(0.05);
  });
});
