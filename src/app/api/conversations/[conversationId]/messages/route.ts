import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { broadcastToConversation } from '@/lib/sse';
import { requireActiveUser } from '@/lib/checkUserActive';

// GET - Retrieve messages for a specific conversation
export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const currentUserId = url.searchParams.get('currentUserId');
    const currentUserContact = url.searchParams.get('currentUserContact');
    
    let currentUser = null;

    // Try NextAuth session first
    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
    }
    
    // Fallback to direct user lookup if no session or user not found
    if (!currentUser) {
      if (currentUserId) {
        currentUser = await prisma.user.findUnique({
          where: { id: currentUserId }
        });
      } else if (currentUserContact) {
        // Decode the URL-encoded contact info
        const decodedContact = decodeURIComponent(currentUserContact);
        
        currentUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: decodedContact },
              { phone: decodedContact }
            ]
          }
        });

        // If not found and it looks like a phone number, try separated format
        if (!currentUser && decodedContact.startsWith('+')) {
          console.log('🔍 Messages GET: Trying separated phone format for:', decodedContact);
          try {
            const result = await prisma.$queryRaw`
              SELECT * FROM User 
              WHERE countryCode IS NOT NULL AND phone IS NOT NULL 
              AND CONCAT(countryCode, phone) = ${decodedContact}
              LIMIT 1
            ` as any[];
            
            if (result && result.length > 0) {
              currentUser = result[0];
              console.log('✅ Messages GET: Found user with separated phone format:', currentUser.id);
            }
          } catch (error) {
            console.error('Error in separated phone query:', error);
          }
        }
      }
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    // Check if user is suspended (real-time check)
    try {
      await requireActiveUser(currentUser.id);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Your account has been suspended. Please contact customer service.',
        code: 'ACCOUNT_SUSPENDED'
      }, { status: 403 });
    }

    const conversationId = params.conversationId;

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: currentUser.id },
          { participant2Id: currentUser.id }
        ]
      },
      include: {
        delivery: {
          include: {
            sender: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        },
        participant1: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            country: true,
            countryCode: true,
            reviewsReceived: {
              select: {
                rating: true
              }
            },
            idDocuments: {
              select: {
                verificationStatus: true
              }
            }
          }
        },
        participant2: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            country: true,
            countryCode: true,
            reviewsReceived: {
              select: {
                rating: true
              }
            },
            idDocuments: {
              select: {
                verificationStatus: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Get messages for this conversation
    const messages = await prisma.message.findMany({
      where: { conversationId: conversationId },
      include: {
        sender: {
          select: { id: true, name: true, email: true, phone: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read for the current user
    await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: currentUser.id },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Determine the other participant
    const otherParticipant = conversation.participant1Id === currentUser.id 
      ? conversation.participant2 
      : conversation.participant1;

    // Calculate average rating for other participant
    const reviews = otherParticipant.reviewsReceived || [];
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

    // Check if user is verified (has at least one approved ID document)
    const isVerified = otherParticipant.idDocuments?.some(
      (doc) => doc.verificationStatus === 'approved'
    ) || false;

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        deliveryId: conversation.deliveryId,
        delivery: conversation.delivery,
        otherParticipant: {
          id: otherParticipant.id,
          name: otherParticipant.name,
          email: otherParticipant.email,
          phone: otherParticipant.phone,
          country: otherParticipant.country,
          countryCode: otherParticipant.countryCode,
          averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : null,
          reviewCount: reviews.length,
          isVerified
        },
        createdAt: conversation.createdAt,
        lastMessageAt: conversation.lastMessageAt
      },
      messages
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message in the conversation
export async function POST(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { content, messageType = 'text', currentUserId, currentUserContact } = body;

    if (!content) {
      return NextResponse.json({ 
        error: 'Message content is required' 
      }, { status: 400 });
    }

    const conversationId = params.conversationId;
    let currentUser = null;

    // Try NextAuth session first
    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
    }
    
    // Fallback to direct user lookup if no session or user not found
    if (!currentUser) {
      if (currentUserId) {
        currentUser = await prisma.user.findUnique({
          where: { id: currentUserId }
        });
      } else if (currentUserContact) {
        // Decode the URL-encoded contact info
        const decodedContact = decodeURIComponent(currentUserContact);
        
        currentUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: decodedContact },
              { phone: decodedContact }
            ]
          }
        });

        // If not found and it looks like a phone number, try separated format
        if (!currentUser && decodedContact.startsWith('+')) {
          console.log('🔍 Messages POST: Trying separated phone format for:', decodedContact);
          try {
            const result = await prisma.$queryRaw`
              SELECT * FROM User 
              WHERE countryCode IS NOT NULL AND phone IS NOT NULL 
              AND CONCAT(countryCode, phone) = ${decodedContact}
              LIMIT 1
            ` as any[];
            
            if (result && result.length > 0) {
              currentUser = result[0];
              console.log('✅ Messages POST: Found user with separated phone format:', currentUser.id);
            }
          } catch (error) {
            console.error('Error in separated phone query:', error);
          }
        }
      }
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    // Check if user is suspended (real-time check)
    try {
      await requireActiveUser(currentUser.id);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Your account has been suspended. Please contact customer service.',
        code: 'ACCOUNT_SUSPENDED'
      }, { status: 403 });
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: currentUser.id },
          { participant2Id: currentUser.id }
        ]
      },
      include: {
        delivery: {
          select: {
            id: true,
            deletedAt: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Check if the delivery has been deleted
    if (conversation.delivery.deletedAt) {
      return NextResponse.json({ 
        error: 'This delivery has been deleted. You can no longer send messages in this conversation.' 
      }, { status: 403 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversationId,
        senderId: currentUser.id,
        content: content,
        messageType: messageType
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    // Update conversation's last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Broadcast new message to all SSE subscribers for this conversation (excluding sender)
    try {
      broadcastToConversation(conversationId, {
        type: 'new-message',
        conversationId: conversationId,
        message: message,
        timestamp: new Date().toISOString()
      }, currentUser.id); // Exclude the sender from receiving the broadcast
      console.log(`📡 Message broadcasted via SSE to conversation ${conversationId} (excluding sender ${currentUser.id})`);
    } catch (sseError) {
      console.error('Error broadcasting via SSE:', sseError);
      // Don't fail the API call if SSE broadcast fails
    }

    // Update unread count for the message recipient
    try {
      const recipientId = conversation.participant1Id === currentUser.id ? 
        conversation.participant2Id : 
        conversation.participant1Id;

      // Get updated unread count for the recipient
      const unreadCount = await prisma.message.count({
        where: {
          isRead: false,
          senderId: { not: recipientId },
          conversation: {
            OR: [
              { participant1Id: recipientId },
              { participant2Id: recipientId }
            ]
          }
        }
      });

      // Broadcast unread count update to recipient
      const { broadcastUnreadCountToUser } = await import('@/lib/sse');
      await broadcastUnreadCountToUser(recipientId, unreadCount);
      console.log(`🔢 Unread count update sent to user ${recipientId}: ${unreadCount} unread messages`);
    } catch (unreadError) {
      console.error('Error updating unread count via SSE:', unreadError);
      // Don't fail the API call if unread count update fails
    }

    return NextResponse.json({
      success: true,
      message,
      messageText: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}