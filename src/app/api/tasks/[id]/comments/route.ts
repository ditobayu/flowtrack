import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(auth);
    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });
    const comment = await prisma.comment.create({
      data: { taskId: params.id, userId: decoded.userId, userName: decoded.name, content },
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
