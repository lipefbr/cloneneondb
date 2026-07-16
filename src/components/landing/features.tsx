'use client';

import { GitBranch, Zap, Shield, Database, Clock, Code2, Copy, RefreshCw, Server } from 'lucide-react';

const features = [
  {
    icon: GitBranch,
    title: 'Database Branching',
    desc: 'Crie branches do seu banco como faz com código. Cada branch é uma cópia isolada, pronta para dev, testes e preview deployments.',
  },
  {
    icon: Zap,
    title: 'Scale-to-zero',
    desc: 'Pare de pagar por compute ocioso. Seu banco hiberna quando não há conexões e volta em milissegundos quando preciso.',
  },
  {
    icon: Shield,
    title: 'Backups automáticos',
    desc: 'Point-in-time recovery até 7 dias. Restaure qualquer versão do seu banco com um clique, sem dor de cabeça.',
  },
  {
    icon: Database,
    title: 'Postgres nativo',
    desc: 'PostgreSQL 16/17 real, sem forks proprietários. Compatível com todas as suas ferramentas, ORMs e drivers favoritos.',
  },
  {
    icon: Clock,
    title: 'Provisionamento instantâneo',
    desc: 'Do zero ao banco pronto em menos de 5 segundos. Sem configuração de servidor, sem espera, sem fricção.',
  },
  {
    icon: Code2,
    title: 'API completa',
    desc: 'Gerencie projetos, branches, conexões e cópias via API REST. Automação total para CI/CD e infra-as-code.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Recursos
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Tudo que você precisa
            <br />
            <span className="text-muted-foreground">para escalar Postgres</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Da prototipação à produção. Recursos pensados para desenvolvedores
            que querem entregar rápido, sem abrir mão de confiabilidade.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative bg-card p-8 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-md border border-border bg-background mb-5 group-hover:border-foreground/30 transition-colors">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Workflow() {
  const steps = [
    {
      step: '01',
      title: 'Crie seu projeto',
      desc: 'Dê um nome, escolha a região e a versão do Postgres. Pronto — seu banco está vivo.',
      icon: Database,
    },
    {
      step: '02',
      title: 'Conecte e desenvolva',
      desc: 'Pegue a connection string e plugue no seu app. Suporte a driver nativo, pooler e HTTP.',
      icon: Code2,
    },
    {
      step: '03',
      title: 'Branch e teste',
      desc: 'Crie branches para cada PR. Teste migrations em isolamento sem mexer no production.',
      icon: GitBranch,
    },
    {
      step: '04',
      title: 'Escale automaticamente',
      desc: 'Compute sobe e desce conforme a carga. Pague só pelo que usar, sem provisionar nada.',
      icon: RefreshCw,
    },
  ];

  return (
    <section id="workflow" className="py-24 sm:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Workflow
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Do zero ao deploy em minutos
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Um fluxo pensado para desenvolvedores. Sem DevOps, sem tickets, sem espera.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] right-[-30%] h-px bg-border" />
              )}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full border border-border bg-card">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-semibold text-muted-foreground/30 tabular-nums">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CodeShowcase() {
  return (
    <section className="py-24 sm:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            CLI & API
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Tudo automatizável,
            <br />
            <span className="text-muted-foreground">nada manual</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Crie bancos via API, integre com CI/CD, automatize migrations em branches.
            A NeonDB foi feita para ser controlada por código, não por clicks.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              'API REST completa para todos os recursos',
              'CLI oficial para Node, Python e Go',
              'Webhooks para eventos do banco',
              'SDKs para integração com Terraform e Pulumi',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="mt-1.5 h-1 w-1 rounded-full bg-foreground flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-foreground/10 to-transparent rounded-lg blur-sm" />
          <div className="relative rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <Server className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">terminal</span>
              <button className="ml-auto p-1 text-muted-foreground hover:text-foreground">
                <Copy className="h-3 w-3" />
              </button>
            </div>
            <pre className="code-block p-5 overflow-x-auto">
              <code>
                <span className="text-muted-foreground"># Instale a CLI</span>{'\n'}
                <span className="text-foreground">$</span> npm i -g @neondb/cli{'\n\n'}
                <span className="text-muted-foreground"># Crie um projeto</span>{'\n'}
                <span className="text-foreground">$</span> neondb projects create \{'\n'}
                {'  '}--name <span className="text-foreground/80">"production"</span> \{'\n'}
                {'  '}--region <span className="text-foreground/80">"sa-east-1"</span>{'\n\n'}
                <span className="text-muted-foreground"># Crie um branch para homologação</span>{'\n'}
                <span className="text-foreground">$</span> neondb branches create \{'\n'}
                {'  '}--project <span className="text-foreground/80">"production"</span> \{'\n'}
                {'  '}--name <span className="text-foreground/80">"staging"</span>{'\n\n'}
                <span className="text-muted-foreground"># Rode migrations no branch</span>{'\n'}
                <span className="text-foreground">$</span> neondb migrate --branch staging{'\n'}
                <span className="text-foreground/60">✓ 12 migrations applied in 1.4s</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
