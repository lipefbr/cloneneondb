import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  const where: any = {};
  if (statusFilter) where.status = statusFilter;

  const [payments, total, summary] = await Promise.all([
    db.payment.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.payment.count({ where }),
    db.payment.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    payments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary: summary.map(s => ({
      status: s.status,
      count: s._count,
      total: s._sum.amount || 0,
    })),
  });
}
