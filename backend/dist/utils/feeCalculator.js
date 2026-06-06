"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFinalFee = calculateFinalFee;
exports.previewFee = previewFee;
function calculateFinalFee(input) {
    const base = input.sportMonthlyFee * input.planMultiplier;
    const total = base + input.registrationFee + input.additionalCharges - input.discount;
    return Math.max(0, Math.round(total * 100) / 100);
}
function previewFee(sportMonthlyFee, planMultiplier, registrationFee, additionalCharges, discount) {
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
//# sourceMappingURL=feeCalculator.js.map