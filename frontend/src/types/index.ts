export type UserRole = 'SUPER_ADMIN' | 'ACADEMY_ADMIN' | 'COACH';

export interface User {
  userId: string;
  email: string;
  role: UserRole;
  academyId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    academyId: string | null;
    academy?: { id: string; name: string; subscriptionPlan: string };
    coach?: { id: string };
  };
}

export interface DashboardCards {
  activeStudents: number;
  activeCoaches: number;
  activeBatches: number;
  monthlyRevenue: number;
  pendingDues: number;
  overdueDues: number;
}

export interface SubscriptionStatus {
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionEnd: string | null;
  maxStudents: number;
  maxCoaches: number;
  studentCount: number;
  coachCount: number;
  studentUsagePercent: number;
  coachUsagePercent: number;
  daysUntilExpiry: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
}
