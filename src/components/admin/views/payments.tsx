'use client';

import { useEffect, useState } from 'react';
import {
  Plus, Loader2, CheckCircle2, XCircle, Clock, DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type Payment = {
  id: string; amount: number; status: string; method: string;
  plan: string; period: string; provider: string;
  createdAt: string; paidAt: string | null;
  user: { id: string; email: string; name: string };
};

type Summary = { status: string; count: number; total: number }[];

export function PaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      if (cancelled) return;
      setPayments(data.payments || []);
      setSummary(data.summary || []);
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [statusFilter]);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/admin/payments?${params}`);
    const data = await res.json();
    setPayments(data.payments || []);
    setSummary(data.summary || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/payments/${id}/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    toast.success(`Pagamento marcado como ${status}`);
    load();
  };

  const totalRevenue = summary.find(s => s.status === 'paid')?.total || 0;
  const pendingTotal = summary.find(s => s.status === 'pending')?.total || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Receita confirmada</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">R$ {totalRevenue.toFixed(2)}</p>
            </div>
            <div className="h-9 w-9 rounded-md border border-border flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">R$ {pendingTotal.toFixed(2)}</p>
            </div>
            <div className="h-9 w-9 rounded-md border border-border flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total de transações</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">
                {summary.reduce((a, s) => a + s.count, 0)}
              </p>
            </div>
            <div className="h-9 w-9 rounded-md border border-border flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter + actions */}
      <div className="flex items-center justify-between gap-3">
        <Select value={statusFilter || 'all'} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
            <SelectItem value="refunded">Reembolsado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" /> Registrar pagamento
        </Button>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Usuário</th>
                <th className="text-left px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Plano</th>
                <th className="text-left px-4 py-3 font-medium">Método</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Nenhum pagamento.</td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.user.name}</p>
                    <p className="text-xs text-muted-foreground">{p.user.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">R$ {p.amount.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{p.plan}</Badge></td>
                  <td className="px-4 py-3 capitalize text-xs">{p.method}</td>
                  <td className="px-4 py-3">
                    {p.status === 'paid' && <Badge className="bg-foreground text-background">Pago</Badge>}
                    {p.status === 'pending' && <Badge variant="outline">Pendente</Badge>}
                    {p.status === 'failed' && <Badge variant="outline" className="border-foreground">Falhou</Badge>}
                    {p.status === 'refunded' && <Badge variant="outline">Reembolsado</Badge>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(p.id, 'paid')}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar
                      </Button>
                    )}
                    {p.status === 'paid' && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(p.id, 'refunded')}>
                        <XCircle className="h-3 w-3 mr-1" /> Reembolsar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {creating && <CreatePaymentDialog onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
    </div>
  );
}

function CreatePaymentDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [plan, setPlan] = useState('pro');
  const [period, setPeriod] = useState('monthly');
  const [method, setMethod] = useState('pix');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ id: string; email: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/admin/users?limit=100').then(r => r.json()).then(d => setUsers(d.users || []));
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, plan, period, method, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Pagamento registrado');
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>Crie um pagamento manual para um usuário.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Usuário</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago (upgrade automático)</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={loading || !userId || !amount} className="btn-shine">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
