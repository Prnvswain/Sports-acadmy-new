import { SubscriptionPlan } from '@prisma/client';
export declare function getPlanLimits(plan: SubscriptionPlan): {
    readonly maxStudents: 50;
    readonly maxCoaches: 5;
} | {
    readonly maxStudents: 200;
    readonly maxCoaches: 20;
} | {
    readonly maxStudents: 999999;
    readonly maxCoaches: 999999;
};
export declare function checkStudentLimit(academyId: string): Promise<{
    current: number;
    max: number;
}>;
export declare function checkCoachLimit(academyId: string): Promise<{
    current: number;
    max: number;
}>;
export declare function getSubscriptionStatus(academyId: string): Promise<{
    studentCount: number;
    coachCount: number;
    studentUsagePercent: number;
    coachUsagePercent: number;
    daysUntilExpiry: number | null;
    isExpiringSoon: boolean;
    isExpired: boolean;
    subscriptionPlan: import("@prisma/client").$Enums.SubscriptionPlan;
    subscriptionStatus: import("@prisma/client").$Enums.SubscriptionStatus;
    subscriptionEnd: Date | null;
    maxStudents: number;
    maxCoaches: number;
}>;
export declare function upgradePlan(academyId: string, plan: SubscriptionPlan): Promise<{
    name: string;
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.AcademyStatus;
    slug: string;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
    subscriptionPlan: import("@prisma/client").$Enums.SubscriptionPlan;
    subscriptionStatus: import("@prisma/client").$Enums.SubscriptionStatus;
    subscriptionStart: Date | null;
    subscriptionEnd: Date | null;
    maxStudents: number;
    maxCoaches: number;
    registrationFee: import("@prisma/client-runtime-utils").Decimal;
    attendanceRadiusM: number;
    receiptPrefix: string;
    receiptTemplate: string | null;
    theme: string;
    notificationPrefs: import("@prisma/client/runtime/client").JsonValue | null;
}>;
//# sourceMappingURL=subscription.service.d.ts.map