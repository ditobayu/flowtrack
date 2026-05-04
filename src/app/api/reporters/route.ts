import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const username = searchParams.get('username');
    const platform = searchParams.get('platform');
    const chatId = searchParams.get('chatId');
    const query = searchParams.get('q');
    const hasChatId = searchParams.get('hasChatId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const orderByParam = searchParams.get('orderBy');
    const orderParam = searchParams.get('order');

    const where: Record<string, any> = {};
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    if (username) {
      where.username = { contains: username, mode: 'insensitive' };
    }
    if (platform) {
      where.platform = platform;
    }
    if (chatId) {
      where.chatId = String(chatId);
    }
    if (hasChatId !== null) {
      const hasValue = hasChatId === 'true';
      where.chatId = hasValue ? { not: null } : { equals: null };
    }
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { chatId: { contains: query, mode: 'insensitive' } },
      ];
    }

    const takeDefault = 50;
    const take = Math.min(Math.max(parseInt(limitParam || String(takeDefault), 10) || takeDefault, 1), 100);
    const skip = Math.max(parseInt(offsetParam || '0', 10) || 0, 0);
    const orderByField = orderByParam === 'name' || orderByParam === 'createdAt' ? orderByParam : 'createdAt';
    const orderByDirection = orderParam === 'asc' ? 'asc' : 'desc';

    const reporters = await prisma.reporter.findMany({
      where,
      orderBy: { [orderByField]: orderByDirection },
      take,
      skip,
    });

    return NextResponse.json({ reporters, meta: { limit: take, offset: skip } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

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
