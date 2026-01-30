import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/books/to-read - Get user's To Read list
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const items = await prisma.toReadItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching to-read list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch to-read list' },
      { status: 500 }
    );
  }
}

// POST /api/books/to-read - Add a book to To Read list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, author, countryCode, countryName, source } = await request.json();

    if (!title || !author || !countryCode || !countryName) {
      return NextResponse.json(
        { error: 'Title, author, country code, and country name are required' },
        { status: 400 }
      );
    }

    const item = await prisma.toReadItem.create({
      data: {
        title,
        author,
        countryCode,
        countryName,
        source: source || 'recommendation',
        userId: session.user.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error adding to to-read list:', error);
    return NextResponse.json(
      { error: 'Failed to add to to-read list' },
      { status: 500 }
    );
  }
}
