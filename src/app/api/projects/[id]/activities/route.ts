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
    const activities = await prisma.activityLog.findMany({
      where: {
        OR: [
          { entityId: params.id, entityType: 'project' },
          { entityType: 'task', metadata: { contains: params.id } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ activities });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
