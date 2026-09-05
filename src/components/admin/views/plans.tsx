'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Loader2, Edit2, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Plan = {
  id: string; plan: string; name: string;
  priceMonthly: number; priceYearly: number; active: boolean;
  maxProjects: number; maxBranchesPerProject: number; maxStorageMb: number;
  maxConnections: number; maxApiKeys: number; maxQueryRows: number;
  usersCount: number;
};

const blankPlan = {
  plan: '', name: '', priceMonthly: 0, priceYearly: 0, active: true,
  maxProjects: 1, maxBranchesPerProject: 2, maxStorageMb: 100,
  maxConnections: 5, maxApiKeys: 2, maxQueryRows: 1000,
};

export function PlansView() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const res = await fetch('/api/admin/plans');
      const data = await res.json();
      if (cancelled) return;
      setPlans(data.plans || []);
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/plans');
    const data = await res.json();
    setPlans(data.plans || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Configure preços e limites de cada plano.</p>
        <Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" /> Novo plano</Button>
      </div>

      {loading ? (
        <Card className="p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(p => (
            <Card key={p.id} className={`p-6 ${!p.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{p.plan}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  <Users className="h-3 w-3 mr-1" />{p.usersCount}
                </Badge>
              </div>

              <div className="mb-4">
                <p className="text-2xl font-semibold tabular-nums">
                  R$ {p.priceMonthly.toFixed(2)}
                  <span className="text-sm text-muted-foreground font-normal">/mês</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ou R$ {p.priceYearly.toFixed(2)}/ano
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <Row label="Projetos" value={p.maxProjects} />
                <Row label="Branches/proj" value={p.maxBranchesPerProject} />
                <Row label="Storage" value={`${p.maxStorageMb} MB`} />
                <Row label="Conexões" value={p.maxConnections} />
                <Row label="API keys" value={p.maxApiKeys} />
                <Row label="Linhas/query" value={p.maxQueryRows} />
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">
                  {p.active ? 'Ativo' : 'Inativo'}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <PlanDialog
          plan={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function PlanDialog({ plan, onClose, onSaved }: { plan: Plan | null; onClose: () => void; onSaved: () => void }) {
  const [data, setData] = useState<any>(plan || blankPlan);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));

  const save = async () => {
    setLoading(true);
    try {
      if (plan) {
        await fetch(`/api/admin/plans/${plan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      toast.success('Plano salvo');
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar plano' : 'Novo plano'}</DialogTitle>
          <DialogDescription>Defina preços e limites.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Slug (free, pro, enterprise)</Label>
              <Input value={data.plan} onChange={e => set('plan', e.target.value)} disabled={!!plan} />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={data.name} onChange={e => set('name', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Preço mensal (R$)</Label>
              <Input type="number" step="0.01" value={data.priceMonthly} onChange={e => set('priceMonthly', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Preço anual (R$)</Label>
              <Input type="number" step="0.01" value={data.priceYearly} onChange={e => set('priceYearly', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Max projetos</Label>
              <Input type="number" value={data.maxProjects} onChange={e => set('maxProjects', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Max branches/proj</Label>
              <Input type="number" value={data.maxBranchesPerProject} onChange={e => set('maxBranchesPerProject', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Storage (MB)</Label>
              <Input type="number" value={data.maxStorageMb} onChange={e => set('maxStorageMb', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Max conexões</Label>
              <Input type="number" value={data.maxConnections} onChange={e => set('maxConnections', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Max API keys</Label>
              <Input type="number" value={data.maxApiKeys} onChange={e => set('maxApiKeys', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Max linhas/query</Label>
              <Input type="number" value={data.maxQueryRows} onChange={e => set('maxQueryRows', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Plano ativo</Label>
            <Switch checked={data.active} onCheckedChange={v => set('active', v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={loading} className="btn-shine">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
