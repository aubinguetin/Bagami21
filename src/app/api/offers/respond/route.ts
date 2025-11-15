import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId, action } = await request.json();

    if (!messageId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. messageId and action (accept/reject) are required.' },
        { status: 400 }
      );
    }

    // Get the offer message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            delivery: true,
          },
        },
        sender: true,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Offer message not found' },
        { status: 404 }
      );
    }

    // Verify the current user is the recipient (not the sender)
    if (message.senderId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot respond to your own offer' },
        { status: 403 }
      );
    }

    // Parse the offer data
    let offerData;
    try {
      offerData = JSON.parse(message.content);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid offer data' },
        { status: 400 }
      );
    }

    // Update the offer data with the response
    offerData.status = action === 'accept' ? 'accepted' : 'rejected';
    offerData.respondedAt = new Date().toISOString();
    offerData.respondedBy = session.user.id;

    // Update the message with the new status
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: JSON.stringify(offerData),
      },
    });

    // Send a system message confirming the acceptance or rejection
    if (action === 'accept') {
      await prisma.message.create({
        data: {
          conversationId: message.conversationId,
          senderId: session.user.id,
          content: JSON.stringify({
            type: 'offerAccepted',
            price: offerData.price,
            currency: offerData.currency
          }),
          messageType: 'system',
        },
      });
    } else {
      await prisma.message.create({
        data: {
          conversationId: message.conversationId,
          senderId: session.user.id,
          content: JSON.stringify({
            type: 'offerDeclined',
            price: offerData.price,
            currency: offerData.currency
          }),
          messageType: 'system',
        },
      });
    }

    return NextResponse.json({
      success: true,
      action,
      message: updatedMessage,
    });
  } catch (error) {
    console.error('Error responding to offer:', error);
    return NextResponse.json(
      { error: 'Failed to respond to offer' },
      { status: 500 }
    );
  }
}
