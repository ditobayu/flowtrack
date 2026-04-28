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
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true } },
        column: true,
        comments: { orderBy: { createdAt: 'desc' } },
        labels: { include: { label: true } },
        sprint: true,
      },
    });
    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ task });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(auth);
    const body = await req.json();
    const data: Record<string, any> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.columnId !== undefined) data.columnId = body.columnId;
    if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId || null;
    if (body.dueDate !== undefined) {
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (body.order !== undefined) data.order = body.order;

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: {
        assignee: { select: { id: true, name: true } },
        column: true,
      },
    });

    const actionType = body.columnId ? 'task_moved' : 'task_updated';
    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        userName: decoded.name,
        actionType,
        entityType: 'task',
        entityId: params.id,
        metadata: JSON.stringify({
          changes: Object.keys(data),
          projectId: body.projectId,
        }),
      },
    });

    // Check if moved to "Done" column and has reporterChatId → trigger notification info
    let notifyRequired = false;
    if (body.columnId && task.reporterChatId) {
      const doneColumn = await prisma.column.findUnique({ where: { id: body.columnId } });
      if (doneColumn && doneColumn.name.toLowerCase() === 'done') {
        notifyRequired = true;
      }
    }

    // If we need to notify the reporter via Telegram, send the message now
    if (notifyRequired && task.reporterChatId) {
      try {
        const chatId = task.reporterChatId.split(':')[1];
        const token = process.env.HELP_DESK_BOT_TOKEN;
        const text = `✅ Issue #${task.id} (${task.title}) sudah selesai. Terima kasih!`;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fetch = require('node-fetch');
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
        });
      } catch (notifyErr) {
        console.error('Telegram notification failed:', notifyErr);
      }
    }
    return NextResponse.json({
      task,
      notifyRequired,
      notifyInfo: notifyRequired ? {
        taskId: task.id,
        title: task.title,
        reporterChatId: task.reporterChatId,
        reporterName: task.reporterName,
        reporterPlatform: task.reporterPlatform,
      } : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(auth);
    await prisma.task.delete({ where: { id: params.id } });
    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        userName: decoded.name,
        actionType: 'task_deleted',
        entityType: 'task',
        entityId: params.id,
        metadata: '{}',
      },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
