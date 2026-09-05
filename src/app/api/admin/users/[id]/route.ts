import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { dropDatabase } from '@/lib/postgres-admin';
import { toast } from 'sonner';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await ctx.params;
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, plan: true, role: true, status: true,
      company: true, avatarUrl: true, createdAt: true, trialEndsAt: true,
      _count: { select: { projects: true, apiKeys: true, payments: true, activities: true } },
      projects: {
        select: {
          id: true, name: true, status: true, region: true, pgVersion: true, createdAt: true,
          branches: { select: { id: true, name: true, isDefault: true, status: true } },
        },
      },
      payments: {
        select: { id: true, amount: true, status: true, plan: true, period: true, createdAt: true, paidAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await ctx.params;
  const updates = await req.json();

  // Whitelisted fields only
  const allowed: any = {};
  for (const k of ['plan', 'role', 'status', 'name', 'company']) {
    if (updates[k] !== undefined) allowed[k] = updates[k];
  }

  const updated = await db.user.update({
    where: { id },
    data: allowed,
    select: { id: true, email: true, name: true, plan: true, role: true, status: true, company: true },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await ctx.params;

  // Get all user's databases to drop them
  const projects = await db.project.findMany({
    where: { userId: id },
    include: { branches: { include: { connections: true } } },
  });

  const dropped = new Set<string>();
  for (const project of projects) {
    for (const branch of project.branches) {
      for (const conn of branch.connections) {
        if (conn.database && !dropped.has(conn.database) && conn.database !== 'neondb') {
          try {
            await dropDatabase(conn.database, conn.role);
            dropped.add(conn.database);
          } catch (e: any) {
            console.error(`Failed to drop ${conn.database}:`, e.message);
          }
        }
      }
    }
  }

  // This cascades to projects, branches, connections, api_keys, payments, etc.
  await db.user.delete({ where: { id } });

  return NextResponse.json({ ok: true, droppedDatabases: dropped.size });
}
