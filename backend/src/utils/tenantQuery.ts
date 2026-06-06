import { TenantViolationError } from './errors';

export function assertTenantMatch(
  resourceAcademyId: string | null | undefined,
  requestAcademyId: string | null | undefined
): void {
  if (!requestAcademyId || !resourceAcademyId || resourceAcademyId !== requestAcademyId) {
    throw new TenantViolationError();
  }
}

export function withTenant<T extends Record<string, unknown>>(
  academyId: string,
  where: T = {} as T
): T & { academyId: string } {
  return { ...where, academyId };
}

export function getPagination(page?: number, limit?: number) {
  const p = Math.max(1, page || 1);
  const l = Math.min(100, Math.max(1, limit || 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}
