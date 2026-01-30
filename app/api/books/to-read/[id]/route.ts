import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// DELETE /api/books/to-read/[id] - Remove item from To Read list
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const item = await prisma.toReadItem.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    await prisma.toReadItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Removed from To Read list' });
  } catch (error) {
    console.error('Error removing from to-read list:', error);
    return NextResponse.json(
      { error: 'Failed to remove from to-read list' },
      { status: 500 }
    );
  }
}
