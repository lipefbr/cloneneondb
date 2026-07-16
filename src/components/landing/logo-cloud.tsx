'use client';

const logos = [
  'VOXEL', 'STRIPE', 'VERCEL', 'LINEAR', 'NOTION', 'FIGMA', 'RAYCAST', 'SUPABASE',
];

export function LogoCloud() {
  return (
    <section className="py-16 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-10">
          Empresas que confiam na NeonDB
        </p>
        <div className="relative overflow-hidden">
          <div className="flex gap-16 animate-marquee">
            {[...logos, ...logos].map((logo, i) => (
              <div
                key={i}
                className="flex-shrink-0 text-2xl font-semibold tracking-tight text-muted-foreground/60 hover:text-foreground transition-colors cursor-default"
              >
                {logo}
              </div>
            ))}
          </div>
          {/* Edge fades */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
