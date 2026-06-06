import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';

export function StudentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await api.get('/students');
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Students</h2>
      <DataTable
        title="All Students"
        data={data || []}
        isLoading={isLoading}
        columns={[
          { key: 'name', header: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
          { key: 'sport', header: 'Sport', render: (r) => (r.sport as { name: string })?.name || '—' },
          { key: 'batch', header: 'Batch', render: (r) => (r.batch as { name: string })?.name || '—' },
          { key: 'plan', header: 'Plan', render: (r) => (r.membershipPlan as { name: string })?.name || '—' },
          { key: 'guardian', header: 'Guardian', render: (r) => r.guardianName as string },
          { key: 'status', header: 'Status', render: (r) => <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
        ]}
      />
    </div>
  );
}
