import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { Client } from 'pg';

export async function GET(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  const where: any = {};
  if (search) {
    where.OR = [{ name: { contains: search } }];
  }

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true, plan: true } },
        branches: {
          select: {
            id: true, name: true, isDefault: true, status: true,
            connections: { select: { database: true, role: true, host: true, port: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.project.count({ where }),
  ]);

  // Get database sizes from Postgres (if available)
  let dbSizes: Record<string, { sizeBytes: number; sizePretty: string }> = {};
  if (process.env.PG_SUPERUSER_PASSWORD) {
    try {
      const client = new Client({
        user: process.env.PG_SUPERUSER_USER || 'postgres',
        password: process.env.PG_SUPERUSER_PASSWORD,
        host: process.env.PG_SUPERUSER_HOST || 'localhost',
        port: parseInt(process.env.PG_SUPERUSER_PORT || '5432', 10),
        database: 'postgres',
        connectionTimeoutMillis: 3000,
      });
      await client.connect();
      const res = await client.query(`
        SELECT datname, pg_database_size(datname) AS size_bytes,
               pg_size_pretty(pg_database_size(datname)) AS size_pretty
        FROM pg_database WHERE datname LIKE 'proj_%';
      `);
      for (const row of res.rows) {
        dbSizes[row.datname] = { sizeBytes: row.size_bytes, sizePretty: row.size_pretty };
      }
      await client.end();
    } catch (e: any) {
      // ignore — sizes will just be empty
    }
  }

  // Enrich projects with sizes
  const enriched = projects.map(p => {
    const mainBranch = p.branches.find(b => b.isDefault) || p.branches[0];
    const conn = mainBranch?.connections[0];
    const sizeInfo = conn ? dbSizes[conn.database] : null;
    return {
      ...p,
      databaseName: conn?.database || null,
      databaseSize: sizeInfo?.sizePretty || '—',
      databaseSizeBytes: sizeInfo?.sizeBytes || 0,
    };
  });

  return NextResponse.json({
    projects: enriched,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
