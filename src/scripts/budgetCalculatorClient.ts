import { computeBudgetResults } from "../lib/state/computeBudgetResults";
import type { BudgetCalculatorResults } from "../lib/state/computeBudgetResults";
import { formatUSD, formatSignedUSD } from "../lib/format";
import { el, readScenarioFromForm, persistAndSyncUrl, restoreFromSessionStorage, debounce } from "../lib/domScenario";
import { scenarioToQueryString } from "../lib/state/serialize";
import type { ScenarioState } from "../lib/state/schema";

const DEBOUNCE_MS = 200;

function setBoundText(bindKey: string, text: string): void {
  document.querySelectorAll(`[data-bind="${bindKey}"]`).forEach((n) => {
    n.textContent = text;
  });
}

function barWidth(pct: number): number {
  return Math.max(0, Math.min(100, pct * 100));
}

function deltaText(delta: number): string {
  return delta > 0 ? `${formatUSD(delta)} over target` : `${formatUSD(Math.abs(delta))} under target`;
}

function renderBudgetResults(scenario: ScenarioState, results: BudgetCalculatorResults): void {
  const { budget } = results;

  const warning = el("housing-exceeds-warning");
  if (warning) warning.hidden = !budget.housingAloneExceedsNeedsTarget;

  setBoundText("needsActual", formatUSD(budget.needs));
  setBoundText("wantsActual", formatUSD(budget.wants));
  setBoundText("savingsActual", formatSignedUSD(budget.savings));

  setBoundText("needsDelta", deltaText(budget.needsDeltaDollars));
  setBoundText("wantsDelta", deltaText(budget.wantsDeltaDollars));
  setBoundText("savingsDelta", deltaText(budget.savingsDeltaDollars));

  const needsBar = el("bar-needs");
  if (needsBar) needsBar.style.width = `${barWidth(budget.needsPctOfNet)}%`;
  const wantsBar = el("bar-wants");
  if (wantsBar) wantsBar.style.width = `${barWidth(budget.wantsPctOfNet)}%`;
  const savingsBar = el("bar-savings");
  if (savingsBar) savingsBar.style.width = `${barWidth(Math.max(0, budget.savingsPctOfNet))}%`;

  const bhField = el<HTMLInputElement>("field-bh");
  if (bhField && document.activeElement !== bhField) {
    bhField.placeholder = String(Math.round(results.defaultHousingPayment));
  }
  const resetBtn = el<HTMLButtonElement>("reset-housing-payment");
  if (resetBtn) resetBtn.hidden = !results.isCustomHousingPayment;

  const shareInput = el<HTMLInputElement>("share-url");
  if (shareInput) {
    shareInput.value = `${window.location.origin}${window.location.pathname}${scenarioToQueryString(scenario)}`;
  }
}

export function initBudgetCalculator(): void {
  const form = document.getElementById("budget-form") as HTMLFormElement | null;
  const root = document.querySelector("[data-budget-calculator]");
  if (!form || !root) return;

  const recompute = () => {
    const scenario = readScenarioFromForm();
    const results = computeBudgetResults(scenario);
    renderBudgetResults(scenario, results);
    persistAndSyncUrl(scenario);
  };

  const debouncedRecompute = debounce(recompute, DEBOUNCE_MS);

  restoreFromSessionStorage(form);

  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("input", debouncedRecompute);
  form.addEventListener("change", debouncedRecompute);

  const bhField = document.getElementById("field-bh");
  bhField?.addEventListener("input", debouncedRecompute);

  const resetBtn = document.getElementById("reset-housing-payment");
  resetBtn?.addEventListener("click", () => {
    const field = document.getElementById("field-bh") as HTMLInputElement | null;
    if (field) field.value = "";
    recompute();
  });

  const copyBtn = document.getElementById("copy-share-link");
  copyBtn?.addEventListener("click", async () => {
    const shareInput = document.getElementById("share-url") as HTMLInputElement | null;
    const confirmation = document.getElementById("copy-confirmation");
    if (!shareInput) return;
    try {
      await navigator.clipboard.writeText(shareInput.value);
    } catch {
      shareInput.select();
      document.execCommand("copy");
    }
    if (confirmation) {
      confirmation.hidden = false;
      setTimeout(() => {
        confirmation.hidden = true;
      }, 2000);
    }
  });

  recompute();
}
