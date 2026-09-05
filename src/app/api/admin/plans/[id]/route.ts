import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await ctx.params;
  const updates = await req.json();

  const allowed: any = {};
  for (const k of [
    'name', 'priceMonthly', 'priceYearly', 'active',
    'maxProjects', 'maxBranchesPerProject', 'maxStorageMb',
    'maxConnections', 'maxApiKeys', 'maxQueryRows',
  ]) {
    if (updates[k] !== undefined) allowed[k] = updates[k];
  }

  const plan = await db.planConfig.update({ where: { id }, data: allowed });
  return NextResponse.json({ plan });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await ctx.params;
  await db.planConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
