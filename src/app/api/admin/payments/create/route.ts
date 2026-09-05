import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export async function POST(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { userId, amount, plan, period, method, status: payStatus, provider } = await req.json();

  if (!userId || !amount || !plan) {
    return NextResponse.json({ error: 'userId, amount e plan são obrigatórios' }, { status: 400 });
  }

  // Create payment
  const payment = await db.payment.create({
    data: {
      userId,
      amount: parseFloat(amount),
      plan,
      period: period || 'monthly',
      method: method || 'pix',
      status: payStatus || 'pending',
      provider: provider || 'manual',
      paidAt: payStatus === 'paid' ? new Date() : null,
    },
  });

  // Generate invoice number
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(payment.id).slice(-6).toUpperCase()}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  await db.invoice.create({
    data: {
      userId,
      paymentId: payment.id,
      number: invoiceNumber,
      amount: parseFloat(amount),
      status: payStatus === 'paid' ? 'paid' : 'pending',
      dueDate,
    },
  });

  // If paid, upgrade the user's plan
  if (payStatus === 'paid') {
    await db.user.update({ where: { id: userId }, data: { plan } });
  }

  return NextResponse.json({ payment });
}
