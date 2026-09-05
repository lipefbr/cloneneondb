'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminShell, type AdminView, type AdminUser } from './shell';
import { OverviewView } from './views/overview';
import { UsersView } from './views/users';
import { ProjectsView } from './views/projects';
import { PlansView } from './views/plans';
import { PaymentsView } from './views/payments';
import { ActivitiesView } from './views/activities';
import { SettingsView } from './views/settings';

export function AdminPage({ initialSub }: { initialSub?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<AdminView>(
    (initialSub as AdminView) || 'overview'
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (!data.user) {
          window.location.href = '/?view=login';
          return;
        }
        if (data.user.role !== 'admin') {
          window.location.href = '/?view=dashboard';
          return;
        }
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) window.location.href = '/?view=login';
      });
    return () => { cancelled = true; };
  }, []);

  const handleNavigate = (view: AdminView) => {
    setActive(view);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', 'admin');
    params.set('sub', view);
    router.replace(`/?${params.toString()}`, { scroll: false });
    window.scrollTo(0, 0);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminShell user={user} active={active} onNavigate={handleNavigate}>
      {active === 'overview' && <OverviewView onNavigate={handleNavigate} />}
      {active === 'users' && <UsersView />}
      {active === 'projects' && <ProjectsView />}
      {active === 'plans' && <PlansView />}
      {active === 'payments' && <PaymentsView />}
      {active === 'activities' && <ActivitiesView />}
      {active === 'settings' && <SettingsView />}
    </AdminShell>
  );
}
