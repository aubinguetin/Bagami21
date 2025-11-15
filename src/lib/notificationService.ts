import { PrismaClient } from '@prisma/client';
import { getUserLocale, generateAlertMatchNotification } from './notificationTranslations';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

interface DeliveryData {
  id: string;
  type: 'request' | 'offer';
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  senderId: string;
}

/**
 * Check for alert matches and create notifications
 * This function is called after a new delivery is created
 */
export async function checkAndNotifyAlertMatches(delivery: DeliveryData) {
  try {
    console.log('🔔 Checking for alert matches for delivery:', delivery.id);

    // Build the where clause to find matching alerts
    const whereClause: any = {
      isActive: true,
      userId: { not: delivery.senderId }, // Don't notify the sender
      OR: [
        { alertType: 'all' }, // Alerts for all types
        { alertType: delivery.type === 'request' ? 'requests' : 'offers' }
      ]
    };

    // Add location filters (match if alert has no location specified OR if locations match)
    const locationConditions: any[] = [];

    // Departure location matching
    locationConditions.push({
      OR: [
        { departureCountry: null }, // Alert has no departure country filter
        {
          AND: [
            { departureCountry: delivery.fromCountry },
            {
              OR: [
                { departureCity: null }, // Alert has country but no city filter
                { departureCity: delivery.fromCity }
              ]
            }
          ]
        }
      ]
    });

    // Destination location matching
    locationConditions.push({
      OR: [
        { destinationCountry: null }, // Alert has no destination country filter
        {
          AND: [
            { destinationCountry: delivery.toCountry },
            {
              OR: [
                { destinationCity: null }, // Alert has country but no city filter
                { destinationCity: delivery.toCity }
              ]
            }
          ]
        }
      ]
    });

    whereClause.AND = locationConditions;

    // Find matching alerts
    const matchingAlerts = await prisma.alert.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📬 Found ${matchingAlerts.length} matching alerts`);

    if (matchingAlerts.length === 0) {
      return;
    }

    // Create notifications for each matching alert
    const notifications = await Promise.all(
      matchingAlerts.map(async (alert) => {
        const locale = await getUserLocale(alert.userId);
        const { title, message } = generateAlertMatchNotification(
          delivery.type,
          delivery.fromCity,
          delivery.fromCountry,
          delivery.toCity,
          delivery.toCountry,
          locale
        );

        return prisma.notification.create({
          data: {
            userId: alert.userId,
            type: 'alert_match',
            title,
            message,
            relatedId: delivery.id,
            isRead: false
          }
        });
      })
    );

    console.log(`✅ Created ${notifications.length} notifications for alert matches`);

    // TODO: Send email notifications for users who have emailNotifications enabled
    // This can be implemented later with your email service

    return notifications;
  } catch (error) {
    console.error('❌ Error checking alert matches:', error);
    // Don't throw - we don't want to fail delivery creation if notification fails
    return [];
  }
}
