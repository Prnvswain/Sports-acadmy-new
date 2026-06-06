import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';

export function ImportPage() {
  const [studentResult, setStudentResult] = useState<Record<string, unknown> | null>(null);
  const [coachResult, setCoachResult] = useState<Record<string, unknown> | null>(null);

  const importStudents = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/import/students', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data.data;
    },
    onSuccess: setStudentResult,
  });

  const importCoaches = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/import/coaches', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data.data;
    },
    onSuccess: setCoachResult,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bulk Import</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Students</CardTitle>
            <CardDescription>Download template, fill data, upload CSV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={() => window.open('/api/import/students/template', '_blank')}>
              <Download className="h-4 w-4" /> Download Template
            </Button>
            <InputFile onUpload={(f) => importStudents.mutate(f)} loading={importStudents.isPending} />
            {studentResult && <ImportResult result={studentResult} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Import Coaches</CardTitle>
            <CardDescription>Download template, fill data, upload CSV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={() => window.open('/api/import/coaches/template', '_blank')}>
              <Download className="h-4 w-4" /> Download Template
            </Button>
            <InputFile onUpload={(f) => importCoaches.mutate(f)} loading={importCoaches.isPending} />
            {coachResult && <ImportResult result={coachResult} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InputFile({ onUpload, loading }: { onUpload: (f: File) => void; loading: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <span className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
        <Upload className="h-4 w-4" /> {loading ? 'Uploading...' : 'Upload CSV'}
      </span>
      <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
    </label>
  );
}

function ImportResult({ result }: { result: Record<string, unknown> }) {
  const errors = result.errors as { row: number; message: string }[] | undefined;
  return (
    <div className="p-3 rounded-md bg-[var(--color-muted)] text-sm space-y-1">
      <p>Total: {result.total as number} | Success: {result.success as number} | Failed: {result.failed as number}</p>
      {errors?.length ? (
        <div className="mt-2 max-h-32 overflow-auto">
          {errors.map((e, i) => <p key={i} className="text-[var(--color-destructive)]">Row {e.row}: {e.message}</p>)}
        </div>
      ) : null}
    </div>
  );
}
