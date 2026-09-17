import { DEFAULT_SCENARIO, isValidCarTermMonths, isValidCreditBand } from "./state/schema";
import type { ScenarioState } from "./state/schema";
import { encodeScenario, scenarioToQueryString } from "./state/serialize";

export const SESSION_KEY = "trueafford:scenario";

export function el<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function readNumberField(id: string, fallback: number): number {
  const input = el<HTMLInputElement>(id);
  if (!input) return fallback;
  const n = Number(input.value);
  return input.value !== "" && Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function readOptionalNumberField(id: string): number | undefined {
  const input = el<HTMLInputElement>(id);
  if (!input || input.value === "") return undefined;
  const n = Number(input.value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Reads the full shared ScenarioState from whatever fields exist in the
 * current page's DOM. Every calculator page shares this one reader —
 * pages that don't render a particular field (e.g. the amortization
 * page has no income fields) simply fall back to that field's default,
 * since `readNumberField`/`readOptionalNumberField` degrade gracefully
 * when an element is missing. This is what lets every page stay in sync
 * with the same shared state shape without each needing its own parser.
 */
export function readScenarioFromForm(): ScenarioState {
  const termInput = document.querySelector<HTMLInputElement>('input[name="tm"]:checked');
  const stateSelect = el<HTMLSelectElement>("field-st");
  const creditSelect = el<HTMLSelectElement>("field-cb");
  const irPct = readOptionalNumberField("field-ir");

  const carTermInput = document.querySelector<HTMLInputElement>('input[name="ctm"]:checked');
  const carCreditSelect = el<HTMLSelectElement>("field-ccb");
  const cirPct = readOptionalNumberField("field-cir");
  const carTermValue = carTermInput ? Number(carTermInput.value) : DEFAULT_SCENARIO.carTermMonths;

  return {
    grossAnnualIncome: readNumberField("field-gi", DEFAULT_SCENARIO.grossAnnualIncome),
    netMonthlyIncome: readNumberField("field-ni", DEFAULT_SCENARIO.netMonthlyIncome),
    otherMonthlyDebts: readNumberField("field-od", DEFAULT_SCENARIO.otherMonthlyDebts),
    childcare: readNumberField("field-ec", DEFAULT_SCENARIO.childcare),
    healthcare: readNumberField("field-eh", DEFAULT_SCENARIO.healthcare),
    groceries: readNumberField("field-eg", DEFAULT_SCENARIO.groceries),
    transport: readNumberField("field-et", DEFAULT_SCENARIO.transport),
    otherExpenses: readNumberField("field-eo", DEFAULT_SCENARIO.otherExpenses),
    stateCode: stateSelect?.value || DEFAULT_SCENARIO.stateCode,
    downPaymentDollars: readNumberField("field-dp", DEFAULT_SCENARIO.downPaymentDollars),
    interestRateOverride: irPct !== undefined ? irPct / 100 : undefined,
    creditBand: creditSelect && isValidCreditBand(creditSelect.value) ? creditSelect.value : DEFAULT_SCENARIO.creditBand,
    termYears: termInput?.value === "15" ? 15 : 30,
    hoaMonthly: readNumberField("field-hoa", DEFAULT_SCENARIO.hoaMonthly),
    evaluatedHomePrice: readOptionalNumberField("field-ep"),
    rentersInsuranceMonthly: readNumberField("field-ri", DEFAULT_SCENARIO.rentersInsuranceMonthly),
    utilitiesMonthly: readNumberField("field-ut", DEFAULT_SCENARIO.utilitiesMonthly),
    evaluatedRent: readOptionalNumberField("field-er"),
    budgetHousingOverride: readOptionalNumberField("field-bh"),
    tenureYears: readNumberField("field-ty", DEFAULT_SCENARIO.tenureYears),
    extraMonthlyPayment: readNumberField("field-xp", DEFAULT_SCENARIO.extraMonthlyPayment),
    carDownPaymentDollars: readNumberField("field-cdp", DEFAULT_SCENARIO.carDownPaymentDollars),
    carTradeInValueDollars: readNumberField("field-cti", DEFAULT_SCENARIO.carTradeInValueDollars),
    carTermMonths: isValidCarTermMonths(carTermValue) ? carTermValue : DEFAULT_SCENARIO.carTermMonths,
    carInterestRateOverride: cirPct !== undefined ? cirPct / 100 : undefined,
    carCreditBand: carCreditSelect && isValidCreditBand(carCreditSelect.value) ? carCreditSelect.value : DEFAULT_SCENARIO.carCreditBand,
    carInsuranceMonthly: readNumberField("field-cin", DEFAULT_SCENARIO.carInsuranceMonthly),
    evaluatedCarPrice: readOptionalNumberField("field-cep"),
  };
}

export function persistAndSyncUrl(scenario: ScenarioState): void {
  const qs = scenarioToQueryString(scenario);
  const newUrl = `${window.location.pathname}${qs}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", newUrl);
  try {
    sessionStorage.setItem(SESSION_KEY, encodeScenario(scenario).toString());
  } catch {
    // Session storage can be unavailable (private browsing, blocked storage) — non-fatal.
  }
}

/** Restores form field values from sessionStorage on a fresh, param-less visit (in-site navigation continuity). */
export function restoreFromSessionStorage(form: HTMLFormElement): void {
  if (window.location.search !== "") return;
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return;
    const params = new URLSearchParams(stored);
    params.forEach((value, key) => {
      const input = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${key}"]`);
      if (input) {
        if (input instanceof HTMLInputElement && input.type === "radio") {
          const radio = form.querySelector<HTMLInputElement>(`[name="${key}"][value="${value}"]`);
          if (radio) radio.checked = true;
        } else {
          input.value = value;
        }
        return;
      }
      // Fields like `ep`/`er`/`bh` that live outside <form> but are linked via the `form` attribute.
      const outside = document.querySelector<HTMLInputElement>(`[name="${key}"][form]`);
      if (outside) outside.value = value;
    });
  } catch {
    // Non-fatal — just skip restoring.
  }
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let handle: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => fn(...args), ms);
  };
}
