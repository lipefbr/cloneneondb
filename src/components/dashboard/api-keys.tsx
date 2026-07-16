'use client';

import { useEffect, useState } from 'react';
import { Key, Plus, Copy, Check, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
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
import { toast } from 'sonner';

type ApiKey = {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string | null;
};

export function ApiKeysView() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const res = await fetch('/api/api-keys');
      const data = await res.json();
      if (!cancelled) {
        setKeys(data.keys || []);
        setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/api-keys');
    const data = await res.json();
    setKeys(data.keys || []);
    setLoading(false);
  };

  const maskKey = (key: string) => {
    if (key.length < 12) return key;
    return key.slice(0, 8) + '•'.repeat(20) + key.slice(-4);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">API Keys</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie chaves de acesso à API da NeonDB.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="btn-shine">
          <Plus className="mr-1 h-4 w-4" />
          Nova chave
        </Button>
      </div>

      {/* Info card */}
      <Card className="p-4 border-dashed">
        <div className="flex items-start gap-3">
          <Key className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Como usar</p>
            <p className="text-muted-foreground mt-1">
              Use suas chaves no header <code className="font-mono bg-muted/50 px-1.5 py-0.5 rounded">Authorization: Bearer SUA_CHAVE</code> para acessar a API REST.
              Mantenha suas chaves em segredo.
            </p>
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </Card>
      ) : keys.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-md border border-border bg-muted/30 flex items-center justify-center mb-4">
            <Key className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma chave ainda.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map(k => (
            <Card key={k.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{k.name}</span>
                    {k.lastUsedAt ? (
                      <Badge variant="outline" className="text-[10px]">ativa</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">não usada</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs font-mono bg-muted/30 px-2 py-1 rounded flex-1 truncate">
                      {revealed[k.id] ? k.key : maskKey(k.key)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevealed(r => ({ ...r, [k.id]: !r[k.id] }))}
                    >
                      {revealed[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(k.key);
                        toast.success('Copiado');
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Criada em {new Date(k.createdAt).toLocaleString('pt-BR')}
                    {k.lastUsedAt && ` · Último uso: ${new Date(k.lastUsedAt).toLocaleString('pt-BR')}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:bg-foreground/10"
                  onClick={async () => {
                    if (!confirm(`Deletar chave "${k.name}"?`)) return;
                    await fetch(`/api/api-keys/${k.id}/delete`, { method: 'DELETE' });
                    toast.success('Chave deletada');
                    load();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewKeyDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={() => {
          setNewOpen(false);
          load();
        }}
      />
    </div>
  );
}

function NewKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error('Erro ao criar');
      toast.success('Chave criada');
      setName('');
      onCreated();
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
          <DialogTitle>Criar nova API key</DialogTitle>
          <DialogDescription>
            Dê um nome descritivo para identificar onde esta chave é usada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="key-name">Nome</Label>
          <Input
            id="key-name"
            placeholder="ex: production-server"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={create} disabled={loading || !name.trim()} className="btn-shine">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar chave'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
