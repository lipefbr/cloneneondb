import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { executeUserQuery } from '@/lib/postgres-admin';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { query, projectId, branchId } = await req.json();
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'Query inválida' }, { status: 400 });
  }

  if (!projectId) {
    return NextResponse.json({ error: 'Selecione um projeto' }, { status: 400 });
  }

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: {
      branches: {
        where: branchId ? { id: branchId } : undefined,
        include: { connections: true },
        take: 1,
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  }

  const branch = project.branches[0];
  if (!branch) {
    return NextResponse.json({ error: 'Nenhum branch encontrado' }, { status: 404 });
  }

  const conn = branch.connections.find(c => !c.pooled) || branch.connections[0];
  if (!conn) {
    return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
  }

  // If the connection is still a placeholder (no real database), fall back to mock
  if (conn.database === 'neondb' || !conn.host || conn.host === 'localhost') {
    return NextResponse.json({
      error: 'Banco de dados não provisionado. Crie um novo projeto.',
    }, { status: 400 });
  }

  try {
    const result = await executeUserQuery(
      conn.database,
      conn.role,
      conn.password,
      query
    );
    return NextResponse.json(result);
  } catch (e: any) {
    // Parse Postgres error messages
    let errorMsg = e.message;
    if (e.code) {
      errorMsg = `[${e.code}] ${errorMsg}`;
    }
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
