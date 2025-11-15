import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch single delivery
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deliveryId = params.id;
    
    // Allow unauthenticated access to view deliveries
    const delivery = await prisma.delivery.findUnique({
      where: {
        id: deliveryId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            reviewsReceived: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                reviewer: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            },
            idDocuments: {
              select: {
                verificationStatus: true
              }
            }
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Calculate average rating for the sender
    const reviews = delivery.sender.reviewsReceived || [];
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;
    const reviewCount = reviews.length;

    // Check if user has at least one approved ID document
    const isVerified = delivery.sender.idDocuments?.some(
      (doc) => doc.verificationStatus === 'approved'
    ) || false;

    // Return delivery with calculated rating and verification status
    const responseData = {
      ...delivery,
      sender: {
        ...delivery.sender,
        averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : null,
        reviewCount,
        isVerified
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery' },
      { status: 500 }
    );
  }
}

// PUT - Edit delivery
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const deliveryId = params.id;
    const body = await request.json();
    
    const { 
      postType,
      itemType,
      fromCountry, 
      fromCity, 
      toCountry, 
      toCity, 
      title,
      description, 
      departureDate,
      arrivalDate,
      weight,
      price,
      notes,
      // Support fallback auth
      currentUserId: fallbackUserId,
      currentUserContact: fallbackUserContact
    } = body;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Check if current user owns this delivery
    let currentUserId: string | undefined = session?.user?.id;
    if (!currentUserId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      currentUserId = user?.id;
    }

    if (!currentUserId || delivery.senderId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own deliveries' }, { status: 403 });
    }

    // Prepare update data
    const fromLocation = `${fromCity}, ${fromCountry}`;
    const toLocation = `${toCity}, ${toCountry}`;

    // Generate title based on post type
    let finalTitle = title;
    if (!finalTitle) {
      finalTitle = postType === 'delivery' 
        ? `Space request: ${itemType} delivery` 
        : `Space offer: ${fromLocation} to ${toLocation}`;
    }

    // Handle description/notes based on post type
    let finalDescription = description || "";
    if (postType === 'delivery' && notes && notes.trim()) {
      // For delivery requests, combine description and notes
      finalDescription = `${description}\n\nAdditional Notes:\n${notes}`;
    } else if (postType === 'travel' && notes) {
      // For travel offers, use notes as description
      finalDescription = notes || 'Travel offer';
    }

    // Prepare update data object
    const updateData: any = {
      fromCountry,
      fromCity,
      toCountry,
      toCity,
      title: finalTitle,
      description: finalDescription,
      departureDate: new Date(departureDate),
      weight: weight ? parseFloat(weight) : undefined,
      price: price ? parseFloat(price) : undefined,
    };

    // Only update arrivalDate if provided (for delivery requests)
    if (arrivalDate) {
      updateData.arrivalDate = new Date(arrivalDate);
    }

    // Update delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData
    });

    return NextResponse.json({ 
      message: 'Delivery updated successfully', 
      delivery: updatedDelivery 
    });

  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery' },
      { status: 500 }
    );
  }
}

// DELETE - Remove delivery
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => ({}));
    const { currentUserId: fallbackUserId, currentUserContact: fallbackUserContact } = body;

    const deliveryId = params.id;

    // Get existing delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Check if current user owns this delivery - support both NextAuth and fallback auth
    let currentUserId: string | undefined;
    
    if (session?.user?.id) {
      currentUserId = session.user.id;
    } else if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      currentUserId = user?.id;
    } else if (fallbackUserId) {
      currentUserId = fallbackUserId;
    } else if (fallbackUserContact) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: fallbackUserContact },
            { phone: fallbackUserContact }
          ]
        }
      });
      currentUserId = user?.id;
    }

    if (!currentUserId || delivery.senderId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own deliveries' }, { status: 403 });
    }

    // Soft delete delivery (set deletedAt timestamp)
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ 
      message: 'Delivery deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting delivery:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery' },
      { status: 500 }
    );
  }
}

// PATCH - Activate/Deactivate delivery
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deliveryId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status || !['PENDING', 'INACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be PENDING or INACTIVE' }, { status: 400 });
    }

    // Get existing delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Check if current user owns this delivery
    let currentUserId: string | undefined = session.user?.id;
    if (!currentUserId && session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      currentUserId = user?.id;
    }

    if (!currentUserId || delivery.senderId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own deliveries' }, { status: 403 });
    }

    // Update delivery status
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: { status }
    });

    return NextResponse.json({ 
      message: `Delivery ${status.toLowerCase()} successfully`, 
      delivery: updatedDelivery 
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery status' },
      { status: 500 }
    );
  }
}