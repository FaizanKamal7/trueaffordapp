import { computeAmortizationResults } from "../lib/state/computeAmortizationResults";
import type { AmortizationCalculatorResults } from "../lib/state/computeAmortizationResults";
import { formatUSD } from "../lib/format";
import { el, readScenarioFromForm, persistAndSyncUrl, restoreFromSessionStorage, debounce } from "../lib/domScenario";
import { scenarioToQueryString } from "../lib/state/serialize";
import type { ScenarioState } from "../lib/state/schema";
import { calculatorCopyFor, type CalculatorCopy } from "../i18n/calculators";

const DEBOUNCE_MS = 200;

function setBoundText(bindKey: string, text: string): void {
  document.querySelectorAll(`[data-bind="${bindKey}"]`).forEach((n) => {
    n.textContent = text;
  });
}

function renderAmortizationResults(scenario: ScenarioState, results: AmortizationCalculatorResults, t: CalculatorCopy): void {
  const { amortization } = results;
  const tm = t.amortization;

  setBoundText("loanAmount", formatUSD(results.loanAmount));
  setBoundText("payoffTime", tm.duration(amortization.payoffMonth));
  setBoundText("totalInterest", formatUSD(amortization.totalInterestPaid));

  const savingsCallout = el<HTMLElement>("savings-callout");
  if (savingsCallout) savingsCallout.hidden = scenario.extraMonthlyPayment <= 0;
  setBoundText("interestSaved", tm.saved(amortization.interestSaved));
  setBoundText("monthsSaved", tm.monthsSaved(amortization.monthsSaved));

  const example = results.extraPaymentExample;
  const exampleCallout = el<HTMLElement>("example-callout");
  if (exampleCallout) exampleCallout.hidden = example === null;
  if (example) {
    const label = el("example-label");
    if (label) label.textContent = tm.exampleLabel(example.extraMonthlyPayment);
    const saved = el("example-interest-saved");
    if (saved) saved.textContent = tm.saved(example.interestSaved);
    const months = el("example-months-saved");
    if (months) months.textContent = tm.monthsSaved(example.monthsSaved);
  }

  const tbody = el("year-table-body");
  if (tbody) {
    tbody.innerHTML = "";
    amortization.yearlySummary.forEach((y) => {
      const row = document.createElement("tr");
      const cells = [String(y.year), formatUSD(y.totalPrincipal + y.totalExtraPayment), formatUSD(y.totalInterest), formatUSD(y.endingBalance)];
      cells.forEach((text) => {
        const td = document.createElement("td");
        td.textContent = text;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  }

  const shareInput = el<HTMLInputElement>("share-url");
  if (shareInput) {
    shareInput.value = `${window.location.origin}${window.location.pathname}${scenarioToQueryString(scenario)}`;
  }
}

export function initAmortizationCalculator(): void {
  const form = document.getElementById("amortization-form") as HTMLFormElement | null;
  const root = document.querySelector("[data-amortization-calculator]");
  if (!form || !root) return;
  const t = calculatorCopyFor(root);

  const recompute = () => {
    const scenario = readScenarioFromForm();
    const results = computeAmortizationResults(scenario);
    renderAmortizationResults(scenario, results, t);
    persistAndSyncUrl(scenario);
  };

  const debouncedRecompute = debounce(recompute, DEBOUNCE_MS);

  restoreFromSessionStorage(form);

  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("input", debouncedRecompute);
  form.addEventListener("change", debouncedRecompute);

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
