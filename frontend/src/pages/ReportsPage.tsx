import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/DataTable';
import { Download } from 'lucide-react';

const reportTypes = [
  { key: 'students', label: 'Student Report' },
  { key: 'attendance', label: 'Attendance Report' },
  { key: 'revenue', label: 'Revenue Report' },
  { key: 'performance', label: 'Performance Report' },
  { key: 'coaches', label: 'Coach Report' },
  { key: 'due-fees', label: 'Due Fees Report' },
];

export function ReportsPage() {
  const [selected, setSelected] = useState('students');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report', selected, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const { data } = await api.get(`/reports/${selected}?${params}`);
      return data.data;
    },
    enabled: false,
  });

  const handleExport = () => {
    const params = new URLSearchParams({ format: 'csv' });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    window.open(`/api/reports/${selected}?${params}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reports</h2>
      <Card>
        <CardHeader><CardTitle>Generate Report</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {reportTypes.map((r) => (
              <Button key={r.key} variant={selected === r.key ? 'default' : 'outline'} size="sm" onClick={() => setSelected(r.key)}>
                {r.label}
              </Button>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            <div className="flex items-end gap-2">
              <Button onClick={() => refetch()}>Generate</Button>
              <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" /> CSV</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {data && (
        <DataTable
          title={`${reportTypes.find((r) => r.key === selected)?.label} Results`}
          data={Array.isArray(data) ? data : []}
          isLoading={isLoading}
          columns={
            data?.[0]
              ? Object.keys(data[0]).slice(0, 6).map((k) => ({ key: k, header: k }))
              : []
          }
        />
      )}
    </div>
  );
}
