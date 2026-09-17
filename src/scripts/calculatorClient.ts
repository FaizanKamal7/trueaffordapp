import type { ScenarioState } from "../lib/state/schema";
import { scenarioToQueryString } from "../lib/state/serialize";
import { computeResults } from "../lib/state/computeResults";
import type { CalculatorResults } from "../lib/state/computeResults";
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

function renderResults(scenario: ScenarioState, results: CalculatorResults): void {
  const { affordability } = results;
  const { breakdown } = affordability;

  // Headline
  const headline = el("result-headline");
  if (headline) {
    if (results.isUnaffordable) {
      headline.textContent = "Not affordable at this price yet";
    } else {
      headline.innerHTML = "";
      const badge = document.createElement("span");
      badge.className = "tier-badge";
      badge.id = "result-tier-badge";
      badge.dataset.tier = affordability.tier;
      badge.textContent = tierLabels[affordability.tier];
      headline.append(badge, document.createTextNode(" — up to "));
      const strong = document.createElement("strong");
      strong.id = "result-evaluated-price";
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
  const epField = el<HTMLInputElement>("field-ep");
  if (epField && document.activeElement !== epField) {
    epField.placeholder = String(results.defaultEvaluatedPrice);
  }
  const resetBtn = el<HTMLButtonElement>("reset-evaluated-price");
  if (resetBtn) resetBtn.hidden = !results.isCustomEvaluatedPrice;

  // Unaffordable explanation block
  let unaffordableBlock = el("unaffordable-block");
  const evaluateRow = document.querySelector(".evaluate-row");
  if (results.isUnaffordable) {
    if (!unaffordableBlock) {
      unaffordableBlock = document.createElement("div");
      unaffordableBlock.className = "callout callout-unaffordable";
      unaffordableBlock.id = "unaffordable-block";
      const title = document.createElement("p");
      title.className = "callout-title";
      title.textContent = "What would need to change";
      const list = document.createElement("ul");
      list.id = "unaffordable-reasons";
      unaffordableBlock.append(title, list);
      evaluateRow?.insertAdjacentElement("afterend", unaffordableBlock);
    }
    const list = el("unaffordable-reasons");
    if (list) {
      list.innerHTML = "";
      results.unaffordableReasons.forEach((reason) => {
        const li = document.createElement("li");
        li.textContent = reason;
        list.appendChild(li);
      });
    }
  } else if (unaffordableBlock) {
    unaffordableBlock.remove();
  }

  // Lender vs sustainable
  setBoundText("lenderMax", formatUSD(results.riskyMax));
  setBoundText("sustainableMax", formatUSD(results.sustainableMax));
  const gapEl = el("gap-explanation");
  if (gapEl) {
    const gap = results.riskyMax - results.sustainableMax;
    gapEl.textContent =
      gap > 500
        ? `That's a ${formatUSD(gap)} gap — a lender may approve more home than your household's real budget can comfortably carry.`
        : "Your budget can support at least as much as a lender's generous debt-to-income ceiling — the DTI limit isn't what's holding you back here.";
  }

  // Breakdown
  const sectionHeading = document.querySelector(".breakdown .section-heading");
  if (sectionHeading) sectionHeading.textContent = `Monthly cost at ${formatUSD(results.evaluatedPrice)}`;
  setBoundText("pi", formatUSD(breakdown.principalAndInterest));
  setBoundText("tax", formatUSD(breakdown.propertyTax));
  setBoundText("insurance", formatUSD(breakdown.insurance));
  setBoundText("pmi", formatUSD(breakdown.pmi));
  setBoundText("hoa", formatUSD(breakdown.hoa));
  setBoundText("maintenance", formatUSD(breakdown.maintenance));
  setBoundText("lenderTotal", formatUSD(breakdown.lenderMonthlyPayment));
  setBoundText("sustainableTotal", formatUSD(breakdown.sustainableMonthlyPayment));

  const pmiRow = el("bd-pmi-row");
  if (pmiRow) pmiRow.hidden = breakdown.pmi <= 0;
  const pmiNote = el("bd-pmi-note");
  if (pmiNote) pmiNote.textContent = breakdown.pmiDropoffMonth !== null ? ` (drops at month ${breakdown.pmiDropoffMonth})` : "";
  const hoaRow = el("bd-hoa-row");
  if (hoaRow) hoaRow.hidden = breakdown.hoa <= 0;

  // Leftover income callout
  const leftoverCallout = el("leftover-callout");
  if (leftoverCallout) {
    leftoverCallout.classList.toggle("callout-positive", affordability.householdCanSustain);
    leftoverCallout.classList.toggle("callout-negative", !affordability.householdCanSustain);
  }
  setBoundText("leftoverAmount", formatSignedUSD(affordability.leftoverIncome));
  const leftoverMessage = el("leftover-message");
  if (leftoverMessage) {
    leftoverMessage.textContent = affordability.householdCanSustain
      ? "This household clears both the lender's ratios and a real monthly budget."
      : "This household would run a monthly deficit at this price — even though a lender may still approve it.";
  }

  // Constraints
  let constraintsBlock = el("constraints-block");
  const leftoverCalloutEl = el("leftover-callout");
  if (results.constraints.length > 0) {
    if (!constraintsBlock) {
      constraintsBlock = document.createElement("div");
      constraintsBlock.className = "constraints";
      constraintsBlock.id = "constraints-block";
      const heading = document.createElement("p");
      heading.className = "section-heading";
      heading.textContent = "What's driving this";
      const list = document.createElement("ul");
      list.id = "constraints-list";
      constraintsBlock.append(heading, list);
      leftoverCalloutEl?.insertAdjacentElement("afterend", constraintsBlock);
    }
    const list = el("constraints-list");
    if (list) {
      list.innerHTML = "";
      results.constraints.forEach((c) => {
        const li = document.createElement("li");
        li.dataset.constraintId = c.id;
        li.textContent = c.description;
        list.appendChild(li);
      });
    }
  } else if (constraintsBlock) {
    constraintsBlock.remove();
  }

  // Sensitivity panel
  const { sensitivity } = results;
  const sensRate = el("sens-rate");
  if (sensRate) sensRate.textContent = `${formatUSD(sensitivity.rate.minusOnePoint)} · ${formatUSD(sensitivity.rate.current)} · ${formatUSD(sensitivity.rate.plusOnePoint)}`;
  const sensIncome = el("sens-income");
  if (sensIncome) sensIncome.textContent = `${tierLabels[sensitivity.incomeDrop.currentTier]} → ${tierLabels[sensitivity.incomeDrop.droppedTier]}`;
  const sensIncomeNote = el("sens-income-note");
  if (sensIncomeNote) sensIncomeNote.textContent = `At ${formatUSD(sensitivity.incomeDrop.droppedGrossMonthlyIncome)}/mo gross, holding this home price constant.`;
  const sensChild = el("sens-child");
  if (sensChild) sensChild.textContent = `${tierLabels[sensitivity.addingChild.currentTier]} → ${tierLabels[sensitivity.addingChild.withChildTier]}`;
  const sensDownPayment = el("sens-downpayment");
  if (sensDownPayment) sensDownPayment.textContent = `${formatUSD(sensitivity.downPayment.currentTotalMonthly)} → ${formatUSD(sensitivity.downPayment.largerTotalMonthly)}/mo`;
  const sensDownPaymentNote = el("sens-downpayment-note");
  if (sensDownPaymentNote) sensDownPaymentNote.textContent = `PMI: ${formatUSD(sensitivity.downPayment.currentPmiMonthly)} → ${formatUSD(sensitivity.downPayment.largerPmiMonthly)}/mo`;

  // Share link
  const shareInput = el<HTMLInputElement>("share-url");
  if (shareInput) {
    const qs = scenarioToQueryString(scenario);
    shareInput.value = `${window.location.origin}${window.location.pathname}${qs}`;
  }
}

export function initCalculator(): void {
  const form = document.getElementById("calculator-form") as HTMLFormElement | null;
  const calculatorRoot = document.querySelector("[data-calculator]");
  if (!form || !calculatorRoot) return;

  const recompute = () => {
    const scenario = readScenarioFromForm();
    const results = computeResults(scenario);
    renderResults(scenario, results);
    persistAndSyncUrl(scenario);
  };

  const debouncedRecompute = debounce(recompute, DEBOUNCE_MS);

  restoreFromSessionStorage(form);

  // Prevent a full no-JS-style page navigation once JS has taken over.
  form.addEventListener("submit", (e) => e.preventDefault());

  form.addEventListener("input", debouncedRecompute);
  form.addEventListener("change", debouncedRecompute);

  const epField = document.getElementById("field-ep");
  epField?.addEventListener("input", debouncedRecompute);

  const resetBtn = document.getElementById("reset-evaluated-price");
  resetBtn?.addEventListener("click", () => {
    const field = document.getElementById("field-ep") as HTMLInputElement | null;
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

  // Initial client-side sync in case sessionStorage restored different values than the SSR render used.
  recompute();
}
