import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export function AttendancePage() {
  const { hasRole } = useAuth();

  const { data: coachAttendance } = useQuery({
    queryKey: ['coach-attendance'],
    queryFn: async () => { const { data } = await api.get('/attendance/coach'); return data.data; },
  });

  const { data: studentAttendance, isLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: async () => { const { data } = await api.get('/attendance/student'); return data.data; },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Attendance</h2>
      {hasRole('COACH') && (
        <Card>
          <CardHeader><CardTitle>Mark Your Attendance</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Use GPS check-in from your mobile device within the academy's configured radius.
              One record per day — Present, Absent, or Late.
            </p>
          </CardContent>
        </Card>
      )}
      <DataTable
        title="Coach Attendance"
        data={coachAttendance || []}
        columns={[
          { key: 'coach', header: 'Coach', render: (r) => {
            const c = r.coach as { user: { firstName: string; lastName: string } };
            return `${c?.user?.firstName} ${c?.user?.lastName}`;
          }},
          { key: 'date', header: 'Date', render: (r) => formatDate(r.date as string) },
          { key: 'status', header: 'Status', render: (r) => <Badge>{r.status as string}</Badge> },
        ]}
      />
      <DataTable
        title="Student Attendance"
        data={studentAttendance || []}
        isLoading={isLoading}
        columns={[
          { key: 'student', header: 'Student', render: (r) => {
            const s = r.student as { firstName: string; lastName: string };
            return `${s?.firstName} ${s?.lastName}`;
          }},
          { key: 'batch', header: 'Batch', render: (r) => (r.batch as { name: string })?.name },
          { key: 'date', header: 'Date', render: (r) => formatDate(r.date as string) },
          { key: 'status', header: 'Status', render: (r) => <Badge>{r.status as string}</Badge> },
          { key: 'isLocked', header: 'Locked', render: (r) => r.isLocked ? 'Yes' : 'No' },
        ]}
      />
    </div>
  );
}
