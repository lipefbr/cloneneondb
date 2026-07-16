'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LandingPage } from '@/components/landing/landing-page';
import { AuthPage } from '@/components/auth/auth-page';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { Loader2 } from 'lucide-react';

type View = 'landing' | 'login' | 'register' | 'dashboard';

function PageContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') as View | null;
  const sub = searchParams.get('sub') as string | null;
  const pid = searchParams.get('pid') as string | null;

  // Compute view directly from URL — no state needed
  const currentView: View =
    view === 'login' || view === 'register' || view === 'dashboard'
      ? view
      : 'landing';

  if (currentView === 'dashboard') {
    return <DashboardPage initialSub={sub || undefined} initialPid={pid || undefined} />;
  }

  if (currentView === 'login') {
    return <AuthPage mode="login" />;
  }

  if (currentView === 'register') {
    return <AuthPage mode="register" />;
  }

  return <LandingPage />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
