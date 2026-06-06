import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';

export function BatchesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => { const { data } = await api.get('/batches'); return data.data; },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Batches</h2>
      <DataTable
        title="All Batches"
        data={data || []}
        isLoading={isLoading}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'sport', header: 'Sport', render: (r) => (r.sport as { name: string })?.name },
          { key: 'startTime', header: 'Start' },
          { key: 'endTime', header: 'End' },
          { key: 'capacity', header: 'Capacity' },
          { key: 'students', header: 'Enrolled', render: (r) => (r._count as { students: number })?.students ?? 0 },
          { key: 'isActive', header: 'Status', render: (r) => <Badge>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
        ]}
      />
    </div>
  );
}
