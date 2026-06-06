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

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export function CoachesPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      const { data } = await api.get('/coaches');
      return data.data;
    },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: 'Coach@123' },
  });

  const create = useMutation({
    mutationFn: (body: z.infer<typeof schema>) => api.post('/coaches', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaches'] }); reset(); setShowForm(false); },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Coaches</h2>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Coach</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => create.mutate(d))} className="grid md:grid-cols-3 gap-4">
              <div><Label>First Name</Label><Input {...register('firstName')} /></div>
              <div><Label>Last Name</Label><Input {...register('lastName')} /></div>
              <div><Label>Email</Label><Input {...register('email')} /></div>
              <div><Label>Phone</Label><Input {...register('phone')} /></div>
              <div><Label>Password</Label><Input type="password" {...register('password')} /></div>
              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" disabled={isSubmitting}>Save Coach</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        title="All Coaches"
        data={data || []}
        isLoading={isLoading}
        onAdd={() => setShowForm(true)}
        addLabel="Add Coach"
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
