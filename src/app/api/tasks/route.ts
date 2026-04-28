import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(auth);
    const { title, description, priority, columnId, assigneeId, dueDate, projectId } =
      await req.json();
    if (!title || !columnId) {
      return NextResponse.json({ error: 'Title and column required' }, { status: 400 });
    }
    const maxOrder = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'medium',
        columnId,
        assigneeId: assigneeId || null,
        reporterId: decoded.userId,
        dueDate: dueDate ? new Date(dueDate) : null,
        order: (maxOrder?.order ?? -1) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        labels: { include: { label: true } },
      },
    });
    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        userName: decoded.name,
        actionType: 'task_created',
        entityType: 'task',
        entityId: task.id,
        metadata: JSON.stringify({ title, projectId }),
      },
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
