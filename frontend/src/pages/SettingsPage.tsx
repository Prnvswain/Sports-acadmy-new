import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubscriptionWidget } from '@/components/SubscriptionBanner';

export function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data.data; },
  });

  const { register, handleSubmit, reset } = useForm();
  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch('/settings', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  if (data) reset(data);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <SubscriptionWidget />
      <Card>
        <CardHeader><CardTitle>Academy Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => update.mutate(d))} className="grid md:grid-cols-2 gap-4 max-w-2xl">
            <div><Label>Academy Name</Label><Input {...register('name')} defaultValue={data?.name} /></div>
            <div><Label>Email</Label><Input {...register('email')} defaultValue={data?.email} /></div>
            <div><Label>Phone</Label><Input {...register('phone')} defaultValue={data?.phone} /></div>
            <div><Label>Attendance Radius (meters)</Label><Input type="number" {...register('attendanceRadiusM')} defaultValue={data?.attendanceRadiusM} /></div>
            <div><Label>Receipt Prefix</Label><Input {...register('receiptPrefix')} defaultValue={data?.receiptPrefix} /></div>
            <div><Label>Registration Fee</Label><Input type="number" {...register('registrationFee')} defaultValue={data?.registrationFee} /></div>
            <div className="md:col-span-2"><Label>Address</Label><Input {...register('address')} defaultValue={data?.address} /></div>
            <div><Button type="submit">Save Settings</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
