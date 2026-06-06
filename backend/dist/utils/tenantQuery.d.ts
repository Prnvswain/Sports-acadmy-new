export declare function assertTenantMatch(resourceAcademyId: string | null | undefined, requestAcademyId: string | null | undefined): void;
export declare function withTenant<T extends Record<string, unknown>>(academyId: string, where?: T): T & {
    academyId: string;
};
export declare function getPagination(page?: number, limit?: number): {
    skip: number;
    take: number;
    page: number;
    limit: number;
};
//# sourceMappingURL=tenantQuery.d.ts.map