import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await ctx.params;
  const { status: newStatus } = await req.json();

  const payment = await db.payment.findUnique({ where: { id }, include: { user: true } });
  if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });

  const updates: any = { status: newStatus };
  if (newStatus === 'paid' && !payment.paidAt) {
    updates.paidAt = new Date();
    // Upgrade user plan
    await db.user.update({ where: { id: payment.userId }, data: { plan: payment.plan } });
  }

  const updated = await db.payment.update({ where: { id }, data: updates });

  // Update invoice status
  await db.invoice.updateMany({
    where: { paymentId: id },
    data: { status: newStatus === 'paid' ? 'paid' : 'canceled' },
  });

  return NextResponse.json({ payment: updated });
}
