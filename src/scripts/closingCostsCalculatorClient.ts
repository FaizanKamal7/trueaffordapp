import { estimateClosingCosts } from "../lib/engine/closingCosts";
import { computeResults } from "../lib/state/computeResults";
import { formatUSD } from "../lib/format";
import { el, readScenarioFromForm, persistAndSyncUrl, restoreFromSessionStorage, debounce } from "../lib/domScenario";
import { scenarioToQueryString } from "../lib/state/serialize";

const DEBOUNCE_MS = 200;

function setBoundText(bindKey: string, text: string): void {
  document.querySelectorAll(`[data-bind="${bindKey}"]`).forEach((n) => {
    n.textContent = text;
  });
}

export function initClosingCostsCalculator(): void {
  const form = document.getElementById("closing-form") as HTMLFormElement | null;
  const root = document.querySelector("[data-closing-calculator]");
  if (!form || !root) return;

  const recompute = () => {
    const scenario = readScenarioFromForm();
    const homePrice = scenario.evaluatedHomePrice ?? computeResults(scenario).defaultEvaluatedPrice;
    const closingCosts = estimateClosingCosts(homePrice, scenario.downPaymentDollars);

    setBoundText("totalCashTypical", formatUSD(closingCosts.totalCashNeededTypical));
    setBoundText("totalCashTypical2", formatUSD(closingCosts.totalCashNeededTypical));
    setBoundText("rangeNote", `Range: ${formatUSD(closingCosts.totalCashNeededLow)} – ${formatUSD(closingCosts.totalCashNeededHigh)}`);
    setBoundText("downPayment", formatUSD(scenario.downPaymentDollars));
    setBoundText("ccLow", formatUSD(closingCosts.low));
    setBoundText("ccTypical", formatUSD(closingCosts.typical));
    setBoundText("ccHigh", formatUSD(closingCosts.high));

    persistAndSyncUrl(scenario);

    const shareInput = el<HTMLInputElement>("share-url");
    if (shareInput) {
      shareInput.value = `${window.location.origin}${window.location.pathname}${scenarioToQueryString(scenario)}`;
    }
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
