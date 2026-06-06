import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

const schema = z.object({ name: z.string().min(1), description: z.string().optional(), monthlyFee: z.coerce.number().min(0) });

export function SportsPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => { const { data } = await api.get('/sports'); return data.data; },
  });
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const create = useMutation({
    mutationFn: (body: z.infer<typeof schema>) => api.post('/sports', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sports'] }); reset(); setShowForm(false); },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sports</h2>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Sport</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => create.mutate(d))} className="grid md:grid-cols-3 gap-4">
              <div><Label>Name</Label><Input {...register('name')} /></div>
              <div><Label>Monthly Fee</Label><Input type="number" {...register('monthlyFee')} /></div>
              <div><Label>Description</Label><Input {...register('description')} /></div>
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" disabled={isSubmitting}>Save</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <DataTable
        title="All Sports"
        data={data || []}
        isLoading={isLoading}
        onAdd={() => setShowForm(true)}
        addLabel="Add Sport"
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'monthlyFee', header: 'Monthly Fee', render: (r) => formatCurrency(Number(r.monthlyFee)) },
          { key: 'students', header: 'Students', render: (r) => (r._count as { students: number })?.students ?? 0 },
          { key: 'batches', header: 'Batches', render: (r) => (r._count as { batches: number })?.batches ?? 0 },
          { key: 'isActive', header: 'Status', render: (r) => <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
        ]}
      />
    </div>
  );
}
