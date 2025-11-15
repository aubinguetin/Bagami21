import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: params.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
        conversations: {
          include: {
            participant1: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            participant2: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            messages: {
              select: {
                id: true,
                messageType: true,
                content: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Calculate status for each conversation
    const conversationsWithStatus = delivery.conversations.map((conv) => {
      const hasPayment = conv.messages.some(msg => msg.messageType === 'payment');
      const hasDeliveryConfirmation = conv.messages.some(msg => msg.messageType === 'deliveryConfirmation');
      
      let status = 'pending';
      if (hasDeliveryConfirmation) {
        status = 'delivered';
      } else if (hasPayment) {
        status = 'paid';
      }

      // Get payment and delivery dates
      const paymentMessage = conv.messages.find(msg => msg.messageType === 'payment');
      const deliveryMessage = conv.messages.find(msg => msg.messageType === 'deliveryConfirmation');

      return {
        id: conv.id,
        participant1: conv.participant1,
        participant2: conv.participant2,
        status,
        hasPayment,
        hasDeliveryConfirmation,
        paymentDate: paymentMessage?.createdAt,
        deliveryDate: deliveryMessage?.createdAt,
        createdAt: conv.createdAt,
        lastMessageAt: conv.lastMessageAt,
      };
    });

    return NextResponse.json({
      ...delivery,
      conversations: conversationsWithStatus,
    });
  } catch (error) {
    console.error('Error fetching delivery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete the delivery
    const delivery = await prisma.delivery.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    // Log the action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: 'delete_delivery',
        targetId: params.id,
        details: `Deleted delivery: ${delivery.title}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery' },
      { status: 500 }
    );
  }
}
