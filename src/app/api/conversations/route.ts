import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Retrieve all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('currentUserId');
    const currentUserContact = searchParams.get('currentUserContact');

    console.log('🔍 Conversations GET request:', { session: !!session, currentUserId, currentUserContact });

    let currentUser;

    // Try NextAuth session first
    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
    }
    
    // If no session, try custom authentication with user ID
    if (!currentUser && currentUserId) {
      currentUser = await prisma.user.findUnique({
        where: { id: currentUserId }
      });
    }

    // If still no user, try finding by contact (email or phone)
    if (!currentUser && currentUserContact) {
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
        console.log('🔍 Trying separated phone format for:', decodedContact);
        try {
          const result = await prisma.$queryRaw`
            SELECT * FROM User 
            WHERE countryCode IS NOT NULL AND phone IS NOT NULL 
            AND CONCAT(countryCode, phone) = ${decodedContact}
            LIMIT 1
          ` as any[];
          
          if (result && result.length > 0) {
            currentUser = result[0];
            console.log('✅ Found user with separated phone format:', currentUser.id);
          }
        } catch (error) {
          console.error('Error in separated phone query:', error);
        }
      }
    }

    if (!currentUser) {
      console.log('❌ No user found with provided authentication');
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    console.log('✅ Found current user:', currentUser.id);

    let conversations;
    try {
      // Get all conversations for this user
      conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { participant1Id: currentUser.id },
            { participant2Id: currentUser.id }
          ],
          isActive: true
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
          select: { id: true, name: true, email: true, phone: true }
        },
        participant2: {
          select: { id: true, name: true, email: true, phone: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: currentUser.id },
                isRead: false
              }
            }
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });
    } catch (conversationError) {
      console.error('❌ Error in conversation query:', conversationError);
      
      // If there's a sender field error, try a simpler query without sender includes
      if (conversationError instanceof Error && conversationError.message.includes('sender is required')) {
        console.log('🔄 Retrying with simplified query...');
        try {
          conversations = await prisma.conversation.findMany({
            where: {
              OR: [
                { participant1Id: currentUser.id },
                { participant2Id: currentUser.id }
              ],
              isActive: true
            },
            include: {
              delivery: {
                select: { 
                  id: true, 
                  title: true, 
                  type: true, 
                  fromCountry: true, 
                  toCountry: true,
                  senderId: true 
                }
              },
              participant1: {
                select: { id: true, name: true, email: true, phone: true }
              },
              participant2: {
                select: { id: true, name: true, email: true, phone: true }
              },
              _count: {
                select: {
                  messages: {
                    where: {
                      senderId: { not: currentUser.id },
                      isRead: false
                    }
                  }
                }
              }
            },
            orderBy: { lastMessageAt: 'desc' }
          });
          console.log('✅ Simplified query successful');
        } catch (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
          return NextResponse.json(
            { error: 'Failed to fetch conversations due to data integrity issues' },
            { status: 500 }
          );
        }
      } else {
        throw conversationError; // Re-throw if it's not the sender error
      }
    }

    // For each conversation, check if it has a delivery confirmation message
    const conversationsWithStatus = await Promise.all(
      conversations.map(async (conv) => {
        // Check if there's any delivery confirmation message in this conversation
        const hasDeliveryConfirmation = await prisma.message.findFirst({
          where: {
            conversationId: conv.id,
            messageType: 'deliveryConfirmation'
          }
        });

        return {
          id: conv.id,
          deliveryId: conv.deliveryId,
          delivery: conv.delivery,
          otherParticipant: conv.participant1Id === currentUser.id ? conv.participant2 : conv.participant1,
          lastMessage: (conv as any).messages?.[0] || null,
          unreadCount: conv._count.messages,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
          hasDeliveryConfirmation: !!hasDeliveryConfirmation
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      conversations: conversationsWithStatus
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST - Create a new conversation about a delivery
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { deliveryId, otherUserId, currentUserId, currentUserContact } = body;

    console.log('API Request body:', body);
    console.log('Session:', session);

    if (!deliveryId || !otherUserId) {
      return NextResponse.json({ 
        error: 'Delivery ID and other user ID are required' 
      }, { status: 400 });
    }

    let currentUser;

    // Try NextAuth session first
    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
    }
    
    // If no session, try custom authentication with user ID
    if (!currentUser && currentUserId) {
      currentUser = await prisma.user.findUnique({
        where: { id: currentUserId }
      });
    }

    // If still no user, try finding by contact (email or phone)
    if (!currentUser && currentUserContact) {
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
        console.log('🔍 Trying separated phone format for:', decodedContact);
        try {
          const result = await prisma.$queryRaw`
            SELECT * FROM User 
            WHERE countryCode IS NOT NULL AND phone IS NOT NULL 
            AND CONCAT(countryCode, phone) = ${decodedContact}
            LIMIT 1
          ` as any[];
          
          if (result && result.length > 0) {
            currentUser = result[0];
            console.log('✅ Found user with separated phone format:', currentUser.id);
          }
        } catch (error) {
          console.error('Error in separated phone query:', error);
        }
      }
    }

    if (!currentUser) {
      console.log('No user found with provided authentication');
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the delivery exists
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        sender: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Verify the other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId }
    });

    if (!otherUser) {
      return NextResponse.json({ error: 'Other user not found' }, { status: 404 });
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        deliveryId: deliveryId,
        OR: [
          { participant1Id: currentUser.id, participant2Id: otherUserId },
          { participant1Id: otherUserId, participant2Id: currentUser.id }
        ]
      },
      include: {
        delivery: true,
        participant1: {
          select: { id: true, name: true, email: true, phone: true }
        },
        participant2: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    if (existingConversation) {
      return NextResponse.json({ 
        success: true, 
        conversation: existingConversation,
        message: 'Conversation already exists'
      });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        deliveryId: deliveryId,
        participant1Id: currentUser.id,
        participant2Id: otherUserId,
        lastMessageAt: new Date()
      },
      include: {
        delivery: true,
        participant1: {
          select: { id: true, name: true, email: true, phone: true }
        },
        participant2: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    // Create a single system message with structured content for personalized display
    const deliveryType = (delivery as any).type === 'request' ? 'delivery request' : 'space offer';
    const deliverySenderName = delivery.sender.name || 'Unknown User';
    const currentUserName = currentUser.name || 'Unknown User';
    
    // Determine who is the delivery poster (sender) vs who is responding (current user)
    const isCurrentUserDeliveryPoster = delivery.senderId === currentUser.id;
    
    if (!isCurrentUserDeliveryPoster) {
      // Current user is responding to someone else's delivery
      if ((delivery as any).type === 'request') {
        // For delivery requests: Create structured content for personalized display
        const systemContent = JSON.stringify({
          type: 'personalized',
          deliveryType: 'request',
          acceptorId: currentUser.id,
          acceptorName: currentUserName,
          requesterId: delivery.senderId,
          requesterName: deliverySenderName,
          // Templates for different perspectives
          acceptorMessage: `You accepted ${deliverySenderName}'s ${deliveryType}`,
          requesterMessage: `${currentUserName} accepted your ${deliveryType}`
        });
        
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: currentUser.id,
            content: systemContent,
            messageType: 'system'
          }
        });
      } else {
        // For travel offers: Create structured content for personalized display
        const systemContent = JSON.stringify({
          type: 'personalized',
          deliveryType: 'offer',
          requesterId: currentUser.id,
          requesterName: currentUserName,
          offerId: delivery.senderId,
          offerName: deliverySenderName,
          // Templates for different perspectives
          requesterMessage: `You are requesting ${deliverySenderName}'s approval for delivery offer from ${delivery.fromCity}, ${delivery.fromCountry} to ${delivery.toCity}, ${delivery.toCountry}`,
          offerMessage: `${currentUserName} is requesting your approval for delivery offer`
        });
        
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: currentUser.id,
            content: systemContent,
            messageType: 'system'
          }
        });
      }
    } else {
      // Fallback for edge case where delivery poster starts conversation with themselves
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: currentUser.id,
          content: `Started conversation about delivery: ${delivery.title}`,
          messageType: 'system'
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      conversation,
      message: 'Conversation created successfully'
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}