import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SportsPage } from '@/pages/SportsPage';
import { PlansPage } from '@/pages/PlansPage';
import { BatchesPage } from '@/pages/BatchesPage';
import { CoachesPage } from '@/pages/CoachesPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { FeesPage } from '@/pages/FeesPage';
import { AttendancePage } from '@/pages/AttendancePage';
import { PerformancePage } from '@/pages/PerformancePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ImportPage } from '@/pages/ImportPage';
import { AcademiesPage } from '@/pages/AcademiesPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sports" element={<SportsPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/batches" element={<BatchesPage />} />
              <Route path="/coaches" element={<CoachesPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/fees" element={<FeesPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/academies" element={<AcademiesPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
