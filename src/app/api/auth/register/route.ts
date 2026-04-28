import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash, name } });
    const token = signToken({ userId: user.id, email: user.email, name: user.name });
    return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
