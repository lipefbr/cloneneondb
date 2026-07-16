'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Database,
  GitBranch,
  Copy,
  Check,
  Plus,
  Terminal,
  Table,
  Settings,
  ExternalLink,
  Loader2,
  ChevronDown,
  Activity,
  Clock,
  Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { DashboardView } from './shell';
import { cn } from '@/lib/utils';

type Connection = {
  id: string;
  role: string;
  password: string;
  database: string;
  pooled: boolean;
};

type Branch = {
  id: string;
  name: string;
  isDefault: boolean;
  status: string;
  createdAt: string;
  connections: Connection[];
};

type Project = {
  id: string;
  name: string;
  region: string;
  pgVersion: string;
  status: string;
  size: string;
  createdAt: string;
  branches: Branch[];
};

export function ProjectDetailView({
  projectId,
  onNavigate,
}: {
  projectId: string;
  onNavigate: (v: DashboardView, opts?: any) => void;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [newBranchOpen, setNewBranchOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (cancelled) return;
      if (res.ok) {
        setProject(data.project);
        if (data.project.branches.length > 0 && !activeBranchId) {
          setActiveBranchId(data.project.branches[0].id);
        }
      }
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [projectId, activeBranchId]);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    if (res.ok) {
      setProject(data.project);
      if (data.project.branches.length > 0 && !activeBranchId) {
        setActiveBranchId(data.project.branches[0].id);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => onNavigate('projects')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para projetos
        </Button>
      </div>
    );
  }

  const activeBranch = project.branches.find(b => b.id === activeBranchId) || project.branches[0];
  const directConn = activeBranch?.connections.find(c => !c.pooled);
  const pooledConn = activeBranch?.connections.find(c => c.pooled);

  const hostname = `ep-${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${project.region}.neondb.dev`;

  const buildUri = (c: Connection | undefined, pooled: boolean) => {
    if (!c) return '';
    const host = pooled ? hostname.replace('ep-', 'ep-pooled-') : hostname;
    return `postgresql://${c.role}:${c.password}@${host}/${c.database}?sslmode=require`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb + header */}
      <div className="space-y-4">
        <button
          onClick={() => onNavigate('projects')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Projetos
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-md bg-foreground/5 border border-border flex items-center justify-center">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span>{project.region}</span>
                <span>·</span>
                <span>PG {project.pgVersion}</span>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-status-pulse" />
                  {project.status}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onNavigate('sql-editor', { projectId, branchId: activeBranchId })}>
              <Terminal className="mr-1 h-4 w-4" />
              SQL Editor
            </Button>
            <Button variant="outline" onClick={() => setNewBranchOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Novo branch
            </Button>
          </div>
        </div>
      </div>

      {/* Branch selector */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium">
            <GitBranch className="h-4 w-4" />
            Branch:
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {project.branches.map(b => (
              <button
                key={b.id}
                onClick={() => setActiveBranchId(b.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm border transition-colors flex items-center gap-2',
                  b.id === activeBranchId
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background hover:bg-accent'
                )}
              >
                {b.name}
                {b.isDefault && (
                  <span className={cn(
                    'text-[10px] px-1 py-0.5 rounded',
                    b.id === activeBranchId ? 'bg-background/20' : 'bg-muted'
                  )}>
                    DEFAULT
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="connection">
            <Database className="mr-2 h-4 w-4" />
            Conexão
          </TabsTrigger>
          <TabsTrigger value="tables">
            <Table className="mr-2 h-4 w-4" />
            Tabelas
          </TabsTrigger>
          <TabsTrigger value="branches">
            <GitBranch className="mr-2 h-4 w-4" />
            Branches
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Atividade
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Config
          </TabsTrigger>
        </TabsList>

        {/* Connection tab */}
        <TabsContent value="connection" className="space-y-4">
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Connection string</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use esta string para conectar ao seu banco no branch <span className="font-mono text-foreground">{activeBranch?.name}</span>.
              </p>
            </div>

            {directConn && (
              <ConnectionField
                label="Direct connection"
                desc="Use para conexões persistentes (longas)"
                uri={buildUri(directConn, false)}
              />
            )}

            {pooledConn && (
              <ConnectionField
                label="Pooled connection"
                desc="Use para serverless / edge functions (com PgBouncer)"
                uri={buildUri(pooledConn, true)}
                badge="Recomendado"
              />
            )}

            {/* Raw params */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <ParamField label="Host" value={hostname} />
              <ParamField label="Port" value="5432" />
              <ParamField label="Database" value={directConn?.database || 'neondb'} />
              <ParamField label="User" value={directConn?.role || 'neondb'} />
              <ParamField label="Password" value={directConn?.password || ''} mono />
              <ParamField label="SSL Mode" value="require" />
            </div>
          </Card>

          {/* Quick start */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Início rápido</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: 'Node.js', cmd: 'npm install pg' },
                { name: 'Python', cmd: 'pip install psycopg2' },
                { name: 'Go', cmd: 'go get github.com/lib/pq' },
              ].map(q => (
                <div key={q.name} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{q.name}</span>
                    <CopyButton text={q.cmd} />
                  </div>
                  <code className="text-xs font-mono text-muted-foreground">{q.cmd}</code>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tables tab */}
        <TabsContent value="tables">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Tabelas</h2>
                <p className="text-sm text-muted-foreground">Schema: public</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('sql-editor', { projectId, branchId: activeBranchId })}
              >
                <Terminal className="mr-1 h-4 w-4" />
                Abrir SQL
              </Button>
            </div>

            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Tabela</th>
                    <th className="text-left px-4 py-2.5 font-medium">Linhas (est.)</th>
                    <th className="text-left px-4 py-2.5 font-medium">Tamanho</th>
                    <th className="text-left px-4 py-2.5 font-medium">Criada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'users', rows: 1248, size: '256 KB', created: '2 dias atrás' },
                    { name: 'orders', rows: 5421, size: '1.2 MB', created: '2 dias atrás' },
                    { name: 'products', rows: 87, size: '48 KB', created: '2 dias atrás' },
                    { name: 'sessions', rows: 312, size: '128 KB', created: '2 dias atrás' },
                  ].map(t => (
                    <tr key={t.name} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-mono">{t.name}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{t.rows.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.size}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Branches tab */}
        <TabsContent value="branches" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Branches</h2>
                <p className="text-sm text-muted-foreground">
                  Cada branch é uma cópia isolada do banco.
                </p>
              </div>
              <Button onClick={() => setNewBranchOpen(true)} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Novo branch
              </Button>
            </div>

            <div className="space-y-2">
              {project.branches.map(b => (
                <div
                  key={b.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-md border transition-colors cursor-pointer',
                    b.id === activeBranchId
                      ? 'border-foreground/30 bg-accent/30'
                      : 'border-border hover:bg-accent/20'
                  )}
                  onClick={() => setActiveBranchId(b.id)}
                >
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{b.name}</span>
                      {b.isDefault && <Badge variant="outline" className="text-[10px] py-0">DEFAULT</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Criado em {new Date(b.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-status-pulse" />
                    <span className="text-xs text-muted-foreground">{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value="activity">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Atividade do projeto</h2>
            <div className="space-y-3 text-sm">
              {[
                { action: 'Branch criado', target: 'main', time: '2 dias atrás' },
                { action: 'Projeto criado', target: project.name, time: '2 dias atrás' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">
                    <span className="font-medium">{a.action}</span>{' '}
                    <span className="text-muted-foreground">{a.target}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Settings tab */}
        <TabsContent value="settings">
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Configurações</h2>
              <p className="text-sm text-muted-foreground">Gerencie este projeto.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <Input value={project.name} readOnly className="mt-1 font-mono" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ID</Label>
                  <Input value={project.id} readOnly className="mt-1 font-mono text-xs" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Região</Label>
                  <Input value={project.region} readOnly className="mt-1 font-mono" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Versão PG</Label>
                  <Input value={project.pgVersion} readOnly className="mt-1 font-mono" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Zona de perigo
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Deletar o projeto remove permanentemente o banco e todos os branches.
              </p>
              <Button
                variant="outline"
                className="border-foreground text-foreground hover:bg-foreground hover:text-background"
                onClick={async () => {
                  if (!confirm(`Deletar projeto "${project.name}" permanentemente?`)) return;
                  const res = await fetch(`/api/projects/${projectId}/delete`, { method: 'DELETE' });
                  if (res.ok) {
                    toast.success('Projeto deletado');
                    onNavigate('projects');
                  }
                }}
              >
                Deletar projeto
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <NewBranchDialog
        open={newBranchOpen}
        onOpenChange={setNewBranchOpen}
        parentBranchName={activeBranch?.name || 'main'}
        onCreate={async (name) => {
          const res = await fetch(`/api/projects/${projectId}/branches/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parentBranchId: activeBranch?.id }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setNewBranchOpen(false);
          load();
          toast.success(`Branch "${name}" criado`);
        }}
      />
    </div>
  );
}

function ConnectionField({
  label,
  desc,
  uri,
  badge,
}: {
  label: string;
  desc: string;
  uri: string;
  badge?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        {badge && (
          <Badge variant="outline" className="text-[10px] py-0">{badge}</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
      <div className="flex items-stretch gap-2">
        <div className="flex-1 rounded-md border border-border bg-muted/30 px-3 py-2.5 font-mono text-xs overflow-x-auto">
          <span className="break-all">{uri}</span>
        </div>
        <CopyButton text={uri} />
      </div>
    </div>
  );
}

function ParamField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1 flex items-stretch gap-2">
        <Input
          value={value}
          readOnly
          className={cn('h-8 text-xs', mono && 'font-mono')}
        />
        <CopyButton text={value} small />
      </div>
    </div>
  );
}

function CopyButton({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size={small ? 'sm' : 'default'}
      className={cn(small ? 'h-8 px-2' : 'px-3')}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        toast.success('Copiado');
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function NewBranchDialog({
  open,
  onOpenChange,
  parentBranchName,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  parentBranchName: string;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar novo branch</DialogTitle>
          <DialogDescription>
            Um branch cria uma cópia isolada do banco a partir de <span className="font-mono">{parentBranchName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="branch-name">Nome do branch</Label>
          <Input
            id="branch-name"
            placeholder="feature-x"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={async () => {
              if (!name.trim()) return;
              setLoading(true);
              try {
                await onCreate(name.trim());
                setName('');
              } catch (e: any) {
                toast.error(e.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || !name.trim()}
            className="btn-shine"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar branch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
