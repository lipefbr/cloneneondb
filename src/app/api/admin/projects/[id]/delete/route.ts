import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { dropDatabase } from '@/lib/postgres-admin';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await ctx.params;
  const project = await db.project.findUnique({
    where: { id },
    include: { branches: { include: { connections: true } } },
  });

  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

  // Drop real Postgres databases
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

  await db.project.delete({ where: { id } });
  return NextResponse.json({ ok: true, droppedDatabases: dropped.size });
}
