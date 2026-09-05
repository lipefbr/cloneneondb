'use client';

import { useEffect, useState } from 'react';
import { Loader2, Activity as ActivityIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Activity = {
  id: string;
  action: string;
  target: string;
  createdAt: string;
  user: { id: string; email: string; name: string };
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

export function ActivitiesView() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/activities')
      .then(r => r.json())
      .then(data => {
        setActivities(data.activities || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <ActivityIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Atividades recentes</h2>
          <Badge variant="outline" className="ml-auto">últimas 100</Badge>
        </div>

        {loading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sem atividade.</p>
        ) : (
          <div className="space-y-3">
            {activities.map(a => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <div className="h-2 w-2 rounded-full bg-foreground mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{a.user.name}</span>{' '}
                    <span className="text-muted-foreground">·</span>{' '}
                    <span>{actionLabels[a.action] || a.action}</span>{' '}
                    <span className="text-muted-foreground">{a.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {a.user.email} · {timeAgo(a.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
