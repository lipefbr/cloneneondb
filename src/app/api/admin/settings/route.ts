import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const settings = await db.systemSetting.findMany({ orderBy: { key: 'asc' } });
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { key, value } = await req.json();
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key e value são obrigatórios' }, { status: 400 });
  }

  const setting = await db.systemSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });

  return NextResponse.json({ setting });
}
