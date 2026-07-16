'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Github, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 group', className)}>
      <div className="relative h-7 w-7 flex items-center justify-center">
        <svg viewBox="0 0 32 32" className="h-7 w-7">
          <rect x="2" y="2" width="28" height="28" rx="6" fill="currentColor" />
          <path
            d="M10 22V10h2.5l7 7.5V10H22v12h-2.5l-7-7.5V22H10z"
            fill="var(--background)"
          />
        </svg>
      </div>
      <span className="font-semibold text-lg tracking-tight">NeonDB</span>
    </Link>
  );
}

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Produto', href: '#features' },
    { label: 'Recursos', href: '#workflow' },
    { label: 'Preços', href: '#pricing' },
    { label: 'Docs', href: '#docs' },
    { label: 'Blog', href: '#blog' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <Link href="/?view=login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/?view=register">
              <Button size="sm" className="btn-shine">
                Começar grátis
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <Link href="/?view=login" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full">Entrar</Button>
              </Link>
              <Link href="/?view=register" onClick={() => setOpen(false)}>
                <Button className="w-full">Começar grátis</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
