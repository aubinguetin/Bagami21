import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { receiverId } = await req.json();
    const deliveryId = params.id;

    // Get the delivery to verify it exists
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        status: true,
      }
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Update the delivery status to DELIVERED and set receiverId
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERED',
        receiverId: receiverId,
      },
    });

    console.log(`✅ Delivery ${deliveryId} confirmed: status=DELIVERED, receiverId=${receiverId}`);

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
    });

  } catch (error) {
    console.error('Error confirming delivery:', error);
    return NextResponse.json(
      { error: 'Failed to confirm delivery' },
      { status: 500 }
    );
  }
}
