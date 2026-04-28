import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(auth);
    const { searchParams } = new URL(req.url);
    const reporterNotified = searchParams.get('reporterNotified');

    // If reporterNotified query param is provided, filter by that field
    // This is used by third-party apps to find tasks that need notification
    if (reporterNotified !== null) {
      const isNotified = reporterNotified === 'true';
      const tasks = await prisma.task.findMany({
        where: {
          reporterNotified: isNotified,
          reporterChatId: { not: '' },
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          reporter: { select: { id: true, name: true, email: true } },
          column: {
            include: {
              board: {
                include: {
                  project: { select: { id: true, name: true } },
                },
              },
            },
          },
          labels: { include: { label: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
      return NextResponse.json({ tasks });
    }

    // Default: return tasks assigned to the current user
    const tasks = await prisma.task.findMany({
      where: { assigneeId: decoded.userId },
      include: {
        column: {
          include: {
            board: {
              include: {
                project: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
    return NextResponse.json({ tasks });
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
