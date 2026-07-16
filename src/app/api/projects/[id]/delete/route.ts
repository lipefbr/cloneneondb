import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

  await db.project.delete({ where: { id } });

  await db.activityLog.create({
    data: {
      userId: user.id,
      action: 'project.deleted',
      target: project.name,
    },
  });

  return NextResponse.json({ ok: true });
}
