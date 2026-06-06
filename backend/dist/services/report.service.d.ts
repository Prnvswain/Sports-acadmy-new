import ExcelJS from 'exceljs';
export interface ReportFilters {
    academyId: string;
    startDate?: Date;
    endDate?: Date;
    sportId?: string;
    batchId?: string;
    coachId?: string;
    studentId?: string;
}
export declare function getStudentReport(filters: ReportFilters): Promise<({
    sport: {
        name: string;
    } | null;
    membershipPlan: {
        name: string;
        multiplier: import("@prisma/client-runtime-utils").Decimal;
    } | null;
    batch: {
        name: string;
    } | null;
} & {
    id: string;
    email: string | null;
    firstName: string;
    lastName: string;
    academyId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    sportId: string | null;
    phone: string | null;
    address: string | null;
    registrationFee: import("@prisma/client-runtime-utils").Decimal;
    dateOfBirth: Date | null;
    membershipPlanId: string | null;
    batchId: string | null;
    gender: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    guardianEmail: string | null;
    guardianRelation: string | null;
    enrollmentDate: Date;
    additionalCharges: import("@prisma/client-runtime-utils").Decimal;
    discount: import("@prisma/client-runtime-utils").Decimal;
    deletedAt: Date | null;
})[]>;
export declare function getAttendanceReport(filters: ReportFilters): Promise<({
    batch: {
        name: string;
    };
    student: {
        firstName: string;
        lastName: string;
    };
} & {
    id: string;
    academyId: string;
    createdAt: Date;
    status: import("@prisma/client").$Enums.AttendanceStatus;
    batchId: string;
    studentId: string;
    notes: string | null;
    date: Date;
    markedBy: string;
    isLocked: boolean;
})[]>;
export declare function getRevenueReport(filters: ReportFilters): Promise<({
    student: {
        firstName: string;
        lastName: string;
    };
} & {
    id: string;
    academyId: string;
    createdAt: Date;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.PaymentStatus;
    registrationFee: import("@prisma/client-runtime-utils").Decimal;
    additionalCharges: import("@prisma/client-runtime-utils").Decimal;
    discount: import("@prisma/client-runtime-utils").Decimal;
    studentId: string;
    receiptNumber: string;
    amount: import("@prisma/client-runtime-utils").Decimal;
    sportFee: import("@prisma/client-runtime-utils").Decimal;
    planMultiplier: import("@prisma/client-runtime-utils").Decimal;
    dueDate: Date;
    paidDate: Date | null;
    paymentMethod: string | null;
    notes: string | null;
    periodStart: Date;
    periodEnd: Date;
})[]>;
export declare function getPerformanceReport(filters: ReportFilters): Promise<({
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
    student: {
        firstName: string;
        lastName: string;
    };
    attribute: {
        name: string;
    };
} & {
    id: string;
    academyId: string;
    studentId: string;
    notes: string | null;
    coachId: string;
    attributeId: string;
    score: number;
    scoredAt: Date;
})[]>;
export declare function getCoachReport(filters: ReportFilters): Promise<({
    user: {
        email: string;
        firstName: string;
        lastName: string;
    };
    _count: {
        coachAttendances: number;
        performanceScores: number;
    };
    batchAssignments: ({
        batch: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        batchId: string;
        coachId: string;
    })[];
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
})[]>;
export declare function getDueFeesReport(filters: ReportFilters): Promise<{
    id: string;
    academyId: string;
    createdAt: Date;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.PaymentStatus;
    registrationFee: import("@prisma/client-runtime-utils").Decimal;
    additionalCharges: import("@prisma/client-runtime-utils").Decimal;
    discount: import("@prisma/client-runtime-utils").Decimal;
    studentId: string;
    receiptNumber: string;
    amount: import("@prisma/client-runtime-utils").Decimal;
    sportFee: import("@prisma/client-runtime-utils").Decimal;
    planMultiplier: import("@prisma/client-runtime-utils").Decimal;
    dueDate: Date;
    paidDate: Date | null;
    paymentMethod: string | null;
    notes: string | null;
    periodStart: Date;
    periodEnd: Date;
}[]>;
export declare function toCSV(rows: Record<string, unknown>[], columns: string[]): string;
export declare function toExcel(sheetName: string, rows: Record<string, unknown>[], columns: {
    header: string;
    key: string;
}[]): Promise<ExcelJS.Buffer>;
export declare function toPDF(title: string, headers: string[], rows: string[][]): Promise<Buffer>;
//# sourceMappingURL=report.service.d.ts.map