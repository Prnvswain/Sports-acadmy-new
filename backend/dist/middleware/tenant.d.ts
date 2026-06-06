import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
/**
 * Multi-Tenancy Security Layer
 *
 * Strategy:
 * 1. JWT carries academyId for tenant users (null for SUPER_ADMIN)
 * 2. Middleware injects req.academyId — the ONLY tenant identifier used downstream
 * 3. SUPER_ADMIN must explicitly pass ?academyId or x-academy-id header for tenant ops
 * 4. All tenant-scoped services MUST use tenantWhere() helper — never trust client body academyId
 * 5. Cross-tenant resource access blocked at middleware + service + unique constraints
 */
export declare const resolveTenant: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireTenant: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const enforceTenantOwnership: (resourceAcademyId: string | null, reqAcademyId: string | null | undefined) => void;
export declare const tenantWhere: (academyId: string) => {
    academyId: string;
};
//# sourceMappingURL=tenant.d.ts.map