import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

export function PerformancePage() {
  const { hasRole } = useAuth();
  const [studentId, setStudentId] = useState('');

  const { data: attributes } = useQuery({
    queryKey: ['performance-attributes'],
    queryFn: async () => { const { data } = await api.get('/performance/attributes'); return data.data; },
  });

  const { data: requests } = useQuery({
    queryKey: ['attribute-requests'],
    queryFn: async () => { const { data } = await api.get('/performance/attribute-requests'); return data.data; },
    enabled: hasRole('ACADEMY_ADMIN'),
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => { const { data } = await api.get('/students'); return data.data; },
  });

  const { data: performance } = useQuery({
    queryKey: ['performance-scores', studentId],
    queryFn: async () => {
      const { data } = await api.get(`/performance/scores/${studentId}`);
      return data.data;
    },
    enabled: !!studentId,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Performance</h2>

      {hasRole('COACH') && (
        <Card>
          <CardHeader><CardTitle>Submit Scores</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Score students 1–10 on approved attributes. Request new attributes for admin approval.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Student Performance Charts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <Label>Select Student</Label>
            <select
              className="flex h-10 w-full rounded-md border px-3 text-sm mt-1"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Choose student...</option>
              {students?.map((s: { id: string; firstName: string; lastName: string }) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>

          {performance?.radarData?.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performance.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="attribute" />
                    <PolarRadiusAxis domain={[0, 10]} />
                    <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performance.scores?.slice(0, 20).reverse().map((s: { scoredAt: string; score: number; attribute: { name: string } }, i: number) => ({
                    idx: i + 1,
                    score: s.score,
                    label: s.attribute?.name,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="idx" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DataTable
        title="Performance Attributes"
        data={attributes || []}
        columns={[
          { key: 'name', header: 'Attribute' },
          { key: 'description', header: 'Description' },
          { key: 'isActive', header: 'Status', render: (r) => <Badge>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
        ]}
      />

      {hasRole('ACADEMY_ADMIN') && (
        <DataTable
          title="Attribute Requests"
          data={requests || []}
          columns={[
            { key: 'name', header: 'Requested Attribute' },
            { key: 'requester', header: 'Coach', render: (r) => {
              const u = r.requester as { firstName: string; lastName: string };
              return `${u?.firstName} ${u?.lastName}`;
            }},
            { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'PENDING' ? 'secondary' : 'default'}>{r.status as string}</Badge> },
          ]}
        />
      )}
    </div>
  );
}
