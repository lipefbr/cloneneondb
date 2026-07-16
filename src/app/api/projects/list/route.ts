import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

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
