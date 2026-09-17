import { monthlyPrincipalAndInterest } from "./mortgage";

export interface AmortizationMonth {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  extraPayment: number;
  balance: number;
}

export interface AmortizationYearSummary {
  year: number;
  totalPrincipal: number;
  totalInterest: number;
  totalExtraPayment: number;
  endingBalance: number;
}

export interface AmortizationResult {
  schedule: AmortizationMonth[];
  yearlySummary: AmortizationYearSummary[];
  /** The scheduled monthly P&I payment before any extra payment */
  basePayment: number;
  payoffMonth: number;
  totalInterestPaid: number;
  /** Total interest that would have been paid with no extra payment, over the full original term */
  baselineTotalInterestPaid: number;
  interestSaved: number;
  /** Months earlier than the original term the loan is paid off, thanks to extra payments */
  monthsSaved: number;
}

/**
 * Full month-by-month amortization, with an optional extra monthly
 * payment applied straight to principal. Runs an actual simulation
 * rather than a closed-form shortcut, since an extra payment changes the
 * payoff month in a way that isn't captured by the standard formula
 * (spec 3.9's amortization schedule feature exists specifically to show
 * interest saved and months removed).
 */
export function generateAmortizationSchedule(loanAmount: number, annualRate: number, termYears: number, extraMonthlyPayment = 0): AmortizationResult {
  const n = termYears * 12;
  const basePayment = monthlyPrincipalAndInterest(loanAmount, annualRate, termYears);
  const monthlyRate = annualRate / 12;

  const baselineTotalInterestPaid = Math.max(0, basePayment * n - loanAmount);

  const schedule: AmortizationMonth[] = [];
  let balance = loanAmount;
  let month = 0;

  while (balance > 0 && month < n) {
    month++;
    const interest = balance * monthlyRate;
    let principal = basePayment - interest;
    let extra = Math.min(extraMonthlyPayment, Math.max(0, balance - principal));

    if (principal + extra > balance) {
      principal = Math.min(principal, balance);
      extra = Math.max(0, balance - principal);
    }

    balance = Math.max(0, balance - principal - extra);

    schedule.push({
      month,
      payment: interest + principal + extra,
      principal,
      interest,
      extraPayment: extra,
      balance,
    });

    if (balance <= 0) break;
  }

  const payoffMonth = schedule.length;
  const totalInterestPaid = schedule.reduce((sum, m) => sum + m.interest, 0);

  const yearlySummary: AmortizationYearSummary[] = [];
  for (let y = 0; y < Math.ceil(payoffMonth / 12); y++) {
    const yearMonths = schedule.slice(y * 12, y * 12 + 12);
    yearlySummary.push({
      year: y + 1,
      totalPrincipal: yearMonths.reduce((s, m) => s + m.principal, 0),
      totalInterest: yearMonths.reduce((s, m) => s + m.interest, 0),
      totalExtraPayment: yearMonths.reduce((s, m) => s + m.extraPayment, 0),
      endingBalance: yearMonths[yearMonths.length - 1]?.balance ?? 0,
    });
  }

  return {
    schedule,
    yearlySummary,
    basePayment,
    payoffMonth,
    totalInterestPaid,
    baselineTotalInterestPaid,
    interestSaved: Math.max(0, baselineTotalInterestPaid - totalInterestPaid),
    monthsSaved: Math.max(0, n - payoffMonth),
  };
}
