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
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  sportId: z.string().uuid(),
  name: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  capacity: z.coerce.number().int().positive(),
});

export function BatchesPage() {
  const { hasRole } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => { const { data } = await api.get('/batches'); return data.data; },
  });

  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => { const { data } = await api.get('/sports'); return data.data; },
    enabled: hasRole('ACADEMY_ADMIN'),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { startTime: '06:00', endTime: '08:00', capacity: 20 },
  });

  const create = useMutation({
    mutationFn: (body: z.infer<typeof schema>) => api.post('/batches', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); reset(); setShowForm(false); },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Batches</h2>

      {showForm && hasRole('ACADEMY_ADMIN') && (
        <Card>
          <CardHeader><CardTitle>Add Batch</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => create.mutate(d))} className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Sport</Label>
                <select className="flex h-10 w-full rounded-md border px-3 text-sm" {...register('sportId')}>
                  <option value="">Select sport</option>
                  {sports?.map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><Label>Name</Label><Input {...register('name')} /></div>
              <div><Label>Capacity</Label><Input type="number" {...register('capacity')} /></div>
              <div><Label>Start Time</Label><Input type="time" {...register('startTime')} /></div>
              <div><Label>End Time</Label><Input type="time" {...register('endTime')} /></div>
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" disabled={isSubmitting}>Save Batch</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        title="All Batches"
        data={data || []}
        isLoading={isLoading}
        onAdd={hasRole('ACADEMY_ADMIN') ? () => setShowForm(true) : undefined}
        addLabel="Add Batch"
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
