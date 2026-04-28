import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    verifyToken(auth);
    const board = await prisma.board.findFirst({
      where: { projectId: params.id },
      include: {
        columns: {
          include: {
            tasks: {
              include: {
                assignee: { select: { id: true, name: true } },
                labels: { include: { label: true } },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!board) {
      return NextResponse.json({ error: 'No board' }, { status: 404 });
    }
    return NextResponse.json({ board });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
