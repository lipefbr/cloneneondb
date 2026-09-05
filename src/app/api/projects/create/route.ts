import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, generateProjectSlug } from '@/lib/auth';
import { db } from '@/lib/db';
import { provisionDatabase, ProvisionedDb } from '@/lib/postgres-admin';
import { getQuota, getPlanLabel } from '@/lib/quotas';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { name, region, pgVersion } = await req.json();
    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    // Check quota
    const quota = getQuota(user.plan);
    const existingCount = await db.project.count({ where: { userId: user.id } });
    if (existingCount >= quota.maxProjects) {
      return NextResponse.json({
        error: `Limite do plano ${getPlanLabel(user.plan)} atingido: ${quota.maxProjects} projeto(s). Faça upgrade para criar mais.`,
      }, { status: 403 });
    }

    const slug = generateProjectSlug(name);

    const project = await db.project.create({
      data: {
        name,
        userId: user.id,
        region: region || 'us-east-1',
        pgVersion: pgVersion || '16',
        status: 'creating',
      },
    });

    // Create main branch
    const branch = await db.branch.create({
      data: {
        projectId: project.id,
        name: 'main',
        isDefault: true,
        status: 'creating',
      },
    });

    // Provision real Postgres database + role
    let provisioned: ProvisionedDb;
    try {
      provisioned = await provisionDatabase(`${project.id}-${slug}`);
    } catch (e: any) {
      // Rollback: delete the project + branch
      await db.project.delete({ where: { id: project.id } });
      return NextResponse.json({
        error: `Falha ao provisionar banco: ${e.message}`,
      }, { status: 500 });
    }

    // Save direct connection
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

    // Save pooled connection (same host in our setup)
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

    // Mark as ready
    await db.project.update({ where: { id: project.id }, data: { status: 'active' } });
    await db.branch.update({ where: { id: branch.id }, data: { status: 'ready' } });

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'project.created',
        target: name,
        projectId: project.id,
      },
    });

    return NextResponse.json({
      project: { ...project, status: 'active' },
      branch: { ...branch, status: 'ready' },
      slug,
      connectionUri: provisioned.connectionUri,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const projects = await db.project.findMany({
    where: { userId: user.id },
    include: {
      branches: {
        select: { id: true, name: true, isDefault: true, status: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ projects });
}
