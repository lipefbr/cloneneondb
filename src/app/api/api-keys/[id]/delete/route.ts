import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const key = await db.apiKey.findFirst({ where: { id, userId: user.id } });
  if (!key) return NextResponse.json({ error: 'Chave não encontrada' }, { status: 404 });

  await db.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
