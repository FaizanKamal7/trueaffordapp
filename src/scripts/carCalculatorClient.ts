import type { ScenarioState } from "../lib/state/schema";
import { scenarioToQueryString } from "../lib/state/serialize";
import { computeCarResults } from "../lib/state/computeCarResults";
import type { CarCalculatorResults } from "../lib/state/computeCarResults";
import { computeScaleGeometry } from "../lib/scaleGeometry";
import { formatUSD, formatSignedUSD } from "../lib/format";
import { el, readScenarioFromForm, persistAndSyncUrl, restoreFromSessionStorage, debounce } from "../lib/domScenario";

const DEBOUNCE_MS = 200;

const tierLabels: Record<string, string> = {
  comfortable: "Comfortable",
  stretch: "Stretch",
  risky: "Risky",
  unaffordable: "Unaffordable",
};

function setBoundText(bindKey: string, text: string): void {
  document.querySelectorAll(`[data-bind="${bindKey}"]`).forEach((n) => {
    n.textContent = text;
  });
}

function renderCarResults(scenario: ScenarioState, results: CarCalculatorResults): void {
  const { affordability } = results;
  const { breakdown } = affordability;

  // Headline
  const headline = el("car-headline");
  if (headline) {
    if (results.isUnaffordable) {
      headline.textContent = "Not affordable at this price yet";
    } else {
      headline.innerHTML = "";
      const badge = document.createElement("span");
      badge.className = "tier-badge";
      badge.id = "car-tier-badge";
      badge.dataset.tier = affordability.tier;
      badge.textContent = tierLabels[affordability.tier];
      headline.append(badge, document.createTextNode(" — up to "));
      const strong = document.createElement("strong");
      strong.id = "car-evaluated-price";
      strong.dataset.bind = "evaluatedPrice";
      strong.textContent = formatUSD(results.evaluatedPrice);
      headline.append(strong);
    }
  }

  // Scale bar
  const geometry = computeScaleGeometry({
    comfortableMax: results.comfortableMax,
    stretchMax: results.stretchMax,
    riskyMax: results.riskyMax,
    evaluatedPrice: results.evaluatedPrice,
  });
  const zoneComfortable = el("scale-zone-comfortable");
  const zoneStretch = el("scale-zone-stretch");
  const zoneRisky = el("scale-zone-risky");
  const zoneUnaffordable = el("scale-zone-unaffordable");
  const marker = el("scale-marker");
  if (zoneComfortable) zoneComfortable.style.width = `${geometry.comfortableWidthPct}%`;
  if (zoneStretch) zoneStretch.style.width = `${geometry.stretchWidthPct}%`;
  if (zoneRisky) zoneRisky.style.width = `${geometry.riskyWidthPct}%`;
  if (zoneUnaffordable) zoneUnaffordable.style.width = `${geometry.unaffordableWidthPct}%`;
  if (marker) marker.style.left = `${geometry.markerLeftPct}%`;
  setBoundText("comfortableMax", formatUSD(results.comfortableMax));
  setBoundText("stretchMax", formatUSD(results.stretchMax));
  setBoundText("riskyMax", formatUSD(results.riskyMax));

  // Evaluated-price field placeholder + reset button visibility
  const cepField = el<HTMLInputElement>("field-cep");
  if (cepField && document.activeElement !== cepField) {
    cepField.placeholder = String(results.defaultEvaluatedPrice);
  }
  const resetBtn = el<HTMLButtonElement>("reset-evaluated-car-price");
  if (resetBtn) resetBtn.hidden = !results.isCustomEvaluatedPrice;

  // Rule vs sustainable
  setBoundText("ruleMax", formatUSD(results.riskyMax));
  setBoundText("sustainableMax", formatUSD(results.sustainableMax));
  const gapEl = el("car-gap-explanation");
  if (gapEl) {
    gapEl.textContent =
      results.ruleVsSustainableGap > 500
        ? `That's a ${formatUSD(results.ruleVsSustainableGap)} gap — the rule of thumb allows more car than your household's real budget can comfortably carry.`
        : "Your budget can support at least as much as the 20/4/10 rule's ceiling — the rule of thumb isn't what's holding you back here.";
  }

  // Breakdown
  const sectionHeading = document.querySelector(".breakdown .section-heading");
  if (sectionHeading) sectionHeading.textContent = `Cost breakdown at ${formatUSD(results.evaluatedPrice)}`;
  setBoundText("carTax", formatUSD(breakdown.salesTax));
  setBoundText("carFinanced", formatUSD(breakdown.amountFinanced));
  setBoundText("carPi", formatUSD(breakdown.principalAndInterest));
  setBoundText("carInsurance", formatUSD(breakdown.insurance));
  setBoundText("carTotal", formatUSD(breakdown.totalMonthlyCost));

  // Leftover income callout
  const leftoverCallout = el("car-leftover-callout");
  if (leftoverCallout) {
    leftoverCallout.classList.toggle("callout-positive", affordability.householdCanSustain);
    leftoverCallout.classList.toggle("callout-negative", !affordability.householdCanSustain);
  }
  setBoundText("carLeftoverAmount", formatSignedUSD(affordability.leftoverIncome));
  const leftoverMessage = el("car-leftover-message");
  if (leftoverMessage) {
    leftoverMessage.textContent = affordability.householdCanSustain
      ? "This household clears both the 20/4/10-style ratio and a real monthly budget."
      : "This household would run a monthly deficit at this price — even though it may look affordable by the ratio alone.";
  }

  // Share link
  const shareInput = el<HTMLInputElement>("share-url");
  if (shareInput) {
    const qs = scenarioToQueryString(scenario);
    shareInput.value = `${window.location.origin}${window.location.pathname}${qs}`;
  }
}

export function initCarCalculator(): void {
  const form = document.getElementById("car-form") as HTMLFormElement | null;
  const root = document.querySelector("[data-car-calculator]");
  if (!form || !root) return;

  const recompute = () => {
    const scenario = readScenarioFromForm();
    const results = computeCarResults(scenario);
    renderCarResults(scenario, results);
    persistAndSyncUrl(scenario);
  };

  const debouncedRecompute = debounce(recompute, DEBOUNCE_MS);

  restoreFromSessionStorage(form);

  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("input", debouncedRecompute);
  form.addEventListener("change", debouncedRecompute);

  const cepField = document.getElementById("field-cep");
  cepField?.addEventListener("input", debouncedRecompute);

  const resetBtn = document.getElementById("reset-evaluated-car-price");
  resetBtn?.addEventListener("click", () => {
    const field = document.getElementById("field-cep") as HTMLInputElement | null;
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
