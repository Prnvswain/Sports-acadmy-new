# SAMS Multi-Tenancy Security Strategy

## Overview

SAMS enforces **defense-in-depth** tenant isolation across five layers. Cross-academy data access is architecturally impossible under normal operation.

## Layer 1: Database Schema

Every tenant-owned record carries `academy_id`:

- `sports`, `membership_plans`, `batches`, `coaches`, `students`
- `fee_payments`, `coach_attendances`, `student_attendances`
- `performance_attributes`, `performance_scores`, `notifications`, `audit_logs`

**Enforcement:**
- Foreign keys with `ON DELETE CASCADE` to `academies`
- Composite unique constraints scoped by `academy_id` (e.g., `@@unique([academyId, name])`)
- Indexed `academy_id` on all tenant tables for performant scoped queries

**Super Admin exception:** `users` with `role = SUPER_ADMIN` have `academy_id = NULL`. They never own tenant data directly.

## Layer 2: JWT & Authentication

Access tokens embed:
```json
{
  "userId": "...",
  "email": "...",
  "role": "ACADEMY_ADMIN | COACH | SUPER_ADMIN",
  "academyId": "uuid | null"
}
```

- Tokens are signed with separate access/refresh secrets
- Refresh tokens stored server-side with expiry
- Inactive users and inactive academies are rejected at login

## Layer 3: Tenant Middleware

`resolveTenant` middleware (`src/middleware/tenant.ts`):

1. **Tenant users** (Admin, Coach): `req.academyId` is set from JWT `academyId`. Academy must be `ACTIVE`.
2. **Super Admin**: Must explicitly pass `x-academy-id` header or `?academyId=` query param for tenant operations. Defaults to `null` (platform-level only).
3. **`requireTenant`**: Blocks routes that need academy context when `academyId` is missing.

**Critical rule:** Client-supplied `academyId` in request bodies is **never trusted**.

## Layer 4: Service & Query Layer

All data access uses tenant-scoped helpers:

```typescript
// Always inject academyId from middleware, never from client body
withTenant(academyId, { ...filters })

// Before returning/updating any resource
assertTenantMatch(resource.academyId, req.academyId)
```

Every `findUnique`, `update`, `delete` validates the resource belongs to the requesting tenant before proceeding.

## Layer 5: Authorization (RBAC)

| Resource | Super Admin | Academy Admin | Coach |
|----------|:-----------:|:-------------:|:-----:|
| Academies / Subscriptions | ✅ | ❌ | ❌ |
| Sports, Plans, Batches | ✅* | ✅ | 👁️ batches only |
| Coaches, Students | ✅* | ✅ | 👁️ assigned |
| Fees, Reports, Settings | ✅* | ✅ | ❌ |
| Attendance (read) | ✅* | 👁️ | ✅ own batches |
| Attendance (write) | ❌ | ❌ | ✅ |
| Performance (read) | ✅* | 👁️ | ✅ |
| Performance (write) | ❌ | ❌ | ✅ scores only |

*Super Admin requires explicit `x-academy-id` header.

### Coach Scoping

`resolveCoach` middleware binds `req.coachId`. Coaches can only:
- See batches they're assigned to (`batch_coaches` join)
- Mark attendance for assigned batches
- Submit scores for students in their batches

## Subscription Hard Limits

Enforced at service layer before create operations:

```typescript
checkStudentLimit(academyId)  // throws LimitExceededError
checkCoachLimit(academyId)
```

Limits are stored on `academies.max_students` / `max_coaches` and updated on plan change.

## Additional Security Measures

- **Helmet** — HTTP security headers
- **Rate limiting** — 200 req/15min per IP on `/api`
- **CORS** — Restricted to `FRONTEND_URL`
- **Input validation** — Zod schemas on all endpoints
- **Audit logs** — All mutations logged with user, IP, entity
- **GPS attendance** — Haversine distance check against academy radius
- **Locked attendance** — Student attendance records are immutable after submission (`is_locked = true`)
- **Soft delete** — Students use `deleted_at` for recoverable deletion

## Threat Model Mitigations

| Threat | Mitigation |
|--------|-----------|
| IDOR (access other academy's resource by UUID) | `assertTenantMatch` on every resource fetch |
| Privilege escalation | RBAC middleware per route |
| Token theft | Short-lived access tokens (15m), refresh rotation |
| SQL injection | Prisma parameterized queries |
| Mass assignment | Zod schemas whitelist allowed fields |
| Subscription bypass | Server-side limit checks, not client-enforced |

## Recommended Production Hardening

1. Rotate JWT secrets regularly
2. Enable MySQL SSL connections
3. Use Redis for refresh token storage (current: MySQL)
4. Add row-level security views as additional DB guard
5. Enable WAF / API gateway in front of Express
6. Set up automated penetration testing for tenant isolation
