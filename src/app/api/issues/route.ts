import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/issues — Create issue from helpdesk
// Body: { projectIdentifier, title, description, priority, reporterChatId, reporterName, reporterPlatform }
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(auth);
    const body = await req.json();
    const { projectIdentifier, title, description, priority, reporterChatId, reporterName, reporterPlatform } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }
    if (!reporterChatId) {
      return NextResponse.json({ error: 'reporterChatId required' }, { status: 400 });
    }

    // Find project by name or id
    let project = null;
    if (projectIdentifier) {
      project = await prisma.project.findFirst({
        where: {
          OR: [
            { id: projectIdentifier },
            { name: { equals: projectIdentifier, mode: 'insensitive' } },
          ],
        },
        include: {
          boards: {
            include: {
              columns: { orderBy: { order: 'asc' }, take: 1 },
            },
          },
        },
      });
    }

    // If no project found, try to find any project or use first available
    if (!project) {
      project = await prisma.project.findFirst({
        include: {
          boards: {
            include: {
              columns: { orderBy: { order: 'asc' }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!project || !project.boards[0]) {
      return NextResponse.json({ error: 'No project/board found' }, { status: 404 });
    }

    // Use first column (Backlog) as default
    const targetColumnId = project.boards[0].columns[0]?.id;
    if (!targetColumnId) {
      return NextResponse.json({ error: 'No column found' }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'medium',
        columnId: targetColumnId,
        reporterChatId: String(reporterChatId),
        reporterName: reporterName || '',
        reporterPlatform: reporterPlatform || 'telegram',
        reporterId: decoded.userId,
        order: 0,
      },
      include: {
        column: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        userName: decoded.name || 'Helpdesk',
        actionType: 'issue_created',
        entityType: 'task',
        entityId: task.id,
        metadata: JSON.stringify({
          title,
          reporterChatId: String(reporterChatId),
          reporterName,
          projectId: project.id,
        }),
      },
    });

    return NextResponse.json({ task, project: { id: project.id, name: project.name } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
