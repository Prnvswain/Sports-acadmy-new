export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function login(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        academy: {
            name: string;
            id: string;
            status: import("@prisma/client").$Enums.AcademyStatus;
            subscriptionPlan: import("@prisma/client").$Enums.SubscriptionPlan;
        } | null;
        coach: {
            id: string;
        } | null;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.UserRole;
        academyId: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    };
}>;
export declare function refreshAccessToken(token: string): Promise<{
    accessToken: string;
}>;
export declare function logout(token: string): Promise<void>;
export declare function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
export declare function generateReceiptNumber(prefix: string): string;
//# sourceMappingURL=auth.service.d.ts.map