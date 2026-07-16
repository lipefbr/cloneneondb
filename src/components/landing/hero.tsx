'use client';

import { ArrowRight, Terminal, GitBranch, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid bg-grid-fade pointer-events-none" />
      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-foreground/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Link
            href="#features"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 backdrop-blur text-xs font-medium hover:bg-accent transition-colors mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-status-pulse" />
            Novo: Postgres 17 disponível
            <ArrowRight className="h-3 w-3" />
          </Link>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
            Serverless Postgres
            <br />
            <span className="text-muted-foreground">para a era moderna</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Hospede bancos de dados Postgres em segundos. Branching, escalonamento
            automático e cópia instantânea — sem servidor para gerenciar.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/?view=register">
              <Button size="lg" className="btn-shine w-full sm:w-auto h-12 px-6 text-base">
                Começar grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#workflow">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-base">
                <Terminal className="mr-2 h-4 w-4" />
                Ver demonstração
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Sem cartão de crédito · 500 MB grátis · Pronto em 30 segundos
          </p>
        </div>

        {/* Code preview */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-foreground/20 via-foreground/5 to-foreground/20 rounded-lg blur-sm" />
            <div className="relative rounded-lg border border-border bg-card overflow-hidden">
              {/* Window header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-foreground/20" />
                  <div className="h-3 w-3 rounded-full bg-foreground/20" />
                  <div className="h-3 w-3 rounded-full bg-foreground/20" />
                </div>
                <div className="ml-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <GitBranch className="h-3 w-3" />
                  main
                  <span className="text-foreground/30">·</span>
                  <Zap className="h-3 w-3" />
                  neondb
                </div>
              </div>
              {/* Code */}
              <pre className="code-block p-5 overflow-x-auto text-left">
                <code>
                  <span className="text-muted-foreground"># Crie seu banco em segundos</span>{'\n'}
                  <span className="text-foreground">$</span> <span className="font-medium">curl</span> -X POST https://api.neondb.dev/projects \{'\n'}
                  {'  '}-H <span className="text-foreground/80">"Authorization: Bearer $NEONDB_API_KEY"</span> \{'\n'}
                  {'  '}-H <span className="text-foreground/80">"Content-Type: application/json"</span> \{'\n'}
                  {'  '}-d <span className="text-foreground/80">'{"{"}"name":"my-app-db","region":"us-east-1"{"}"}'</span>{'\n\n'}
                  <span className="text-muted-foreground"># Resposta</span>{'\n'}
                  <span className="text-foreground/60">{"{"}</span>{'\n'}
                  {'  '}"project_id": <span className="text-foreground/80">"proj_a1b2c3d4"</span>,{'\n'}
                  {'  '}"connection_uri": <span className="text-foreground/80">"postgres://user:***@ep-cool-name.us-east-1.neondb.dev/neondb"</span>,{'\n'}
                  {'  '}"branch": <span className="text-foreground/80">"main"</span>,{'\n'}
                  {'  '}"status": <span className="text-foreground/80">"ready"</span>{'\n'}
                  <span className="text-foreground/60">{"}"}</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
