import { DEFAULT_SCENARIO, type ScenarioState } from "./state/schema";
import { computeResults } from "./state/computeResults";
import { estimateNetMonthlyIncome } from "./estimateNetIncome";
import { getPropertyTaxRate } from "./data/property-tax-by-state";
import { formatUSD } from "./format";
import type { LocaleCode } from "../i18n/locales";

/**
 * The baseline household used by the /salary/[income]/ pages: the default
 * scenario with the given gross income and an illustrative take-home estimate.
 * Shared so any copy quoting "how much house on $X" matches those pages.
 */
export function salaryBaselineScenario(grossAnnualIncome: number): ScenarioState {
  return {
    ...DEFAULT_SCENARIO,
    grossAnnualIncome,
    netMonthlyIncome: estimateNetMonthlyIncome(grossAnnualIncome),
  };
}

/**
 * FAQ answer for "I make $X a year, how much house can I afford?", computed
 * from the same engine and baseline as /salary/[income]/ so the two never
 * disagree. Assumes all three tiers are reached at this income (true for the
 * $70,000 FAQ; covered by a unit test).
 */
export function salaryFaqAnswer(grossAnnualIncome: number, locale: LocaleCode): string {
  const scenario = salaryBaselineScenario(grossAnnualIncome);
  const results = computeResults(scenario);
  const income = formatUSD(grossAnnualIncome);
  const net = formatUSD(scenario.netMonthlyIncome);
  const debts = formatUSD(scenario.otherMonthlyDebts);
  const living = formatUSD(scenario.childcare + scenario.healthcare + scenario.groceries + scenario.transport + scenario.otherExpenses);
  const down = formatUSD(scenario.downPaymentDollars);
  const stateName = getPropertyTaxRate(scenario.stateCode).state;
  const comfortable = formatUSD(results.comfortableMax);
  const stretch = formatUSD(results.stretchMax);
  const risky = formatUSD(results.riskyMax);

  if (locale === "es") {
    return `Con los supuestos base de TrueAfford — unos ${net}/mes de ingreso neto estimado, ${debts}/mes en otros pagos de deuda, ${living}/mes en gastos de vida (incluido el cuidado infantil), un enganche de ${down} y un préstamo fijo a ${scenario.termYears} años con las tasas de impuesto predial y seguro de ${stateName} — un salario de ${income} alcanza aproximadamente ${comfortable} en el nivel Cómodo, ${stretch} en el nivel Ajustado y ${risky} en el techo Riesgoso, que es lo máximo que permitirían por sí solas las razones de deuda a ingreso de un prestamista. La amplitud del rango es intencional: Cómodo deja un colchón mensual real y Riesgoso no deja ninguno. Tus propias deudas, gastos, enganche y estado pueden mover mucho estas cifras, así que vale la pena ingresar tus números reales en la calculadora.`;
  }

  return `Using TrueAfford's baseline assumptions — about ${net}/month in estimated take-home pay, ${debts}/month in other debt payments, ${living}/month in living expenses (including childcare), a ${down} down payment, and a ${scenario.termYears}-year fixed loan at ${stateName} property tax and insurance rates — a ${income} salary works out to roughly ${comfortable} at the Comfortable tier, ${stretch} at Stretch, and ${risky} at the Risky ceiling, which is the most a lender's debt-to-income ratios alone would allow. The spread is deliberate: Comfortable leaves a real monthly cushion, Risky leaves none. Your own debts, expenses, down payment, and state can move these numbers a lot, so it's worth entering your actual figures into the calculator.`;
}
