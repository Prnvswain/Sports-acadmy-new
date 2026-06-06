import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => { const { data } = await api.get('/notifications'); return data.data; },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>Mark All Read</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>All Notifications</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-[var(--color-muted-foreground)]">Loading...</p>
          ) : !data?.length ? (
            <p className="text-[var(--color-muted-foreground)]">No notifications</p>
          ) : (
            <div className="space-y-3">
              {data.map((n: { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }) => (
                <div key={n.id} className={`p-4 rounded-md border ${!n.isRead ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{n.title}</p>
                        <Badge variant="outline">{n.type.replace('_', ' ')}</Badge>
                        {!n.isRead && <Badge variant="destructive">Unread</Badge>}
                      </div>
                      <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{n.message}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-2">{formatDate(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id)}>Mark Read</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
