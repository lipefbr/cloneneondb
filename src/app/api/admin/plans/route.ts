import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const plans = await db.planConfig.findMany({
    orderBy: { priceMonthly: 'asc' },
  });

  // Count users per plan
  const usersPerPlan = await db.user.groupBy({ by: ['plan'], _count: true });
  const usersMap: Record<string, number> = {};
  for (const u of usersPerPlan) usersMap[u.plan] = u._count;

  return NextResponse.json({
    plans: plans.map(p => ({ ...p, usersCount: usersMap[p.plan] || 0 })),
  });
}

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const data = await req.json();
  if (!data.plan || !data.name) {
    return NextResponse.json({ error: 'plan e name são obrigatórios' }, { status: 400 });
  }

  const plan = await db.planConfig.create({
    data: {
      plan: data.plan,
      name: data.name,
      priceMonthly: data.priceMonthly ?? 0,
      priceYearly: data.priceYearly ?? 0,
      active: data.active ?? true,
      maxProjects: data.maxProjects ?? 1,
      maxBranchesPerProject: data.maxBranchesPerProject ?? 2,
      maxStorageMb: data.maxStorageMb ?? 100,
      maxConnections: data.maxConnections ?? 5,
      maxApiKeys: data.maxApiKeys ?? 2,
      maxQueryRows: data.maxQueryRows ?? 1000,
    },
  });

  return NextResponse.json({ plan });
}
