export interface FeeInput {
  sportMonthlyFee: number;
  planMultiplier: number;
  registrationFee: number;
  additionalCharges: number;
  discount: number;
}

export function calculateFinalFee(input: FeeInput): number {
  const base = input.sportMonthlyFee * input.planMultiplier;
  const total = base + input.registrationFee + input.additionalCharges - input.discount;
  return Math.max(0, Math.round(total * 100) / 100);
}

export function previewFee(
  sportMonthlyFee: number,
  planMultiplier: number,
  registrationFee: number,
  additionalCharges: number,
  discount: number
) {
  const sportFee = sportMonthlyFee * planMultiplier;
  const finalFee = calculateFinalFee({
    sportMonthlyFee,
    planMultiplier,
    registrationFee,
    additionalCharges,
    discount,
  });

  return {
    sportFee: Math.round(sportFee * 100) / 100,
    registrationFee,
    additionalCharges,
    discount,
    finalFee,
    breakdown: `(Sport Fee × ${planMultiplier}) + Registration + Additional − Discount`,
  };
}
