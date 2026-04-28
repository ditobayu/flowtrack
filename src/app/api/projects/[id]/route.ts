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
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        boards: {
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
        },
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
