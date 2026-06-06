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

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  sportId: z.string().optional(),
  membershipPlanId: z.string().optional(),
  batchId: z.string().optional(),
});

export function StudentsPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await api.get('/students');
      return data.data;
    },
  });

  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => { const { data } = await api.get('/sports'); return data.data; },
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => { const { data } = await api.get('/plans'); return data.data; },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const create = useMutation({
    mutationFn: (body: z.infer<typeof schema>) => api.post('/students', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); reset(); setShowForm(false); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Students</h2>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Student</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => create.mutate(d))} className="grid md:grid-cols-3 gap-4">
              <div><Label>First Name</Label><Input {...register('firstName')} /></div>
              <div><Label>Last Name</Label><Input {...register('lastName')} /></div>
              <div><Label>Email</Label><Input {...register('email')} /></div>
              <div><Label>Phone</Label><Input {...register('phone')} /></div>
              <div><Label>Guardian Name</Label><Input {...register('guardianName')} /></div>
              <div><Label>Guardian Phone</Label><Input {...register('guardianPhone')} /></div>
              <div>
                <Label>Sport</Label>
                <select className="flex h-10 w-full rounded-md border px-3 text-sm" {...register('sportId')}>
                  <option value="">Select sport</option>
                  {sports?.map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Plan</Label>
                <select className="flex h-10 w-full rounded-md border px-3 text-sm" {...register('membershipPlanId')}>
                  <option value="">Select plan</option>
                  {plans?.map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" disabled={isSubmitting}>Save Student</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        title="All Students"
        data={data || []}
        isLoading={isLoading}
        onAdd={() => setShowForm(true)}
        addLabel="Add Student"
        columns={[
          { key: 'name', header: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
          { key: 'sport', header: 'Sport', render: (r) => (r.sport as { name: string })?.name || '—' },
          { key: 'batch', header: 'Batch', render: (r) => (r.batch as { name: string })?.name || '—' },
          { key: 'plan', header: 'Plan', render: (r) => (r.membershipPlan as { name: string })?.name || '—' },
          { key: 'guardian', header: 'Guardian', render: (r) => r.guardianName as string },
          { key: 'status', header: 'Status', render: (r) => <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
          { key: 'actions', header: '', render: (r) => r.isActive ? (
            <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id as string)}>Delete</Button>
          ) : null },
        ]}
      />
    </div>
  );
}
