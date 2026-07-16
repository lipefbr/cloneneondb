'use client';

import { useEffect, useState } from 'react';
import {
  Database,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  GitBranch,
  Globe,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { DashboardView } from './shell';

type Project = {
  id: string;
  name: string;
  region: string;
  pgVersion: string;
  status: string;
  createdAt: string;
  branches: { id: string; name: string; isDefault: boolean; status: string }[];
};

const regions = [
  { id: 'us-east-1', label: 'US East (Virginia)' },
  { id: 'us-west-2', label: 'US West (Oregon)' },
  { id: 'sa-east-1', label: 'South America (São Paulo)' },
  { id: 'eu-west-1', label: 'EU West (Ireland)' },
  { id: 'eu-central-1', label: 'EU Central (Frankfurt)' },
  { id: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { id: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
];

export function ProjectsView({
  onNavigate,
  initialAction,
}: {
  onNavigate: (v: DashboardView, opts?: any) => void;
  initialAction?: string;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(initialAction === 'new');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const res = await fetch('/api/projects/list');
      const data = await res.json();
      if (!cancelled) {
        setProjects(data.projects || []);
        setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/projects/list');
    const data = await res.json();
    setProjects(data.projects || []);
    setLoading(false);
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projetos</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie seus bancos de dados Postgres.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="btn-shine">
          <Plus className="mr-1 h-4 w-4" />
          Novo projeto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar projetos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 h-48 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-md border border-border bg-muted/30 flex items-center justify-center mb-4">
            <Database className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">
            {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground mb-6">
            {search
              ? 'Tente outra busca.'
              : 'Crie seu primeiro banco de dados Postgres em segundos.'}
          </p>
          {!search && (
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Criar primeiro projeto
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Card
              key={p.id}
              className="p-5 hover:border-foreground/30 transition-colors group cursor-pointer"
              onClick={() => onNavigate('project-detail', { id: p.id })}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-md bg-foreground/5 border border-border flex items-center justify-center flex-shrink-0">
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      PG {p.pgVersion} · {p.branches.length} branch(es)
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        onNavigate('project-detail', { id: p.id });
                      }}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Abrir
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-foreground"
                      onClick={async e => {
                        e.stopPropagation();
                        if (!confirm(`Deletar projeto "${p.name}"?`)) return;
                        const res = await fetch(`/api/projects/${p.id}/delete`, { method: 'DELETE' });
                        if (res.ok) {
                          toast.success('Projeto deletado');
                          load();
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-5 flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  <Globe className="mr-1 h-3 w-3" />
                  {p.region}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <GitBranch className="mr-1 h-3 w-3" />
                  main
                </Badge>
                <div className="flex items-center gap-1.5 ml-auto text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-status-pulse" />
                  <span className="text-muted-foreground">{p.status}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Criado em {new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewProjectDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(p) => {
          setNewOpen(false);
          load();
          toast.success(`Projeto "${p.name}" criado!`);
          setTimeout(() => onNavigate('project-detail', { id: p.id }), 200);
        }}
      />
    </div>
  );
}

function NewProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (p: Project) => void;
}) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [pgVersion, setPgVersion] = useState('16');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Dê um nome ao projeto');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), region, pgVersion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data.project);
      setName('');
      setRegion('us-east-1');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar novo projeto</DialogTitle>
          <DialogDescription>
            Um projeto é um banco de dados Postgres completo com branches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="proj-name">Nome do projeto</Label>
            <Input
              id="proj-name"
              placeholder="my-app-database"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Use apenas letras minúsculas, números e hífens.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-region">Região</Label>
            <select
              id="proj-region"
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
            >
              {regions.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-pg">Versão do Postgres</Label>
            <div className="grid grid-cols-3 gap-2">
              {['15', '16', '17'].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPgVersion(v)}
                  className={`h-9 rounded-md border text-sm font-medium transition-colors ${
                    pgVersion === v
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background hover:bg-accent'
                  }`}
                >
                  PG {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading} className="btn-shine">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Criar projeto
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
