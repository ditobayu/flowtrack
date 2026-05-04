import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, platform, chatId } = body || {};
    const normalizedChatId = chatId ? String(chatId) : null;

    const reporter = await prisma.reporter.create({
      data: {
        name: name || '',
        username: username || '',
        platform: platform || 'telegram',
        chatId: normalizedChatId,
      },
    });

    return NextResponse.json({ reporter }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Reporter already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
