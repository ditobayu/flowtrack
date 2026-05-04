import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/issues — Create issue from helpdesk
// Body: { projectIdentifier, title, description, priority, reporterChatId, reporterName, reporterUsername, reporterPlatform }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectIdentifier, title, description, priority, reporterChatId, reporterName, reporterUsername, reporterPlatform } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }
    if (!reporterChatId) {
      return NextResponse.json({ error: 'reporterChatId required' }, { status: 400 });
    }

    const resolvedPlatform = reporterPlatform || 'telegram';
    const resolvedChatId = String(reporterChatId);
    const reporterUpdate: Record<string, string> = { name: reporterName || '' };
    if (reporterUsername !== undefined) {
      reporterUpdate.username = reporterUsername || '';
    }
    const reporter = await prisma.reporter.upsert({
      where: { platform_chatId: { platform: resolvedPlatform, chatId: resolvedChatId } },
      update: reporterUpdate,
      create: {
        name: reporterName || '',
        username: reporterUsername || '',
        platform: resolvedPlatform,
        chatId: resolvedChatId,
      },
    });

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
        reporterId: reporter.id,
        order: 0,
      },
      include: {
        column: true,
      },
    });

    return NextResponse.json({ task, project: { id: project.id, name: project.name } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
