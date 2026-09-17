import type { CreditBand } from "../data/pmi-rates";

export type { CreditBand };

export type LoanTerm = 15 | 30;

export type AffordabilityTier = "comfortable" | "stretch" | "risky" | "unaffordable";

/** Recurring, non-debt household expenses. Ignored by lender DTI ratios, but essential to the leftover-income test. */
export interface RealLifeExpenses {
  childcare: number;
  healthcare: number;
  groceries: number;
  transport: number;
  other: number;
}

export function totalRealLifeExpenses(expenses: RealLifeExpenses): number {
  return expenses.childcare + expenses.healthcare + expenses.groceries + expenses.transport + expenses.other;
}

export const ZERO_EXPENSES: RealLifeExpenses = { childcare: 0, healthcare: 0, groceries: 0, transport: 0, other: 0 };

export interface HouseholdInputs {
  /** Gross (pre-tax) monthly income across the household, drives lender DTI ratios */
  grossMonthlyIncome: number;
  /** Net (take-home) monthly income, drives the leftover-income sustainability test */
  netMonthlyIncome: number;
  /** Minimum monthly payments on debts a lender counts toward DTI (auto, student, credit cards, etc) — excludes housing */
  otherMonthlyDebts: number;
  expenses: RealLifeExpenses;
}

export interface LoanAssumptions {
  stateCode: string;
  /** Down payment in dollars (fixed cash available) */
  downPaymentDollars: number;
  /** Annual interest rate as a decimal (0.0675 = 6.75%). If omitted, engine uses the credit-band default. */
  interestRate?: number;
  creditBand: CreditBand;
  termYears: LoanTerm;
  hoaMonthly: number;
}

export interface MonthlyCostBreakdown {
  homePrice: number;
  loanAmount: number;
  ltvPct: number;
  principalAndInterest: number;
  propertyTax: number;
  insurance: number;
  pmi: number;
  hoa: number;
  maintenance: number;
  /** P&I + tax + insurance + PMI + HOA — what a lender's DTI ratio is computed against */
  lenderMonthlyPayment: number;
  /** lenderMonthlyPayment + maintenance — the real monthly cost of owning the home */
  sustainableMonthlyPayment: number;
  /** Months until PMI drops off at 78% original-value LTV, or null if PMI never applied */
  pmiDropoffMonth: number | null;
}

export interface AffordabilityResult {
  breakdown: MonthlyCostBreakdown;
  housingToIncomeRatio: number;
  totalDebtToIncomeRatio: number;
  /** Net income remaining after sustainable housing cost, other debts, and real-life expenses */
  leftoverIncome: number;
  leftoverIncomePctOfNet: number;
  tier: AffordabilityTier;
  /** Lender-approval-style estimate (DTI-based only, ignores leftover income and maintenance) */
  lenderWouldLikelyApprove: boolean;
  /** Household can sustain this payment long-term (passes leftover-income test) */
  householdCanSustain: boolean;
}
