import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dropDatabase } from '@/lib/postgres-admin';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    include: { branches: { include: { connections: true } } },
  });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

  // Drop all real Postgres databases from all branches
  const dropped = new Set<string>();
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

  await db.project.delete({ where: { id: project.id } });

  await db.activityLog.create({
    data: {
      userId: user.id,
      action: 'project.deleted',
      target: project.name,
    },
  });

  return NextResponse.json({ ok: true });
}
