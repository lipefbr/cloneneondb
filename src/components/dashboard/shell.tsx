'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  GitBranch,
  Terminal,
  Settings,
  Key,
  LogOut,
  ChevronDown,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  Activity,
  CreditCard,
  BookOpen,
  Shield,
} from 'lucide-react';
import { Logo } from '@/components/landing/nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export type User = {
  id: string;
  email: string;
  name: string;
  plan: string;
  role: string;
  avatarUrl?: string | null;
  company?: string | null;
  createdAt: string;
};

export type DashboardView =
  | 'overview'
  | 'projects'
  | 'project-detail'
  | 'sql-editor'
  | 'branches'
  | 'api-keys'
  | 'settings'
  | 'billing';

const navItems: { id: DashboardView; label: string; icon: any; href: string }[] = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard, href: '/?view=dashboard&sub=overview' },
  { id: 'projects', label: 'Projetos', icon: Database, href: '/?view=dashboard&sub=projects' },
  { id: 'branches', label: 'Branches', icon: GitBranch, href: '/?view=dashboard&sub=branches' },
  { id: 'sql-editor', label: 'SQL Editor', icon: Terminal, href: '/?view=dashboard&sub=sql-editor' },
  { id: 'api-keys', label: 'API Keys', icon: Key, href: '/?view=dashboard&sub=api-keys' },
  { id: 'settings', label: 'Configurações', icon: Settings, href: '/?view=dashboard&sub=settings' },
  { id: 'billing', label: 'Faturamento', icon: CreditCard, href: '/?view=dashboard&sub=billing' },
];

export function DashboardShell({
  user,
  active,
  onNavigate,
  children,
}: {
  user: User;
  active: DashboardView;
  onNavigate: (v: DashboardView, opts?: any) => void;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logout realizado');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - desktop */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 flex-shrink-0 border-r border-border bg-background transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-border">
            <Logo />
            <button
              className="lg:hidden p-2 text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Project switcher */}
          <div className="p-3 border-b border-border">
            <button
              onClick={() => onNavigate('projects')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded bg-foreground/10 flex items-center justify-center flex-shrink-0">
                  <Database className="h-3 w-3" />
                </div>
                <span className="truncate">Seus projetos</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            <p className="px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground/70 font-medium">
              Geral
            </p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
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
                Recursos
              </p>
              <a
                href="#"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                Documentação
              </a>
              <a
                href="#"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                <Activity className="h-4 w-4 flex-shrink-0" />
                Status
              </a>
              {user.role === 'admin' && (
                <Link
                  href="/?view=admin"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent/50 transition-colors font-medium"
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  Painel Admin
                </Link>
              )}
            </div>
          </nav>

          {/* User card */}
          <div className="p-3 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-foreground text-background text-xs font-medium">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
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
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('billing')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Faturamento
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-foreground">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3 flex-1">
              <button
                className="lg:hidden p-2 text-muted-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar projetos, branches, tabelas..."
                  className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:border-border"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onNavigate('projects', { action: 'new' })}
                className="btn-shine"
              >
                <Plus className="mr-1 h-4 w-4" />
                Novo projeto
              </Button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
