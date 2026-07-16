'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Play,
  Loader2,
  Database,
  GitBranch,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  History,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type QueryResult = {
  columns?: string[];
  rows?: any[][];
  rowCount?: number;
  message?: string;
  executionTime?: number;
};

const sampleQueries = [
  {
    label: 'Listar tabelas',
    query: "SELECT * FROM information_schema.tables WHERE table_schema = 'public';",
  },
  {
    label: 'Contar usuários',
    query: 'SELECT COUNT(*) FROM users;',
  },
  {
    label: 'Criar tabela',
    query: `CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`,
  },
  {
    label: 'Inserir dados',
    query: `INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com');`,
  },
  {
    label: 'Selecionar usuários',
    query: 'SELECT * FROM users ORDER BY created_at DESC LIMIT 10;',
  },
];

export function SqlEditorView({
  projectId: initialProjectId,
  branchId: initialBranchId,
}: {
  projectId?: string;
  branchId?: string;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState(initialBranchId || '');
  const [query, setQuery] = useState(sampleQueries[0].query);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ query: string; time: string; success: boolean }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load projects
  useEffect(() => {
    fetch('/api/projects/list')
      .then(r => r.json())
      .then(data => {
        setProjects(data.projects || []);
        if (data.projects?.length > 0 && !projectId) {
          setProjectId(data.projects[0].id);
        }
      });
  }, []);

  // Load branches when project changes
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then(data => {
        if (data.project) {
          setBranches(data.project.branches);
          if (data.project.branches.length > 0 && !branchId) {
            setBranchId(data.project.branches[0].id);
          }
        }
      });
  }, [projectId]);

  const runQuery = async () => {
    if (!query.trim()) return;
    if (!projectId) {
      toast.error('Selecione um projeto');
      return;
    }
    setRunning(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, projectId, branchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      setHistory(prev => [
        { query: query.slice(0, 80), time: new Date().toLocaleTimeString('pt-BR'), success: true },
        ...prev.slice(0, 9),
      ]);
      toast.success(`Query executada em ${data.executionTime}ms`);
    } catch (e: any) {
      setError(e.message);
      setHistory(prev => [
        { query: query.slice(0, 80), time: new Date().toLocaleTimeString('pt-BR'), success: false },
        ...prev.slice(0, 9),
      ]);
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  // Keyboard shortcut: Ctrl/Cmd+Enter to run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runQuery();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [query, projectId, branchId]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SQL Editor</h1>
          <p className="text-sm text-muted-foreground">Execute queries no seu banco.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={projectId}
            onChange={e => {
              setProjectId(e.target.value);
              setBranchId('');
            }}
            className="h-9 px-3 rounded-md border border-border bg-background text-sm"
          >
            {projects.length === 0 && <option value="">Selecione um projeto</option>}
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-background text-sm"
            disabled={!projectId}
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <Button onClick={runQuery} disabled={running} className="btn-shine">
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Play className="mr-1 h-4 w-4" />
                Executar
              </>
            )}
            <span className="ml-2 text-xs opacity-60 hidden sm:inline">⌘↵</span>
          </Button>
        </div>
      </div>

      {/* Sample queries */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Exemplos:</span>
        {sampleQueries.map(q => (
          <button
            key={q.label}
            onClick={() => setQuery(q.query)}
            className="px-2.5 py-1 rounded-md text-xs border border-border bg-card hover:bg-accent transition-colors"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            <span className="font-mono">{projects.find(p => p.id === projectId)?.name || 'sem projeto'}</span>
            <span>·</span>
            <GitBranch className="h-3.5 w-3.5" />
            <span className="font-mono">{branches.find(b => b.id === branchId)?.name || 'main'}</span>
          </div>
          <span className="text-xs text-muted-foreground">PostgreSQL {`{pgVersion}`}</span>
        </div>
        <textarea
          ref={textareaRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 w-full p-4 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed"
          placeholder="Digite sua query SQL aqui... (Ctrl+Enter para executar)"
          spellCheck={false}
        />
      </Card>

      {/* Results */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0 min-h-[200px]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Resultado</span>
            {result && (
              <Badge variant="outline" className="text-[10px]">
                {result.rowCount ?? 0} {result.rowCount === 1 ? 'linha' : 'linhas'}
              </Badge>
            )}
            {result?.executionTime != null && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {result.executionTime}ms
              </span>
            )}
          </div>
          {result?.columns && (
            <Button variant="ghost" size="sm">
              <Download className="mr-1 h-3 w-3" />
              Exportar
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="p-6 text-sm">
              <div className="flex items-start gap-3 text-foreground">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Erro ao executar query</p>
                  <pre className="mt-2 text-xs font-mono bg-muted/50 p-3 rounded">{error}</pre>
                </div>
              </div>
            </div>
          ) : result?.message && !result.columns ? (
            <div className="p-6 text-sm flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-foreground" />
              <span className="font-mono">{result.message}</span>
            </div>
          ) : result?.columns ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground w-12">#</th>
                  {result.columns.map(c => (
                    <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.rows?.map((row, i) => (
                  <tr key={i} className="hover:bg-accent/30">
                    <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                        {String(cell ?? 'NULL')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Execute uma query para ver os resultados.
            </div>
          )}
        </div>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Histórico</h3>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-2 py-1.5 rounded text-xs hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => setQuery(h.query)}
              >
                <span className={cn(
                  'h-1.5 w-1.5 rounded-full flex-shrink-0',
                  h.success ? 'bg-foreground' : 'bg-foreground/40'
                )} />
                <span className="font-mono truncate flex-1">{h.query}</span>
                <span className="text-muted-foreground flex-shrink-0">{h.time}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
