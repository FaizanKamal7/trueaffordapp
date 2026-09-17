import { DEFAULT_SCENARIO, isValidCarTermMonths, isValidCreditBand } from "./schema";
import type { ScenarioState } from "./schema";
import { PROPERTY_TAX_BY_STATE } from "../data/property-tax-by-state";

/**
 * Short query-string keys so a scenario URL stays compact and shareable.
 * Only fields that differ from DEFAULT_SCENARIO are ever written.
 */
const KEY_MAP: Record<keyof ScenarioState, string> = {
  grossAnnualIncome: "gi",
  netMonthlyIncome: "ni",
  otherMonthlyDebts: "od",
  childcare: "ec",
  healthcare: "eh",
  groceries: "eg",
  transport: "et",
  otherExpenses: "eo",
  stateCode: "st",
  downPaymentDollars: "dp",
  interestRateOverride: "ir",
  creditBand: "cb",
  termYears: "tm",
  hoaMonthly: "hoa",
  evaluatedHomePrice: "ep",
  rentersInsuranceMonthly: "ri",
  utilitiesMonthly: "ut",
  evaluatedRent: "er",
  budgetHousingOverride: "bh",
  tenureYears: "ty",
  extraMonthlyPayment: "xp",
  carDownPaymentDollars: "cdp",
  carTradeInValueDollars: "cti",
  carTermMonths: "ctm",
  carInterestRateOverride: "cir",
  carCreditBand: "ccb",
  carInsuranceMonthly: "cin",
  evaluatedCarPrice: "cep",
};

function isValidStateCode(value: string): boolean {
  return value.toUpperCase() in PROPERTY_TAX_BY_STATE;
}

/** Serializes only the fields that differ from the defaults, keeping share links as short as possible. */
export function encodeScenario(state: ScenarioState): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of Object.keys(DEFAULT_SCENARIO) as (keyof ScenarioState)[]) {
    const value = state[key];
    const defaultValue = DEFAULT_SCENARIO[key];

    if (value === undefined || value === defaultValue) continue;
    if (typeof value === "number" && Number.isNaN(value)) continue;

    // Interest rate is stored internally as a decimal (0.0675) but round-trips through the
    // URL/form as a human percent (6.75) so a plain <form method="get"> submit needs no JS conversion.
    const serialized = (key === "interestRateOverride" || key === "carInterestRateOverride") && typeof value === "number" ? value * 100 : value;
    params.set(KEY_MAP[key], String(serialized));
  }

  return params;
}

export function scenarioToQueryString(state: ScenarioState): string {
  const qs = encodeScenario(state).toString();
  return qs ? `?${qs}` : "";
}

function parseNonNegativeNumber(raw: string | null): number | undefined {
  if (raw === null) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

/**
 * Reconstructs a ScenarioState from a URL's query params, merging onto
 * DEFAULT_SCENARIO. Never throws on malformed/garbage input — invalid or
 * out-of-range fields are silently dropped in favor of the default so a
 * corrupted or hand-edited share link degrades gracefully instead of
 * breaking the page.
 */
export function decodeScenario(params: URLSearchParams): ScenarioState {
  const state: ScenarioState = { ...DEFAULT_SCENARIO };

  const gi = parseNonNegativeNumber(params.get(KEY_MAP.grossAnnualIncome));
  if (gi !== undefined) state.grossAnnualIncome = gi;

  const ni = parseNonNegativeNumber(params.get(KEY_MAP.netMonthlyIncome));
  if (ni !== undefined) state.netMonthlyIncome = ni;

  const od = parseNonNegativeNumber(params.get(KEY_MAP.otherMonthlyDebts));
  if (od !== undefined) state.otherMonthlyDebts = od;

  const ec = parseNonNegativeNumber(params.get(KEY_MAP.childcare));
  if (ec !== undefined) state.childcare = ec;

  const eh = parseNonNegativeNumber(params.get(KEY_MAP.healthcare));
  if (eh !== undefined) state.healthcare = eh;

  const eg = parseNonNegativeNumber(params.get(KEY_MAP.groceries));
  if (eg !== undefined) state.groceries = eg;

  const et = parseNonNegativeNumber(params.get(KEY_MAP.transport));
  if (et !== undefined) state.transport = et;

  const eo = parseNonNegativeNumber(params.get(KEY_MAP.otherExpenses));
  if (eo !== undefined) state.otherExpenses = eo;

  const st = params.get(KEY_MAP.stateCode);
  if (st !== null && isValidStateCode(st)) state.stateCode = st.toUpperCase();

  const dp = parseNonNegativeNumber(params.get(KEY_MAP.downPaymentDollars));
  if (dp !== undefined) state.downPaymentDollars = dp;

  // Interest rate arrives as a human percent (6.75) and is stored internally as a decimal (0.0675).
  const irPct = parseNonNegativeNumber(params.get(KEY_MAP.interestRateOverride));
  if (irPct !== undefined && irPct > 0 && irPct < 30) state.interestRateOverride = irPct / 100;

  const cb = params.get(KEY_MAP.creditBand);
  if (cb !== null && isValidCreditBand(cb)) state.creditBand = cb;

  const tm = params.get(KEY_MAP.termYears);
  if (tm === "15" || tm === "30") state.termYears = Number(tm) as 15 | 30;

  const hoa = parseNonNegativeNumber(params.get(KEY_MAP.hoaMonthly));
  if (hoa !== undefined) state.hoaMonthly = hoa;

  const ep = parseNonNegativeNumber(params.get(KEY_MAP.evaluatedHomePrice));
  if (ep !== undefined) state.evaluatedHomePrice = ep;

  const ri = parseNonNegativeNumber(params.get(KEY_MAP.rentersInsuranceMonthly));
  if (ri !== undefined) state.rentersInsuranceMonthly = ri;

  const ut = parseNonNegativeNumber(params.get(KEY_MAP.utilitiesMonthly));
  if (ut !== undefined) state.utilitiesMonthly = ut;

  const er = parseNonNegativeNumber(params.get(KEY_MAP.evaluatedRent));
  if (er !== undefined) state.evaluatedRent = er;

  const bh = parseNonNegativeNumber(params.get(KEY_MAP.budgetHousingOverride));
  if (bh !== undefined) state.budgetHousingOverride = bh;

  const ty = parseNonNegativeNumber(params.get(KEY_MAP.tenureYears));
  if (ty !== undefined && ty > 0 && ty <= 30) state.tenureYears = ty;

  const xp = parseNonNegativeNumber(params.get(KEY_MAP.extraMonthlyPayment));
  if (xp !== undefined) state.extraMonthlyPayment = xp;

  const cdp = parseNonNegativeNumber(params.get(KEY_MAP.carDownPaymentDollars));
  if (cdp !== undefined) state.carDownPaymentDollars = cdp;

  const cti = parseNonNegativeNumber(params.get(KEY_MAP.carTradeInValueDollars));
  if (cti !== undefined) state.carTradeInValueDollars = cti;

  const ctm = Number(params.get(KEY_MAP.carTermMonths));
  if (isValidCarTermMonths(ctm)) state.carTermMonths = ctm;

  // Auto loan interest rate arrives as a human percent (6.75) and is stored internally as a decimal (0.0675).
  const cirPct = parseNonNegativeNumber(params.get(KEY_MAP.carInterestRateOverride));
  if (cirPct !== undefined && cirPct > 0 && cirPct < 40) state.carInterestRateOverride = cirPct / 100;

  const ccb = params.get(KEY_MAP.carCreditBand);
  if (ccb !== null && isValidCreditBand(ccb)) state.carCreditBand = ccb;

  const cin = parseNonNegativeNumber(params.get(KEY_MAP.carInsuranceMonthly));
  if (cin !== undefined) state.carInsuranceMonthly = cin;

  const cep = parseNonNegativeNumber(params.get(KEY_MAP.evaluatedCarPrice));
  if (cep !== undefined) state.evaluatedCarPrice = cep;

  return state;
}
