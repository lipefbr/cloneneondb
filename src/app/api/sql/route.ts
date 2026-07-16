import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Mock SQL execution - returns fake results based on query type
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { query, projectId } = await req.json();
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'Query inválida' }, { status: 400 });
  }

  const trimmed = query.trim().toLowerCase();

  // Simulate latency
  await new Promise(r => setTimeout(r, 300));

  // Detect query type and return mock data
  if (trimmed.startsWith('select')) {
    if (trimmed.includes('information_schema.tables') || trimmed.includes('pg_tables')) {
      return NextResponse.json({
        columns: ['schema', 'name', 'owner', 'tablespace'],
        rows: [
          ['public', 'users', 'neondb', 'pg_default'],
          ['public', 'orders', 'neondb', 'pg_default'],
          ['public', 'products', 'neondb', 'pg_default'],
          ['public', 'sessions', 'neondb', 'pg_default'],
        ],
        rowCount: 4,
        executionTime: Math.floor(Math.random() * 80 + 10),
      });
    }
    if (trimmed.includes('count(')) {
      return NextResponse.json({
        columns: ['count'],
        rows: [[Math.floor(Math.random() * 9999 + 100)]],
        rowCount: 1,
        executionTime: Math.floor(Math.random() * 30 + 5),
      });
    }
    return NextResponse.json({
      columns: ['id', 'name', 'email', 'created_at'],
      rows: Array.from({ length: 5 }).map((_, i) => [
        i + 1,
        `User ${i + 1}`,
        `user${i + 1}@example.com`,
        new Date(Date.now() - i * 86400000).toISOString(),
      ]),
      rowCount: 5,
      executionTime: Math.floor(Math.random() * 50 + 8),
    });
  }

  if (trimmed.startsWith('create')) {
    return NextResponse.json({
      message: 'CREATE',
      rowCount: 0,
      executionTime: Math.floor(Math.random() * 100 + 20),
    });
  }

  if (trimmed.startsWith('insert')) {
    return NextResponse.json({
      message: 'INSERT 0 1',
      rowCount: 1,
      executionTime: Math.floor(Math.random() * 40 + 8),
    });
  }

  if (trimmed.startsWith('update')) {
    return NextResponse.json({
      message: 'UPDATE ' + Math.floor(Math.random() * 5 + 1),
      rowCount: Math.floor(Math.random() * 5 + 1),
      executionTime: Math.floor(Math.random() * 60 + 10),
    });
  }

  if (trimmed.startsWith('delete')) {
    return NextResponse.json({
      message: 'DELETE ' + Math.floor(Math.random() * 3 + 1),
      rowCount: Math.floor(Math.random() * 3 + 1),
      executionTime: Math.floor(Math.random() * 50 + 8),
    });
  }

  if (trimmed.startsWith('drop')) {
    return NextResponse.json({
      message: 'DROP TABLE',
      rowCount: 0,
      executionTime: Math.floor(Math.random() * 80 + 20),
    });
  }

  return NextResponse.json({
    message: 'OK',
    rowCount: 0,
    executionTime: Math.floor(Math.random() * 50 + 10),
  });
}
