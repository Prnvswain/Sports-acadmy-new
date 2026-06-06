import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export function PerformancePage() {
  const { hasRole } = useAuth();

  const { data: attributes } = useQuery({
    queryKey: ['performance-attributes'],
    queryFn: async () => { const { data } = await api.get('/performance/attributes'); return data.data; },
  });

  const { data: requests } = useQuery({
    queryKey: ['attribute-requests'],
    queryFn: async () => { const { data } = await api.get('/performance/attribute-requests'); return data.data; },
    enabled: hasRole('ACADEMY_ADMIN'),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Performance</h2>
      {hasRole('COACH') && (
        <Card>
          <CardHeader><CardTitle>Submit Scores</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Score students 1-10 on approved attributes. Request new attributes for admin approval.
            </p>
          </CardContent>
        </Card>
      )}
      <DataTable
        title="Performance Attributes"
        data={attributes || []}
        columns={[
          { key: 'name', header: 'Attribute' },
          { key: 'description', header: 'Description' },
          { key: 'isActive', header: 'Status', render: (r) => <Badge>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
        ]}
      />
      {hasRole('ACADEMY_ADMIN') && (
        <DataTable
          title="Attribute Requests"
          data={requests || []}
          columns={[
            { key: 'name', header: 'Requested Attribute' },
            { key: 'requester', header: 'Coach', render: (r) => {
              const u = r.requester as { firstName: string; lastName: string };
              return `${u?.firstName} ${u?.lastName}`;
            }},
            { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'PENDING' ? 'secondary' : 'default'}>{r.status as string}</Badge> },
          ]}
        />
      )}
    </div>
  );
}
