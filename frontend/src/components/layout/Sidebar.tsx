import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, Calendar, Trophy,
  DollarSign, FileText, Settings, Building2, Bell, Upload,
  Dumbbell, Layers,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sports', icon: Dumbbell, label: 'Sports' },
  { to: '/plans', icon: Layers, label: 'Plans' },
  { to: '/batches', icon: Calendar, label: 'Batches' },
  { to: '/coaches', icon: Users, label: 'Coaches' },
  { to: '/students', icon: GraduationCap, label: 'Students' },
  { to: '/fees', icon: DollarSign, label: 'Fees' },
  { to: '/attendance', icon: Calendar, label: 'Attendance' },
  { to: '/performance', icon: Trophy, label: 'Performance' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/import', icon: Upload, label: 'Bulk Import' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const coachLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/batches', icon: Calendar, label: 'My Batches' },
  { to: '/attendance', icon: Calendar, label: 'Attendance' },
  { to: '/performance', icon: Trophy, label: 'Performance' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const superAdminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Platform' },
  { to: '/academies', icon: Building2, label: 'Academies' },
];

export function Sidebar() {
  const { hasRole, profile } = useAuth();
  const links = hasRole('SUPER_ADMIN')
    ? superAdminLinks
    : hasRole('COACH')
    ? coachLinks
    : adminLinks;

  return (
    <aside className="w-64 border-r bg-[var(--color-card)] min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-[var(--color-primary)]">SAMS</h1>
        <p className="text-xs text-[var(--color-muted-foreground)] truncate">
          {profile?.academy?.name || 'Platform Admin'}
        </p>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]'
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
