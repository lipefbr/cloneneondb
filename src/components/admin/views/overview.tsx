'use client';

import { useEffect, useState } from 'react';
import {
  Users, Database, GitBranch, Key, HardDrive, Cpu,
  TrendingUp, AlertTriangle, Server, DollarSign, ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AdminView } from '../shell';

type Stats = {
  users: number;
  projects: number;
  branches: number;
  apiKeys: number;
  usersByPlan: { plan: string; count: number }[];
};

type PostgresStats = {
  totalDatabases?: number;
  totalRoles?: number;
  activeConnections?: number;
  totalConnections?: number;
  maxConnections?: number;
  largestDatabases?: { name: string; size_pretty: string; size_bytes: number }[];
  error?: string;
};

export function OverviewView({ onNavigate }: { onNavigate: (v: AdminView) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pgStats, setPgStats] = useState<PostgresStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        setStats(data.stats);
        setPgStats(data.postgres);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 h-32 animate-pulse bg-muted/30" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Usuários', value: stats?.users ?? 0, icon: Users, onClick: () => onNavigate('users') },
    { label: 'Projetos', value: stats?.projects ?? 0, icon: Database, onClick: () => onNavigate('projects') },
    { label: 'Branches', value: stats?.branches ?? 0, icon: GitBranch, onClick: () => onNavigate('projects') },
    { label: 'API Keys', value: stats?.apiKeys ?? 0, icon: Key, onClick: () => onNavigate('users') },
  ];

  const connPercent = pgStats?.maxConnections
    ? Math.min(100, ((pgStats.activeConnections || 0) / pgStats.maxConnections) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <button key={c.label} onClick={c.onClick} className="text-left">
            <Card className="p-5 hover:border-foreground/30 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background">
                  <c.icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-semibold tabular-nums">{c.value}</p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
              </div>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Postgres stats */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <h2 className="text-lg font-semibold">PostgreSQL</h2>
            </div>
            <Badge variant="outline">{pgStats?.maxConnections || 200} max conns</Badge>
          </div>

          {pgStats?.error ? (
            <div className="flex items-center gap-3 p-3 rounded-md bg-destructive/10 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>{pgStats.error}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Bancos reais</p>
                  <p className="text-xl font-semibold tabular-nums">{pgStats?.totalDatabases ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Roles</p>
                  <p className="text-xl font-semibold tabular-nums">{pgStats?.totalRoles ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conexões ativas</p>
                  <p className="text-xl font-semibold tabular-nums">{pgStats?.activeConnections ?? 0}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Uso de conexões</span>
                  <span className="text-xs tabular-nums">
                    {pgStats?.activeConnections ?? 0} / {pgStats?.maxConnections || 200}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-foreground transition-all" style={{ width: `${Math.max(2, connPercent)}%` }} />
                </div>
              </div>

              {/* Largest databases */}
              {pgStats?.largestDatabases && pgStats.largestDatabases.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-medium mb-3">Maiores bancos</p>
                  <div className="space-y-2">
                    {pgStats.largestDatabases.slice(0, 5).map(db => (
                      <div key={db.name} className="flex items-center justify-between text-xs">
                        <code className="font-mono truncate">{db.name}</code>
                        <span className="text-muted-foreground tabular-nums">{db.size_pretty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Users by plan */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Distribuição por plano</h2>
          </div>

          {stats?.usersByPlan && stats.usersByPlan.length > 0 ? (
            <div className="space-y-4">
              {stats.usersByPlan.map(p => {
                const total = stats.users || 1;
                const percent = (p.count / total) * 100;
                return (
                  <div key={p.plan}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{p.plan}</span>
                      <span className="text-xs tabular-nums">{p.count} ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-foreground" style={{ width: `${Math.max(2, percent)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" onClick={() => onNavigate('users')} className="justify-start">
            <Users className="mr-2 h-4 w-4" />
            Gerenciar usuários
          </Button>
          <Button variant="outline" onClick={() => onNavigate('plans')} className="justify-start">
            <TrendingUp className="mr-2 h-4 w-4" />
            Editar planos
          </Button>
          <Button variant="outline" onClick={() => onNavigate('payments')} className="justify-start">
            <DollarSign className="mr-2 h-4 w-4" />
            Ver pagamentos
          </Button>
          <Button variant="outline" onClick={() => onNavigate('settings')} className="justify-start">
            <Server className="mr-2 h-4 w-4" />
            Configurações
          </Button>
        </div>
      </Card>
    </div>
  );
}
