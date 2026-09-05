'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Database, CreditCard, Settings,
  Activity, LogOut, ChevronDown, ArrowLeft, Menu, X,
  AlertTriangle, Server,
} from 'lucide-react';
import { Logo } from '@/components/landing/nav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export type AdminView =
  | 'overview'
  | 'users'
  | 'projects'
  | 'plans'
  | 'payments'
  | 'activities'
  | 'settings';

const navItems: { id: AdminView; label: string; icon: any }[] = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'projects', label: 'Projetos', icon: Database },
  { id: 'plans', label: 'Planos', icon: CreditCard },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'activities', label: 'Atividades', icon: Activity },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export type AdminUser = {
  id: string; email: string; name: string; plan: string; role: string;
};

export function AdminShell({
  user, active, onNavigate, children,
}: {
  user: AdminUser;
  active: AdminView;
  onNavigate: (v: AdminView) => void;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logout realizado');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 flex-shrink-0 border-r border-border bg-background transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border">
            <Link href="/?view=dashboard" className="flex items-center gap-2">
              <Logo />
              <Badge variant="outline" className="ml-1 text-[10px]">ADMIN</Badge>
            </Link>
            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            <p className="px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground/70 font-medium">
              Administração
            </p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active === item.id
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </button>
            ))}

            <div className="pt-4">
              <p className="px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground/70 font-medium">
                Voltar
              </p>
              <Link
                href="/?view=dashboard"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                Dashboard usuário
              </Link>
            </div>
          </nav>

          <div className="p-3 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-foreground text-background text-xs font-medium">
                      {user.name?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold capitalize">
                {navItems.find(n => n.id === active)?.label || 'Admin'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-status-pulse mr-1" />
                Sistema operacional
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
