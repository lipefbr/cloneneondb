import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, generateDbPassword, generateProjectSlug } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { name, region, pgVersion } = await req.json();
    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    const slug = generateProjectSlug(name);

    const project = await db.project.create({
      data: {
        name,
        userId: user.id,
        region: region || 'us-east-1',
        pgVersion: pgVersion || '16',
        status: 'active',
      },
    });

    // Create main branch with connection strings
    const branch = await db.branch.create({
      data: {
        projectId: project.id,
        name: 'main',
        isDefault: true,
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
        action: 'project.created',
        target: name,
        projectId: project.id,
      },
    });

    return NextResponse.json({ project, branch, slug });
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
