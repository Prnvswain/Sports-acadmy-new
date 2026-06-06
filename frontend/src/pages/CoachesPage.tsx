import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';

export function CoachesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      const { data } = await api.get('/coaches');
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Coaches</h2>
      <DataTable
        title="All Coaches"
        data={data || []}
        isLoading={isLoading}
        columns={[
          { key: 'name', header: 'Name', render: (r) => {
            const u = r.user as { firstName: string; lastName: string };
            return `${u?.firstName} ${u?.lastName}`;
          }},
          { key: 'email', header: 'Email', render: (r) => (r.user as { email: string })?.email },
          { key: 'phone', header: 'Phone' },
          { key: 'batches', header: 'Batches', render: (r) => (r.batchAssignments as unknown[])?.length ?? 0 },
        ]}
      />
    </div>
  );
}
