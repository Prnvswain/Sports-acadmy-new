import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SubscriptionStatus } from '@/types';

export function SubscriptionWidget() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get<{ data: SubscriptionStatus }>('/subscription/status');
      return data.data;
    },
  });

  const upgrade = useMutation({
    mutationFn: (plan: string) => api.post('/subscription/upgrade-request', { plan }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Subscription
          <Badge>{data.subscriptionPlan}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">Students</span>
            <span>{data.studentCount} / {data.maxStudents} ({data.studentUsagePercent}%)</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
            <div className="h-full bg-[var(--color-primary)]" style={{ width: `${Math.min(100, data.studentUsagePercent)}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">Coaches</span>
            <span>{data.coachCount} / {data.maxCoaches} ({data.coachUsagePercent}%)</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
            <div className="h-full bg-[var(--color-primary)]" style={{ width: `${Math.min(100, data.coachUsagePercent)}%` }} />
          </div>
        </div>
        {data.isExpired && (
          <p className="text-sm text-[var(--color-destructive)]">Subscription expired. Upgrade to continue.</p>
        )}
        {data.subscriptionPlan !== 'PLUS' && (
          <div className="flex gap-2">
            {data.subscriptionPlan === 'FREE' && (
              <Button size="sm" onClick={() => upgrade.mutate('PRO')}>Upgrade to PRO</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => upgrade.mutate('PLUS')}>Upgrade to PLUS</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
