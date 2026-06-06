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

const schema = z.object({ name: z.string().min(1), duration: z.coerce.number().int().positive(), multiplier: z.coerce.number().positive() });

export function PlansPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => { const { data } = await api.get('/plans'); return data.data; },
  });
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const create = useMutation({
    mutationFn: (body: z.infer<typeof schema>) => api.post('/plans', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plans'] }); reset(); setShowForm(false); },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Membership Plans</h2>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Plan</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => create.mutate(d))} className="grid md:grid-cols-3 gap-4">
              <div><Label>Name</Label><Input {...register('name')} placeholder="Quarterly" /></div>
              <div><Label>Duration (months)</Label><Input type="number" {...register('duration')} /></div>
              <div><Label>Multiplier</Label><Input type="number" step="0.1" {...register('multiplier')} /></div>
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" disabled={isSubmitting}>Save</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <DataTable
        title="All Plans"
        data={data || []}
        isLoading={isLoading}
        onAdd={() => setShowForm(true)}
        addLabel="Add Plan"
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'duration', header: 'Duration', render: (r) => `${r.duration} months` },
          { key: 'multiplier', header: 'Multiplier' },
          { key: 'isCustom', header: 'Type', render: (r) => r.isCustom ? 'Custom' : 'Standard' },
        ]}
      />
    </div>
  );
}
