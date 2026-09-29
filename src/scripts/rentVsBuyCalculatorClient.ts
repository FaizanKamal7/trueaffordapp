import { computeRentVsBuyResults } from "../lib/state/computeRentVsBuyResults";
import type { RentVsBuyCalculatorResults } from "../lib/state/computeRentVsBuyResults";
import { computeRentVsBuyChartGeometry } from "../lib/rentVsBuyChartGeometry";
import { formatUSD, formatSignedUSD } from "../lib/format";
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

function renderRentVsBuyResults(scenario: ScenarioState, results: RentVsBuyCalculatorResults, t: CalculatorCopy): void {
  const { simulation } = results;
  const tv = t.rentVsBuy;
  const diff = Math.abs(simulation.netWorthAtTenure.buyer - simulation.netWorthAtTenure.renter);

  const eyebrow = document.querySelector("#rvb-results .eyebrow");
  if (eyebrow) eyebrow.textContent = tv.atYears(results.tenureYears);

  setBoundText("choice", tv.choices[simulation.betterChoiceAtTenure]);
  setBoundText("diff", formatUSD(diff));
  setBoundText("buyerNetWorth", formatSignedUSD(simulation.netWorthAtTenure.buyer));
  setBoundText("renterNetWorth", formatSignedUSD(simulation.netWorthAtTenure.renter));

  const breakeven = el("rvb-breakeven");
  if (breakeven) {
    breakeven.textContent = simulation.breakevenYear !== null ? tv.breakeven(simulation.breakevenYear) : tv.noBreakeven;
  }

  const geometry = computeRentVsBuyChartGeometry(simulation.timeline, results.tenureYears, simulation.breakevenYear);

  document.getElementById("buyer-line")?.setAttribute("points", geometry.buyerPoints);
  document.getElementById("renter-line")?.setAttribute("points", geometry.renterPoints);

  const tenureLine = document.getElementById("tenure-line");
  if (tenureLine) {
    tenureLine.setAttribute("x1", String(geometry.tenureX));
    tenureLine.setAttribute("x2", String(geometry.tenureX));
  }

  const breakevenLine = document.getElementById("breakeven-line");
  if (geometry.breakevenX !== null) {
    if (breakevenLine) {
      breakevenLine.setAttribute("x1", String(geometry.breakevenX));
      breakevenLine.setAttribute("x2", String(geometry.breakevenX));
      breakevenLine.removeAttribute("hidden");
    } else {
      const svg = document.querySelector(".rvb-chart");
      if (svg) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("id", "breakeven-line");
        line.setAttribute("x1", String(geometry.breakevenX));
        line.setAttribute("y1", "0");
        line.setAttribute("x2", String(geometry.breakevenX));
        line.setAttribute("y2", String(geometry.height));
        line.setAttribute("stroke", "var(--color-mute)");
        line.setAttribute("stroke-width", "1");
        line.setAttribute("stroke-dasharray", "4 3");
        svg.insertBefore(line, svg.firstChild?.nextSibling ?? null);
      }
    }
  } else {
    breakevenLine?.remove();
  }

  const shareInput = el<HTMLInputElement>("share-url");
  if (shareInput) {
    shareInput.value = `${window.location.origin}${window.location.pathname}${scenarioToQueryString(scenario)}`;
  }
}

export function initRentVsBuyCalculator(): void {
  const form = document.getElementById("rvb-form") as HTMLFormElement | null;
  const root = document.querySelector("[data-rentvsbuy-calculator]");
  if (!form || !root) return;
  const t = calculatorCopyFor(root);

  const recompute = () => {
    const scenario = readScenarioFromForm();
    const results = computeRentVsBuyResults(scenario);
    renderRentVsBuyResults(scenario, results, t);
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
