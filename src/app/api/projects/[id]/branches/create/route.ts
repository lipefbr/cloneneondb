import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, generateDbPassword } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

  const { name, parentBranchId } = await req.json();
  if (!name) return NextResponse.json({ error: 'Nome do branch é obrigatório' }, { status: 400 });

  const branch = await db.branch.create({
    data: {
      projectId: project.id,
      name,
      parentBranchId: parentBranchId || null,
      isDefault: false,
      status: 'ready',
    },
  });

  const password = generateDbPassword();
  await db.connection.create({
    data: {
      branchId: branch.id,
      role: 'neondb',
      password,
      database: 'neondb',
      pooled: false,
    },
  });

  const pooledPassword = generateDbPassword();
  await db.connection.create({
    data: {
      branchId: branch.id,
      role: 'neondb',
      password: pooledPassword,
      database: 'neondb',
      pooled: true,
    },
  });

  await db.activityLog.create({
    data: {
      userId: user.id,
      action: 'branch.created',
      target: `${project.name}/${name}`,
      projectId: project.id,
    },
  });

  return NextResponse.json({ branch });
}
