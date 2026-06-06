import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Users, GraduationCap, Calendar, DollarSign, AlertCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function DashboardPage() {
  const { hasRole } = useAuth();

  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/admin');
      return data.data;
    },
    enabled: hasRole('ACADEMY_ADMIN'),
  });

  const { data: coachData, isLoading: coachLoading } = useQuery({
    queryKey: ['coach-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/coach');
      return data.data;
    },
    enabled: hasRole('COACH'),
  });

  const { data: superData, isLoading: superLoading } = useQuery({
    queryKey: ['super-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/super-admin');
      return data.data;
    },
    enabled: hasRole('SUPER_ADMIN'),
  });

  if (hasRole('SUPER_ADMIN')) {
    if (superLoading) return <Loading />;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Platform Overview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Academies" value={superData?.totalAcademies} icon={Users} />
          <StatCard title="Active Academies" value={superData?.activeAcademies} icon={GraduationCap} />
          <StatCard title="Total Revenue" value={formatCurrency(superData?.totalRevenue || 0)} icon={DollarSign} />
        </div>
      </div>
    );
  }

  if (hasRole('COACH')) {
    if (coachLoading) return <Loading />;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Coach Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Today's Batches" value={coachData?.todayBatches?.length} icon={Calendar} />
          <StatCard title="Attendance Pending" value={coachData?.attendancePending} icon={AlertCircle} />
          <StatCard title="My Status Today" value={coachData?.ownAttendanceStatus || 'Not Marked'} icon={Users} />
        </div>
        <Card>
          <CardHeader><CardTitle>Today's Batches</CardTitle></CardHeader>
          <CardContent>
            {coachData?.todayBatches?.length ? (
              <div className="space-y-2">
                {coachData.todayBatches.map((b: { id: string; name: string; sport: string; startTime: string; endTime: string; studentCount: number }) => (
                  <div key={b.id} className="flex justify-between p-3 rounded-md border">
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-[var(--color-muted-foreground)]">{b.sport} · {b.startTime} - {b.endTime}</p>
                    </div>
                    <span className="text-sm">{b.studentCount} students</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--color-muted-foreground)]">No batches scheduled</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminLoading) return <Loading />;

  const cards = adminData?.cards;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Academy Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Active Students" value={cards?.activeStudents} icon={GraduationCap} />
        <StatCard title="Active Coaches" value={cards?.activeCoaches} icon={Users} />
        <StatCard title="Active Batches" value={cards?.activeBatches} icon={Calendar} />
        <StatCard title="Monthly Revenue" value={formatCurrency(cards?.monthlyRevenue || 0)} icon={DollarSign} />
        <StatCard title="Pending Dues" value={formatCurrency(cards?.pendingDues || 0)} icon={AlertCircle} />
        <StatCard title="Overdue Dues" value={formatCurrency(cards?.overdueDues || 0)} icon={AlertCircle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adminData?.charts?.revenueTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sports Distribution</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={adminData?.charts?.sportsDistribution || []} dataKey="students" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {(adminData?.charts?.sportsDistribution || []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Student Growth</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminData?.charts?.studentGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subscription Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="text-[var(--color-muted-foreground)]">Plan:</span> {adminData?.widgets?.subscription?.subscriptionPlan}</p>
              <p><span className="text-[var(--color-muted-foreground)]">Students:</span> {adminData?.widgets?.subscription?.studentCount}/{adminData?.widgets?.subscription?.maxStudents}</p>
              <p><span className="text-[var(--color-muted-foreground)]">Coaches:</span> {adminData?.widgets?.subscription?.coachCount}/{adminData?.widgets?.subscription?.maxCoaches}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number | undefined; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">{title}</CardTitle>
        <Icon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value ?? '—'}</div>
      </CardContent>
    </Card>
  );
}

function Loading() {
  return <div className="animate-pulse text-[var(--color-muted-foreground)]">Loading dashboard...</div>;
}
