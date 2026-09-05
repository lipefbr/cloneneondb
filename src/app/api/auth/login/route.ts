import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    if (user.status === 'banned') {
      return NextResponse.json({ error: 'Conta banida. Contate o suporte.' }, { status: 403 });
    }
    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'Conta suspensa. Contate o suporte.' }, { status: 403 });
    }

    await createSession(user.id, user.email);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro interno' }, { status: 500 });
  }
}
