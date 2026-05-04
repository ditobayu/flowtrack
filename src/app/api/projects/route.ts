import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
      include: { _count: { select: { boards: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ projects });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(auth);
    const { name, description } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        boards: {
          create: {
            name,
            type: 'kanban',
            columns: {
              create: [
                { name: 'Backlog', order: 0 },
                { name: 'To Do', order: 1 },
                { name: 'In Progress', order: 2 },
                { name: 'Review', order: 3 },
                { name: 'Done', order: 4 },
              ],
            },
          },
        },
      },
      include: {
        boards: { include: { columns: true } },
      },
    });
    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        userName: decoded.name,
        actionType: 'project_created',
        entityType: 'project',
        entityId: project.id,
        metadata: JSON.stringify({ name }),
      },
    });
    return NextResponse.json({ project });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
