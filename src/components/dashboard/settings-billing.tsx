'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Building2, Calendar, Shield, Bell, Globe, Trash2, Save, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { DashboardView } from './shell';

export function SettingsView({ onNavigate }: { onNavigate: (v: DashboardView, opts?: any) => void }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-muted-foreground">Gerencie sua conta e preferências.</p>
      </div>

      {/* Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-5 w-5" />
          <h2 className="font-semibold">Perfil</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Nome</Label>
            <Input id="settings-name" placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" type="email" placeholder="voce@exemplo.com" disabled />
            <p className="text-xs text-muted-foreground">Email não pode ser alterado.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-company">Empresa</Label>
            <Input id="settings-company" placeholder="Sua empresa" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-role">Cargo</Label>
            <Input id="settings-role" placeholder="Desenvolvedor, CTO..." />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button className="btn-shine">
            <Save className="mr-1 h-4 w-4" />
            Salvar alterações
          </Button>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="h-5 w-5" />
          <h2 className="font-semibold">Preferências</h2>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Notificações por email', desc: 'Receba alertas sobre seus bancos' },
            { label: 'Alertas de uso', desc: 'Avisar quando atingir limites' },
            { label: 'Atualizações de produto', desc: 'Novidades e changelogs' },
            { label: 'Marketing', desc: 'Dicas, tutoriais e ofertas' },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              <Switch defaultChecked={i < 2} />
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="h-5 w-5" />
          <h2 className="font-semibold">Segurança</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium">Autenticação em dois fatores</p>
              <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
            </div>
            <Button variant="outline" size="sm">Configurar</Button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium">Senha</p>
              <p className="text-xs text-muted-foreground">Última alteração: nunca</p>
            </div>
            <Button variant="outline" size="sm">Alterar senha</Button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">Sessões ativas</p>
              <p className="text-xs text-muted-foreground">Gerencie dispositivos conectados</p>
            </div>
            <Button variant="outline" size="sm">Ver sessões</Button>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border-foreground/30">
        <div className="flex items-center gap-2 mb-5">
          <Trash2 className="h-5 w-5" />
          <h2 className="font-semibold">Zona de perigo</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium">Deletar conta</p>
              <p className="text-xs text-muted-foreground">Remove todos os seus dados permanentemente</p>
            </div>
            <Button
              variant="outline"
              className="border-foreground text-foreground hover:bg-foreground hover:text-background"
              onClick={() => toast.info('Contate o suporte para deletar sua conta.')}
            >
              Deletar conta
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function BillingView() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Faturamento</h1>
        <p className="mt-1 text-muted-foreground">Gerencie seu plano e pagamentos.</p>
      </div>

      {/* Current plan */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Plano Free</h2>
              <Badge variant="outline">atual</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              1 projeto · 500 MB storage · 100h compute
            </p>
          </div>
          <Button className="btn-shine">Fazer upgrade</Button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Storage usado</p>
            <p className="text-xl font-semibold mt-1">0 MB</p>
            <div className="h-1 rounded-full bg-muted mt-2">
              <div className="h-full bg-foreground rounded-full" style={{ width: '0%' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">de 500 MB</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Compute usado</p>
            <p className="text-xl font-semibold mt-1">0.0h</p>
            <div className="h-1 rounded-full bg-muted mt-2">
              <div className="h-full bg-foreground rounded-full" style={{ width: '0%' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">de 100h</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Projetos</p>
            <p className="text-xl font-semibold mt-1">0</p>
            <div className="h-1 rounded-full bg-muted mt-2">
              <div className="h-full bg-foreground rounded-full" style={{ width: '0%' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">de 1</p>
          </div>
        </div>
      </Card>

      {/* Available plans */}
      <Card className="p-6">
        <h2 className="font-semibold mb-5">Planos disponíveis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: 'Free', price: '$0', features: ['1 projeto', '500 MB', '100h compute'] },
            { name: 'Pro', price: '$19', features: ['10 projetos', '10 GB', 'Compute ilimitado'], highlighted: true },
            { name: 'Enterprise', price: 'Custom', features: ['Ilimitado', 'SSO', 'SLA 99.99%'] },
          ].map(p => (
            <div
              key={p.name}
              className={`rounded-lg border p-4 ${p.highlighted ? 'border-foreground' : 'border-border'}`}
            >
              <p className="font-medium">{p.name}</p>
              <p className="text-2xl font-semibold mt-1">{p.price}<span className="text-sm text-muted-foreground font-normal">/mês</span></p>
              <ul className="mt-3 space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-foreground" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={p.highlighted ? 'default' : 'outline'} size="sm" className="w-full mt-4">
                {p.name === 'Free' ? 'Atual' : 'Escolher'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment method */}
      <Card className="p-6">
        <h2 className="font-semibold mb-5">Método de pagamento</h2>
        <div className="flex items-center justify-between py-4 border border-dashed border-border rounded-md px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-12 rounded bg-muted/50 flex items-center justify-center">
              <span className="text-xs">VISA</span>
            </div>
            <div>
              <p className="text-sm font-medium">Nenhum cartão adicionado</p>
              <p className="text-xs text-muted-foreground">Adicione um cartão para fazer upgrade</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Adicionar cartão</Button>
        </div>
      </Card>
    </div>
  );
}

export function BranchesView({ onNavigate }: { onNavigate: (v: DashboardView, opts?: any) => void }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects/list')
      .then(r => r.json())
      .then(data => {
        setProjects(data.projects || []);
        setLoading(false);
      });
  }, []);

  const allBranches = projects.flatMap(p =>
    p.branches.map((b: any) => ({ ...b, projectName: p.name, projectId: p.id }))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Branches</h1>
        <p className="mt-1 text-muted-foreground">Todos os branches em todos os projetos.</p>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </Card>
      ) : allBranches.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum branch ainda.</p>
          <Button className="mt-4" onClick={() => onNavigate('projects', { action: 'new' })}>
            Criar projeto
          </Button>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Branch</th>
                <th className="text-left px-4 py-3 font-medium">Projeto</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Criado</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allBranches.map(b => (
                <tr
                  key={b.id}
                  className="hover:bg-accent/30 cursor-pointer transition-colors"
                  onClick={() => onNavigate('project-detail', { id: b.projectId })}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{b.name}</span>
                      {b.isDefault && <Badge variant="outline" className="text-[10px] py-0">DEFAULT</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.projectName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-status-pulse" />
                      <span className="text-muted-foreground">{b.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(b.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">
                      Abrir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
