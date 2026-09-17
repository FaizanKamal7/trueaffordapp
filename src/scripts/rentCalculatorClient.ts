import { computeRentResults } from "../lib/state/computeRentResults";
import type { RentCalculatorResults } from "../lib/state/computeRentResults";
import { formatUSD, formatSignedUSD } from "../lib/format";
import { el, readScenarioFromForm, persistAndSyncUrl, restoreFromSessionStorage, debounce } from "../lib/domScenario";
import { scenarioToQueryString } from "../lib/state/serialize";
import type { ScenarioState } from "../lib/state/schema";

const DEBOUNCE_MS = 200;

const ruleLabels: Record<string, string> = {
  income: "30% of gross income",
  screening: "40x annual income (landlord screening)",
  leftover: "Leftover income after real expenses",
};

function setBoundText(bindKey: string, text: string): void {
  document.querySelectorAll(`[data-bind="${bindKey}"]`).forEach((n) => {
    n.textContent = text;
  });
}

function renderRentResults(scenario: ScenarioState, results: RentCalculatorResults): void {
  const { rentAffordability } = results;

  setBoundText("maxAffordableRent", formatUSD(rentAffordability.maxAffordableRent));
  setBoundText("bindingRule", ruleLabels[rentAffordability.bindingRule]);
  setBoundText("incomeRule", formatUSD(rentAffordability.maxRentByIncomeRule));
  setBoundText("screeningRule", formatUSD(rentAffordability.maxRentByScreeningRule));
  setBoundText("leftoverRule", formatUSD(rentAffordability.maxRentByLeftoverRule));

  document.querySelectorAll<HTMLElement>("[data-rule]").forEach((row) => {
    row.classList.toggle("rule-binding", row.dataset.rule === rentAffordability.bindingRule);
  });

  const erField = el<HTMLInputElement>("field-er");
  if (erField && document.activeElement !== erField) {
    erField.placeholder = String(rentAffordability.maxAffordableRent);
  }
  const resetBtn = el<HTMLButtonElement>("reset-evaluated-rent");
  if (resetBtn) resetBtn.hidden = !results.isCustomEvaluatedRent;

  const leftoverCallout = el("rent-leftover-callout");
  if (leftoverCallout) {
    leftoverCallout.classList.toggle("callout-positive", !results.isOverBudgetAtEvaluatedRent);
    leftoverCallout.classList.toggle("callout-negative", results.isOverBudgetAtEvaluatedRent);
  }
  setBoundText("leftoverAmount", formatSignedUSD(results.leftoverAtEvaluatedRent));
  const message = el("rent-leftover-message");
  if (message) {
    message.textContent = results.isOverBudgetAtEvaluatedRent
      ? "This rent is above what this household can sustainably afford by any of the three rules."
      : "This rent clears all three affordability rules.";
  }

  const shareInput = el<HTMLInputElement>("share-url");
  if (shareInput) {
    shareInput.value = `${window.location.origin}${window.location.pathname}${scenarioToQueryString(scenario)}`;
  }
}

export function initRentCalculator(): void {
  const form = document.getElementById("rent-form") as HTMLFormElement | null;
  const root = document.querySelector("[data-rent-calculator]");
  if (!form || !root) return;

  const recompute = () => {
    const scenario = readScenarioFromForm();
    const results = computeRentResults(scenario);
    renderRentResults(scenario, results);
    persistAndSyncUrl(scenario);
  };

  const debouncedRecompute = debounce(recompute, DEBOUNCE_MS);

  restoreFromSessionStorage(form);

  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("input", debouncedRecompute);
  form.addEventListener("change", debouncedRecompute);

  const erField = document.getElementById("field-er");
  erField?.addEventListener("input", debouncedRecompute);

  const resetBtn = document.getElementById("reset-evaluated-rent");
  resetBtn?.addEventListener("click", () => {
    const field = document.getElementById("field-er") as HTMLInputElement | null;
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
