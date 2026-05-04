import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        reporterNotified: false,
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
