import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const token = signToken({ userId: user.id, email: user.email, name: user.name });
    return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
