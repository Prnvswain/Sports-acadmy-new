import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';

export function AcademiesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['academies'],
    queryFn: async () => {
      const { data } = await api.get('/academies');
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Academies</h2>
      <DataTable
        title="All Academies"
        data={data || []}
        isLoading={isLoading}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'subscriptionPlan', header: 'Plan' },
          { key: 'status', header: 'Status', render: (r) => <Badge>{r.status as string}</Badge> },
          { key: 'students', header: 'Students', render: (r) => (r._count as { students: number })?.students ?? 0 },
          { key: 'coaches', header: 'Coaches', render: (r) => (r._count as { coaches: number })?.coaches ?? 0 },
        ]}
      />
    </div>
  );
}
