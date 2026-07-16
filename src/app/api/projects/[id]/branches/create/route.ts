import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { provisionDatabase, cloneDatabase } from '@/lib/postgres-admin';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const project = await db.project.findFirst({
    where: { id, userId: user.id },
    include: { branches: { include: { connections: true } } },
  });
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

  const { name, parentBranchId } = await req.json();
  if (!name) return NextResponse.json({ error: 'Nome do branch é obrigatório' }, { status: 400 });

  const branch = await db.branch.create({
    data: {
      projectId: project.id,
      name,
      parentBranchId: parentBranchId || null,
      isDefault: false,
      status: 'creating',
    },
  });

  // Find source database from parent branch
  const parentBranch = parentBranchId
    ? project.branches.find(b => b.id === parentBranchId)
    : project.branches.find(b => b.isDefault) || project.branches[0];

  const sourceConn = parentBranch?.connections.find(c => !c.pooled);

  let provisioned;
  try {
    if (sourceConn && sourceConn.database && sourceConn.database !== 'neondb') {
      // Real branch: clone the parent database
      provisioned = await cloneDatabase(sourceConn.database, `${project.id}-${name}`);
    } else {
      // No parent database (shouldn't happen now), create fresh
      provisioned = await provisionDatabase(`${project.id}-${name}`);
    }
  } catch (e: any) {
    await db.branch.delete({ where: { id: branch.id } });
    return NextResponse.json({
      error: `Falha ao criar branch: ${e.message}`,
    }, { status: 500 });
  }

  // Save connections
  await db.connection.create({
    data: {
      branchId: branch.id,
      role: provisioned.role,
      password: provisioned.password,
      database: provisioned.database,
      host: provisioned.host,
      port: provisioned.port,
      connectionUri: provisioned.connectionUri,
      pooled: false,
    },
  });

  await db.connection.create({
    data: {
      branchId: branch.id,
      role: provisioned.role,
      password: provisioned.password,
      database: provisioned.database,
      host: provisioned.host,
      port: provisioned.port,
      connectionUri: provisioned.pooledConnectionUri,
      pooled: true,
    },
  });

  await db.branch.update({ where: { id: branch.id }, data: { status: 'ready' } });

  await db.activityLog.create({
    data: {
      userId: user.id,
      action: 'branch.created',
      target: `${project.name}/${name}`,
      projectId: project.id,
    },
  });

  return NextResponse.json({ branch: { ...branch, status: 'ready' } });
}
