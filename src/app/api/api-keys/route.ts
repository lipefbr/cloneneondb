import { NextResponse } from 'next/server';
import { getCurrentUser, generateApiKey } from '@/lib/auth';
import { db } from '@/lib/db';
import { getQuota } from '@/lib/quotas';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const keys = await db.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, key: true, createdAt: true, lastUsedAt: true },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

  // Check quota
  const quota = getQuota(user.plan);
  const existingCount = await db.apiKey.count({ where: { userId: user.id } });
  if (existingCount >= quota.maxApiKeys) {
    return NextResponse.json({
      error: `Limite de API keys atingido: ${quota.maxApiKeys}. Faça upgrade para criar mais.`,
    }, { status: 403 });
  }

  const key = await db.apiKey.create({
    data: {
      name,
      key: generateApiKey(),
      userId: user.id,
    },
  });

  return NextResponse.json({ key });
}
