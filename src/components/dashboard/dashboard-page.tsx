'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DashboardShell, type User, type DashboardView } from './shell';
import { OverviewView } from './overview';
import { ProjectsView } from './projects';
import { ProjectDetailView } from './project-detail';
import { SqlEditorView } from './sql-editor';
import { ApiKeysView } from './api-keys';
import { SettingsView, BillingView, BranchesView } from './settings-billing';

const validViews: DashboardView[] = [
  'overview',
  'projects',
  'project-detail',
  'sql-editor',
  'branches',
  'api-keys',
  'settings',
  'billing',
];

function normalizeSub(sub: string | undefined): DashboardView {
  if (!sub) return 'overview';
  if (sub === 'project') return 'project-detail';
  if (validViews.includes(sub as DashboardView)) return sub as DashboardView;
  return 'overview';
}

export function DashboardPage({ initialSub, initialPid }: { initialSub?: string; initialPid?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<DashboardView>(normalizeSub(initialSub));
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialPid || null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [projectAction, setProjectAction] = useState<string | undefined>();

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
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) window.location.href = '/?view=login';
      });
    return () => { cancelled = true; };
  }, []);

  const handleNavigate = (view: DashboardView, opts?: any) => {
    setActive(view);
    if (opts?.id) setActiveProjectId(opts.id);
    if (opts?.branchId !== undefined) setActiveBranchId(opts.branchId);
    if (opts?.action) setProjectAction(opts.action);
    else setProjectAction(undefined);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', 'dashboard');
    if (view === 'overview') {
      params.delete('sub');
      params.delete('pid');
    } else if (view === 'project-detail') {
      params.set('sub', 'project');
      if (opts?.id) params.set('pid', opts.id);
    } else {
      params.set('sub', view);
      params.delete('pid');
    }
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
    <DashboardShell user={user} active={active} onNavigate={handleNavigate}>
      {active === 'overview' && <OverviewView onNavigate={handleNavigate} />}
      {active === 'projects' && (
        <ProjectsView onNavigate={handleNavigate} initialAction={projectAction} />
      )}
      {active === 'project-detail' && activeProjectId && (
        <ProjectDetailView projectId={activeProjectId} onNavigate={handleNavigate} />
      )}
      {active === 'sql-editor' && (
        <SqlEditorView projectId={activeProjectId || undefined} branchId={activeBranchId || undefined} />
      )}
      {active === 'branches' && <BranchesView onNavigate={handleNavigate} />}
      {active === 'api-keys' && <ApiKeysView />}
      {active === 'settings' && <SettingsView onNavigate={handleNavigate} />}
      {active === 'billing' && <BillingView />}
    </DashboardShell>
  );
}
