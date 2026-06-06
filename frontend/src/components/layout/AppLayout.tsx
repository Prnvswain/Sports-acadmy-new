import { Outlet, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut, AlertTriangle } from 'lucide-react';
import type { SubscriptionStatus } from '@/types';

export function AppLayout() {
  const { user, profile, isLoading, logout, hasRole } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get<{ data: SubscriptionStatus }>('/dashboard/subscription');
      return data.data;
    },
    enabled: hasRole('ACADEMY_ADMIN'),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { count: number } }>('/notifications/unread-count');
      return data.data.count;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-[var(--color-muted-foreground)]">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {subscription?.isExpiringSoon && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-amber-800 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Subscription expires in {subscription.daysUntilExpiry} days. Please upgrade to avoid service interruption.
          </div>
        )}
        {(subscription?.studentUsagePercent ?? 0) >= 90 && (
          <div className="bg-orange-50 border-b border-orange-200 px-6 py-2 flex items-center gap-2 text-orange-800 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Student limit at {subscription?.studentUsagePercent}% ({subscription?.studentCount}/{subscription?.maxStudents}). Consider upgrading your plan.
          </div>
        )}
        <header className="border-b px-6 py-3 flex items-center justify-between bg-[var(--color-card)]">
          <div>
            <p className="text-sm text-[var(--color-muted-foreground)]">Welcome back,</p>
            <p className="font-semibold">{profile?.firstName} {profile?.lastName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{user.role.replace('_', ' ')}</Badge>
            {unreadCount ? (
              <Badge variant="destructive" className="gap-1">
                <Bell className="h-3 w-3" /> {unreadCount}
              </Badge>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 bg-[var(--color-muted)]/30 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
