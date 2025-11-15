import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLocale, generateReviewNotification } from '@/lib/notificationTranslations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rating, comment, deliveryId, revieweeId, reviewerId, reviewerContact } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!deliveryId || !revieweeId) {
      return NextResponse.json(
        { error: 'Delivery ID and reviewee ID are required' },
        { status: 400 }
      );
    }

    // Get reviewer info
    let currentReviewerId = reviewerId;
    if (!currentReviewerId && reviewerContact) {
      const reviewer = await prisma.user.findFirst({
        where: {
          OR: [
            { email: reviewerContact },
            { phone: reviewerContact }
          ]
        }
      });
      currentReviewerId = reviewer?.id;
    }

    if (!currentReviewerId) {
      return NextResponse.json(
        { error: 'Reviewer not found' },
        { status: 404 }
      );
    }

    // Verify delivery exists
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId }
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Create review in database
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        reviewerId: currentReviewerId,
        revieweeId,
        deliveryId
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Delete all rating reminder notifications for this reviewer about this delivery
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          deliveryId: deliveryId,
          OR: [
            { participant1Id: currentReviewerId, participant2Id: revieweeId },
            { participant1Id: revieweeId, participant2Id: currentReviewerId },
          ],
        },
        select: {
          id: true,
        },
      });

      const relatedIds = [deliveryId];
      if (conversation?.id) {
        relatedIds.push(conversation.id);
      }

      const deletedReminders = await prisma.notification.deleteMany({
        where: {
          userId: currentReviewerId,
          type: 'rating_reminder',
          relatedId: {
            in: relatedIds,
          },
        },
      });

      console.log(`🗑️ Deleted ${deletedReminders.count} rating reminder notifications for reviewer ${currentReviewerId}`);
    } catch (deleteError) {
      console.error('⚠️ Failed to delete rating reminders:', deleteError);
      // Don't fail the review creation if deletion fails
    }

    // Create notification for the reviewee
    try {
      const locale = await getUserLocale(revieweeId);
      const { title, message } = generateReviewNotification(
        rating,
        review.reviewer.name || 'Someone',
        comment,
        locale
      );

      await prisma.notification.create({
        data: {
          userId: revieweeId,
          type: 'review',
          title,
          message,
          relatedId: review.id,
          isRead: false
        }
      });
      console.log('✅ Review notification created for user:', revieweeId);
    } catch (notifError) {
      console.error('⚠️ Failed to create review notification:', notifError);
      // Don't fail the review creation if notification fails
    }

    return NextResponse.json({
      success: true,
      review
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userContact = searchParams.get('userContact');
    const ratingFilter = searchParams.get('rating');

    // Get current user
    let currentUserId: string | null = null;

    if (userId) {
      currentUserId = userId;
    } else if (userContact) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userContact },
            { phone: userContact }
          ]
        }
      });
      currentUserId = user?.id || null;
    }

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch real reviews from database
    const whereClause: any = {
      revieweeId: currentUserId
    };

    if (ratingFilter) {
      whereClause.rating = parseInt(ratingFilter);
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        delivery: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate stats from all reviews (not just filtered ones)
    const allReviews = await prisma.review.findMany({
      where: {
        revieweeId: currentUserId
      },
      select: {
        rating: true
      }
    });

    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0
      ? allReviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      5: allReviews.filter((r: { rating: number }) => r.rating === 5).length,
      4: allReviews.filter((r: { rating: number }) => r.rating === 4).length,
      3: allReviews.filter((r: { rating: number }) => r.rating === 3).length,
      2: allReviews.filter((r: { rating: number }) => r.rating === 2).length,
      1: allReviews.filter((r: { rating: number }) => r.rating === 1).length,
    };

    return NextResponse.json({
      reviews,
      stats: {
        totalReviews,
        averageRating,
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
