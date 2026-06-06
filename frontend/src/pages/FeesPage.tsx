import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export function FeesPage() {
  const { data: dashboard } = useQuery({
    queryKey: ['fees-dashboard'],
    queryFn: async () => { const { data } = await api.get('/fees/dashboard'); return data.data; },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['fees'],
    queryFn: async () => { const { data } = await api.get('/fees'); return data.data; },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Fees & Accounts</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--color-muted-foreground)]">Total Revenue</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatCurrency(dashboard?.totalRevenue || 0)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--color-muted-foreground)]">Monthly Revenue</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatCurrency(dashboard?.monthlyRevenue || 0)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--color-muted-foreground)]">Pending Dues</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatCurrency(dashboard?.pendingDues || 0)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--color-muted-foreground)]">Overdue Dues</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-[var(--color-destructive)]">{formatCurrency(dashboard?.overdueDues || 0)}</CardContent></Card>
      </div>
      <DataTable
        title="Fee Records"
        data={data || []}
        isLoading={isLoading}
        columns={[
          { key: 'receiptNumber', header: 'Receipt #' },
          { key: 'student', header: 'Student', render: (r) => { const s = r.student as { firstName: string; lastName: string }; return `${s?.firstName} ${s?.lastName}`; }},
          { key: 'amount', header: 'Amount', render: (r) => formatCurrency(Number(r.amount)) },
          { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'PAID' ? 'default' : r.status === 'OVERDUE' ? 'destructive' : 'secondary'}>{r.status as string}</Badge> },
          { key: 'dueDate', header: 'Due Date', render: (r) => formatDate(r.dueDate as string) },
        ]}
      />
    </div>
  );
}
