export declare function getAdminDashboard(academyId: string): Promise<{
    cards: {
        activeStudents: number;
        activeCoaches: number;
        activeBatches: number;
        monthlyRevenue: number;
        pendingDues: number;
        overdueDues: number;
    };
    charts: {
        revenueTrend: {
            month: string;
            revenue: number;
        }[];
        studentGrowth: {
            month: string;
            newStudents: number;
            total: number;
        }[];
        attendanceTrend: {
            status: import("@prisma/client").$Enums.AttendanceStatus;
            count: number;
        }[];
        sportsDistribution: {
            name: string;
            students: number;
            batches: number;
        }[];
    };
    widgets: {
        subscription: {
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
        };
        recentActivities: ({
            user: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            academyId: string | null;
            createdAt: Date;
            userId: string;
            action: import("@prisma/client").$Enums.AuditAction;
            entity: string;
            entityId: string | null;
            oldValues: import("@prisma/client/runtime/client").JsonValue | null;
            newValues: import("@prisma/client/runtime/client").JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
        })[];
        absentCoachesToday: ({
            coach: {
                user: {
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                academyId: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                phone: string | null;
                address: string | null;
                dateOfBirth: Date | null;
                joinDate: Date;
            };
        } & {
            id: string;
            academyId: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.CoachAttendanceStatus;
            notes: string | null;
            coachId: string;
            date: Date;
            checkInAt: Date | null;
            latitude: number | null;
            longitude: number | null;
        })[];
    };
}>;
export declare function getCoachDashboard(academyId: string, coachId: string): Promise<{
    todayBatches: {
        id: string;
        name: string;
        sport: string;
        startTime: string;
        endTime: string;
        studentCount: number;
    }[];
    attendancePending: number;
    ownAttendanceStatus: import("@prisma/client").$Enums.CoachAttendanceStatus | null;
    monthlyAttendanceSummary: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.CoachAttendanceGroupByOutputType, "status"[]> & {
        _count: number;
    })[];
    pendingPerformanceTasks: number;
}>;
export declare function getSuperAdminDashboard(): Promise<{
    totalAcademies: number;
    activeAcademies: number;
    totalRevenue: number;
    planBreakdown: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.AcademyGroupByOutputType, "subscriptionPlan"[]> & {
        _count: number;
    })[];
}>;
//# sourceMappingURL=dashboard.service.d.ts.map