'use client';

import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const plans = [
  {
    name: 'Free',
    desc: 'Para começar e experimentar',
    monthly: 0,
    yearly: 0,
    features: [
      '1 projeto',
      '500 MB de storage',
      '100 horas de compute / mês',
      'Branches ilimitados',
      'Comunidade no Discord',
    ],
    cta: 'Começar grátis',
    highlighted: false,
  },
  {
    name: 'Pro',
    desc: 'Para apps em produção',
    monthly: 19,
    yearly: 15,
    features: [
      '10 projetos',
      '10 GB de storage',
      'Compute ilimitado',
      'Branches ilimitados',
      'Point-in-time recovery (7 dias)',
      'Suporte por email',
    ],
    cta: 'Assinar Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    desc: 'Para escala e compliance',
    monthly: null,
    yearly: null,
    features: [
      'Projetos ilimitados',
      'Storage ilimitado',
      'SSO / SAML',
      'SLA 99.99%',
      'Suporte dedicado 24/7',
      'On-premise opcional',
    ],
    cta: 'Falar com vendas',
    highlighted: false,
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="py-24 sm:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Preços
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Preço justo, sem surpresas
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Pague só pelo que usar. Sem custos escondidos, sem contratos longos.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full border border-border bg-card">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                'px-4 py-1.5 text-sm rounded-full transition-colors',
                !yearly ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                'px-4 py-1.5 text-sm rounded-full transition-colors',
                yearly ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Anual
              <span className="ml-1.5 text-xs opacity-70">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={cn(
                'relative rounded-lg border p-8 flex flex-col',
                p.highlighted
                  ? 'border-foreground bg-card shadow-2xl shadow-foreground/5'
                  : 'border-border bg-card'
              )}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-foreground text-background text-xs font-medium">
                  Mais popular
                </div>
              )}
              <h3 className="text-xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>

              <div className="mt-6 flex items-baseline gap-1">
                {p.monthly === null ? (
                  <span className="text-4xl font-semibold">Sob consulta</span>
                ) : (
                  <>
                    <span className="text-4xl font-semibold tabular-nums">
                      ${yearly ? p.yearly : p.monthly}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </>
                )}
              </div>

              <Link href="/?view=register" className="mt-6">
                <Button
                  variant={p.highlighted ? 'default' : 'outline'}
                  className="w-full btn-shine"
                >
                  {p.cta}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>

              <ul className="mt-8 space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="py-24 sm:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border border-border bg-card overflow-hidden p-12 sm:p-16 text-center">
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-50" />
          <div className="relative">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Comece em 30 segundos
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Crie sua conta, suba seu primeiro banco e conecte no seu app.
              Sem cartão, sem fricção.
            </p>
            <Link href="/?view=register" className="inline-block mt-8">
              <Button size="lg" className="btn-shine h-12 px-8 text-base">
                Criar conta grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
