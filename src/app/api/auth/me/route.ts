import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(auth);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, email: true, name: true, createdAt: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
