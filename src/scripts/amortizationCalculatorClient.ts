import { computeAmortizationResults } from "../lib/state/computeAmortizationResults";
import type { AmortizationCalculatorResults } from "../lib/state/computeAmortizationResults";
import { formatUSD } from "../lib/format";
import { el, readScenarioFromForm, persistAndSyncUrl, restoreFromSessionStorage, debounce } from "../lib/domScenario";
import { scenarioToQueryString } from "../lib/state/serialize";
import type { ScenarioState } from "../lib/state/schema";

const DEBOUNCE_MS = 200;

function setBoundText(bindKey: string, text: string): void {
  document.querySelectorAll(`[data-bind="${bindKey}"]`).forEach((n) => {
    n.textContent = text;
  });
}

function monthsToYearsMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
}

function renderAmortizationResults(scenario: ScenarioState, results: AmortizationCalculatorResults): void {
  const { amortization } = results;

  setBoundText("loanAmount", formatUSD(results.loanAmount));
  setBoundText("payoffTime", monthsToYearsMonths(amortization.payoffMonth));
  setBoundText("totalInterest", formatUSD(amortization.totalInterestPaid));

  const savingsCallout = el<HTMLElement>("savings-callout");
  if (savingsCallout) savingsCallout.hidden = scenario.extraMonthlyPayment <= 0;
  setBoundText("interestSaved", `${formatUSD(amortization.interestSaved)} saved`);
  setBoundText("monthsSaved", `${amortization.monthsSaved} months removed from the loan`);

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

  const recompute = () => {
    const scenario = readScenarioFromForm();
    const results = computeAmortizationResults(scenario);
    renderAmortizationResults(scenario, results);
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
