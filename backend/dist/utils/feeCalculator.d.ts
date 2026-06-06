export interface FeeInput {
    sportMonthlyFee: number;
    planMultiplier: number;
    registrationFee: number;
    additionalCharges: number;
    discount: number;
}
export declare function calculateFinalFee(input: FeeInput): number;
export declare function previewFee(sportMonthlyFee: number, planMultiplier: number, registrationFee: number, additionalCharges: number, discount: number): {
    sportFee: number;
    registrationFee: number;
    additionalCharges: number;
    discount: number;
    finalFee: number;
    breakdown: string;
};
//# sourceMappingURL=feeCalculator.d.ts.map