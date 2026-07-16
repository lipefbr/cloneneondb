'use client';

import { Logo } from './nav';
import Link from 'next/link';

const cols = [
  {
    title: 'Produto',
    links: ['Features', 'Preços', 'Branching', 'API', 'Changelog', 'Roadmap'],
  },
  {
    title: 'Recursos',
    links: ['Documentação', 'Tutoriais', 'Blog', 'Webinars', 'Comunidade', 'Status'],
  },
  {
    title: 'Empresa',
    links: ['Sobre', 'Carreiras', 'Contato', 'Imprensa', 'Parceiros', 'Legal'],
  },
  {
    title: 'Suporte',
    links: ['Help Center', 'Discord', 'GitHub Issues', 'API Status', 'SLA', 'Suporte Enterprise'],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Serverless Postgres para a era moderna.
              Branching, escalonamento automático e zero DevOps.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-status-pulse" />
                <span className="text-muted-foreground">Todos os sistemas operacionais</span>
              </div>
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NeonDB. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Termos</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link href="#" className="hover:text-foreground transition-colors">DPA</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
