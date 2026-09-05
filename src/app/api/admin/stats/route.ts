import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Client } from 'pg';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  // App metadata stats
  const [
    totalUsers,
    totalProjects,
    totalBranches,
    totalApiKeys,
    usersByPlan,
  ] = await Promise.all([
    db.user.count(),
    db.project.count(),
    db.branch.count(),
    db.apiKey.count(),
    db.user.groupBy({ by: ['plan'], _count: true }),
  ]);

  // Postgres real stats (if available)
  let pgStats: any = null;
  const pgPass = process.env.PG_SUPERUSER_PASSWORD;
  if (pgPass) {
    try {
      const client = new Client({
        user: process.env.PG_SUPERUSER_USER || 'postgres',
        password: pgPass,
        host: process.env.PG_SUPERUSER_HOST || 'localhost',
        port: parseInt(process.env.PG_SUPERUSER_PORT || '5432', 10),
        database: 'postgres',
        connectionTimeoutMillis: 3000,
      });
      await client.connect();

      const [dbCount, roleCount, activeConn, totalConn] = await Promise.all([
        client.query(`SELECT COUNT(*) FROM pg_database WHERE datname NOT LIKE 'postgres%' AND datname NOT IN ('template0', 'template1');`),
        client.query(`SELECT COUNT(*) FROM pg_roles WHERE rolname LIKE 'neondb_%';`),
        client.query(`SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';`),
        client.query(`SELECT COUNT(*) FROM pg_stat_activity;`),
      ]);

      // Database sizes
      const sizesRes = await client.query(`
        SELECT datname AS name,
               pg_size_pretty(pg_database_size(datname)) AS size_pretty,
               pg_database_size(datname) AS size_bytes
        FROM pg_database
        WHERE datname LIKE 'proj_%'
        ORDER BY size_bytes DESC
        LIMIT 10;
      `);

      pgStats = {
        totalDatabases: parseInt(dbCount.rows[0].count, 10),
        totalRoles: parseInt(roleCount.rows[0].count, 10),
        activeConnections: parseInt(activeConn.rows[0].count, 10),
        totalConnections: parseInt(totalConn.rows[0].count, 10),
        maxConnections: 200,
        largestDatabases: sizesRes.rows,
      };

      await client.end();
    } catch (e: any) {
      pgStats = { error: e.message };
    }
  }

  return NextResponse.json({
    stats: {
      users: totalUsers,
      projects: totalProjects,
      branches: totalBranches,
      apiKeys: totalApiKeys,
      usersByPlan: usersByPlan.map((u: any) => ({ plan: u.plan, count: u._count })),
    },
    postgres: pgStats,
  });
}
