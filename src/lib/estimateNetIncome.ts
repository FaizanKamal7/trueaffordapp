/**
 * Illustrative take-home rate used only on programmatic pages (by-income,
 * by-state) where a visitor hasn't entered their actual net pay. Derived
 * from the site's own default scenario ($90k gross → $5,850/mo net =
 * 78%). This is a rough national estimate, not a tax calculation — every
 * generated page says so and links to the full calculator where a real
 * net-pay figure replaces it.
 */
export const ILLUSTRATIVE_TAKE_HOME_RATE = 0.78;

export function estimateNetMonthlyIncome(grossAnnualIncome: number): number {
  return (grossAnnualIncome * ILLUSTRATIVE_TAKE_HOME_RATE) / 12;
}
