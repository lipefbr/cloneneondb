'use client';

import { useEffect, useState } from 'react';
import {
  Database,
  GitBranch,
  Key,
  Activity,
  TrendingUp,
  HardDrive,
  Cpu,
  ArrowRight,
  Plus,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DashboardView } from './shell';

type Stats = {
  projects: number;
  branches: number;
  apiKeys: number;
  activities: number;
  computeHours: string;
  storageMB: string;
};

type Activity = {
  id: string;
  action: string;
  target: string;
  createdAt: string;
};

const actionLabels: Record<string, string> = {
  'project.created': 'Projeto criado',
  'project.deleted': 'Projeto deletado',
  'branch.created': 'Branch criado',
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export function OverviewView({ onNavigate }: { onNavigate: (v: DashboardView, opts?: any) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/activity').then(r => r.json()),
      fetch('/api/projects/list').then(r => r.json()),
    ]).then(([s, a, p]) => {
      setStats(s.stats);
      setActivities(a.activities || []);
      setProjects(p.projects || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 h-32 animate-pulse bg-muted/30" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Projetos',
      value: stats?.projects ?? 0,
      icon: Database,
      hint: 'Bancos ativos',
      onClick: () => onNavigate('projects'),
    },
    {
      label: 'Branches',
      value: stats?.branches ?? 0,
      icon: GitBranch,
      hint: 'Branches totais',
      onClick: () => onNavigate('branches'),
    },
    {
      label: 'API Keys',
      value: stats?.apiKeys ?? 0,
      icon: Key,
      hint: 'Chaves ativas',
      onClick: () => onNavigate('api-keys'),
    },
    {
      label: 'Storage',
      value: `${stats?.storageMB ?? 0} MB`,
      icon: HardDrive,
      hint: 'Em todos os projetos',
      onClick: () => onNavigate('billing'),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Visão geral</h1>
          <p className="mt-1 text-muted-foreground">
            Monitore seus bancos, branches e uso.
          </p>
        </div>
        <Button onClick={() => onNavigate('projects', { action: 'new' })} className="btn-shine">
          <Plus className="mr-1 h-4 w-4" />
          Novo projeto
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={c.onClick}
            className="text-left"
          >
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
                <p className="text-xs text-muted-foreground/70 mt-1">{c.hint}</p>
              </div>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent projects */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Projetos recentes</h2>
              <p className="text-sm text-muted-foreground">Seus bancos mais recentes</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('projects')}>
              Ver todos
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 rounded-md border border-border bg-muted/30 flex items-center justify-center mb-4">
                <Database className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum projeto ainda. Crie seu primeiro banco.
              </p>
              <Button onClick={() => onNavigate('projects', { action: 'new' })} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Criar projeto
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onNavigate('project-detail', { id: p.id })}
                  className="w-full flex items-center gap-4 p-3 rounded-md border border-border hover:border-foreground/30 hover:bg-accent/30 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-md bg-foreground/5 border border-border flex items-center justify-center flex-shrink-0">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{p.name}</p>
                      {p.branches.some((b: any) => b.isDefault) && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          main
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.region} · PG {p.pgVersion} · {p.branches.length} branch(es)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-status-pulse" />
                    {p.status}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Activity feed */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-1">Atividade recente</h2>
          <p className="text-sm text-muted-foreground mb-5">Suas últimas ações</p>

          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Sem atividade ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 8).map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-foreground mt-1.5" />
                    {a !== activities[activities.length - 1] && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-full bg-border" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-sm">
                      <span className="font-medium">{actionLabels[a.action] || a.action}</span>{' '}
                      <span className="text-muted-foreground">{a.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Usage */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Uso neste mês</h2>
            <p className="text-sm text-muted-foreground">Consumo de recursos</p>
          </div>
          <Badge variant="outline">Plano Free</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UsageBar
            icon={Cpu}
            label="Compute"
            current={stats?.computeHours ?? '0'}
            limit="100h"
            percent={Math.min(100, (parseFloat(stats?.computeHours || '0') / 100) * 100)}
          />
          <UsageBar
            icon={HardDrive}
            label="Storage"
            current={`${stats?.storageMB ?? 0} MB`}
            limit="500 MB"
            percent={Math.min(100, ((stats?.storageMB ? parseFloat(stats.storageMB) : 0) / 500) * 100)}
          />
          <UsageBar
            icon={TrendingUp}
            label="Projetos"
            current={String(stats?.projects ?? 0)}
            limit="1"
            percent={Math.min(100, ((stats?.projects ?? 0) / 1) * 100)}
          />
        </div>
      </Card>
    </div>
  );
}

function UsageBar({
  icon: Icon,
  label,
  current,
  limit,
  percent,
}: {
  icon: any;
  label: string;
  current: string;
  limit: string;
  percent: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {current} / {limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full bg-foreground transition-all', percent > 80 && 'bg-foreground')}
          style={{ width: `${Math.max(2, percent)}%` }}
        />
      </div>
    </div>
  );
}
