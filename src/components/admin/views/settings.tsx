'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Server, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type Setting = { id: string; key: string; value: string };

export function SettingsView() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setSettings(data.settings || []);
        const d: Record<string, string> = {};
        for (const s of data.settings || []) d[s.key] = s.value;
        setDraft(d);
        setLoading(false);
      });
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: draft[key] }),
    });
    toast.success('Configuração salva');
    setSaving(null);
  };

  if (loading) {
    return <Card className="p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></Card>;
  }

  const booleanKeys = ['maintenance_mode', 'signup_enabled'];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <SettingsIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Configurações do sistema</h2>
        </div>

        <div className="space-y-4">
          {settings.map(s => (
            <div key={s.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1 min-w-0 mr-4">
                <Label className="text-sm font-medium capitalize">{s.key.replace(/_/g, ' ')}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {descriptions[s.key] || 'Configuração customizada'}
                </p>
              </div>
              {booleanKeys.includes(s.key) ? (
                <div className="flex items-center gap-3">
                  <Switch
                    checked={draft[s.key] === 'true'}
                    onCheckedChange={v => setDraft(d => ({ ...d, [s.key]: String(v) }))}
                  />
                  <Button size="sm" variant="outline" onClick={() => save(s.key)} disabled={saving === s.key}>
                    {saving === s.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-64">
                  <Input
                    value={draft[s.key] || ''}
                    onChange={e => setDraft(d => ({ ...d, [s.key]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={() => save(s.key)} disabled={saving === s.key}>
                    {saving === s.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Manutenção</h2>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={() => toast.info('Em breve: exportar todos os dados')}>
            Exportar banco de metadados
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => toast.info('Em breve: backup dos bancos reais')}>
            Backup Postgres
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start border-foreground text-foreground hover:bg-foreground hover:text-background"
            onClick={() => {
              if (confirm('Reiniciar o app? Os usuários ficarão sem acesso por alguns segundos.')) {
                fetch('/api/admin/restart', { method: 'POST' })
                  .then(() => toast.success('App reiniciando...'))
                  .catch(() => toast.error('Falha ao reiniciar'));
              }
            }}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Reiniciar aplicação
          </Button>
        </div>
      </Card>
    </div>
  );
}

const descriptions: Record<string, string> = {
  platform_name: 'Nome da plataforma exibido na UI',
  support_email: 'Email de contato para suporte',
  currency: 'Moeda usada nos pagamentos',
  max_users: 'Número máximo de usuários cadastrados',
  maintenance_mode: 'Bloquear acesso de usuários comuns (admin ainda acessa)',
  signup_enabled: 'Permitir novos cadastros',
};
