import enTranslations from '@/locales/en.json';
import frTranslations from '@/locales/fr.json';

type Locale = 'en' | 'fr';

/**
 * Get notification translations for a specific locale
 */
function getNotificationTranslations(locale: Locale = 'en') {
  const translations = locale === 'fr' ? frTranslations : enTranslations;
  return translations.notifications.types;
}

/**
 * Get user's preferred locale from database
 * Falls back to 'en' if not found
 * TODO: Add locale column to User table
 */
export async function getUserLocale(userId: string): Promise<Locale> {
  try {
    // For now, default to 'en' until we add locale column to User table
    // TODO: Uncomment when locale column is added
    /*
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true }
    });
    
    return (user?.locale as Locale) || 'en';
    */
    return 'en';
  } catch (error) {
    console.error('Error fetching user locale:', error);
    return 'en';
  }
}

/**
 * Generate alert match notification content
 */
export function generateAlertMatchNotification(
  deliveryType: 'request' | 'offer',
  fromCity: string,
  fromCountry: string,
  toCity: string,
  toCountry: string,
  locale: Locale = 'en'
) {
  const t = getNotificationTranslations(locale);
  
  const title = deliveryType === 'request' 
    ? t.alertMatch.requestTitle 
    : t.alertMatch.offerTitle;
  
  const message = `${fromCity}, ${fromCountry} → ${toCity}, ${toCountry}`;
  
  return { title, message };
}

/**
 * Generate transaction notification content
 */
export function generateTransactionNotification(
  type: 'credit' | 'debit',
  category: string,
  amount: number,
  currency: string,
  description: string,
  locale: Locale = 'en'
) {
  const t = getNotificationTranslations(locale);
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount);
  
  let title = '';
  let message = '';
  
  if (type === 'credit') {
    switch (category) {
      case 'Bonus':
        if (description.includes('Wallet top-up from Bagami')) {
          title = t.transaction.walletTopUp;
          message = `${description} - ${formattedAmount} ${currency}`;
        } else if (description.includes('Wallet top-up')) {
          // For any wallet top-up transaction
          title = t.transaction.moneyReceived;
          message = `${description} - ${formattedAmount} ${currency}`;
        } else {
          title = t.transaction.refundReceived;
          message = `${description} - ${formattedAmount} ${currency}`;
        }
        break;
      case 'Delivery Payment':
        title = t.transaction.paymentReceived;
        message = `${description} - ${formattedAmount} ${currency}`;
        break;
      case 'Top-up':
      case 'Admin Credit':
        title = t.transaction.walletCredited;
        message = `${description} - ${formattedAmount} ${currency}`;
        break;
      default:
        title = t.transaction.moneyReceived;
        message = `${description} - ${formattedAmount} ${currency}`;
    }
  } else {
    switch (category) {
      case 'Withdrawal':
        title = t.transaction.withdrawalRequested;
        message = `${description} - ${formattedAmount} ${currency}`;
        break;
      case 'Delivery Payment':
        title = t.transaction.paymentSent;
        message = `${description} - ${formattedAmount} ${currency}`;
        break;
      default:
        title = t.transaction.moneySent;
        message = `${description} - ${formattedAmount} ${currency}`;
    }
  }
  
  return { title, message };
}

/**
 * Generate direct payment notification content
 */
export function generateDirectPaymentNotification(
  type: 'debit' | 'credit',
  category: string,
  amount: number,
  description: string,
  metadata: any,
  locale: Locale = 'en'
) {
  const t = getNotificationTranslations(locale);
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount);
  
  let title = '';
  let message = '';
  
  if (type === 'debit') {
    if (category === 'Delivery Payment' || metadata?.paymentType === 'direct_payment') {
      title = t.transaction.directPaymentCompleted;
      message = `${description} - ${formattedAmount} XOF`;
    } else {
      title = t.transaction.paymentProcessed;
      message = `${description} - ${formattedAmount} XOF`;
    }
  } else {
    title = t.transaction.paymentReceived;
    message = `${description} - ${formattedAmount} XOF`;
  }
  
  return { title, message };
}

/**
 * Generate review notification content
 */
export function generateReviewNotification(
  rating: number,
  reviewerName: string,
  comment: string | null,
  locale: Locale = 'en'
) {
  const t = getNotificationTranslations(locale);
  const stars = '⭐'.repeat(rating);
  
  const title = `${stars} ${t.review.title}`;
  const message = comment
    ? t.review.withComment
        .replace('{name}', reviewerName)
        .replace('{rating}', `${rating}`)
        .replace('{comment}', comment)
    : t.review.withoutComment
        .replace('{name}', reviewerName)
        .replace('{rating}', `${rating}`);
  
  return { title, message };
}

/**
 * Generate rating reminder notification content
 */
export function generateRatingReminderNotification(
  hoursElapsed: number,
  partnerName: string,
  locale: Locale = 'en'
) {
  const t = getNotificationTranslations(locale);
  
  let timeDescription = '';
  if (hoursElapsed === 24) {
    timeDescription = locale === 'fr' ? '24 heures' : '24 hours';
  } else if (hoursElapsed === 48) {
    timeDescription = locale === 'fr' ? '2 jours' : '2 days';
  } else if (hoursElapsed === 72) {
    timeDescription = locale === 'fr' ? '3 jours' : '3 days';
  } else if (hoursElapsed === 96) {
    timeDescription = locale === 'fr' ? '4 jours' : '4 days';
  } else if (hoursElapsed === 168) {
    timeDescription = locale === 'fr' ? '7 jours' : '7 days';
  } else {
    timeDescription = locale === 'fr' ? `${hoursElapsed} heures` : `${hoursElapsed} hours`;
  }
  
  const title = t.ratingReminder.title;
  const message = t.ratingReminder.message
    .replace('{time}', timeDescription)
    .replace('{name}', partnerName);
  
  return { title, message };
}

/**
 * Generate profile update notification content
 */
export function generateProfileUpdateNotification(
  updatedFields: string[],
  locale: Locale = 'en'
) {
  const t = getNotificationTranslations(locale);
  
  const title = t.update.profileUpdated;
  
  // Determine which specific message to use
  if (updatedFields.length === 1) {
    if (updatedFields[0] === 'email') {
      return { title, message: t.update.emailUpdated };
    } else if (updatedFields[0] === 'phone') {
      return { title, message: t.update.phoneUpdated };
    }
  }
  
  // For multiple fields
  const fieldLabels: Record<string, string> = locale === 'fr' 
    ? {
        name: 'Nom complet',
        email: 'Adresse e-mail',
        phone: 'Numéro de téléphone'
      }
    : {
        name: 'Full name',
        email: 'Email address',
        phone: 'Phone number'
      };
  
  const fieldNames = updatedFields.map(field => fieldLabels[field] || field).join(', ');
  const message = t.update.profileFieldsUpdated.replace('{fields}', fieldNames);
  
  return { title, message };
}

/**
 * Generate password change notification content
 */
export function generatePasswordChangeNotification(locale: Locale = 'en') {
  const t = getNotificationTranslations(locale);
  
  return {
    title: t.update.passwordChanged,
    message: t.update.passwordChangedMessage
  };
}

/**
 * Generate withdrawal approval notification content
 */
export function generateWithdrawalApprovalNotification(
  amount: number,
  currency: string,
  locale: Locale = 'en'
) {
  const t = getNotificationTranslations(locale);
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount);
  
  return {
    title: t.transaction.withdrawalApproved,
    message: t.transaction.withdrawalApprovedMessage
      .replace('{amount}', formattedAmount)
      .replace('{currency}', currency)
  };
}

/**
 * Generate withdrawal rejection notification content
 */
export function generateWithdrawalRejectionNotification(
  amount: number,
  currency: string,
  reason: string,
  locale: Locale = 'en'
) {
  const t = getNotificationTranslations(locale);
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(amount);
  
  return {
    title: t.transaction.withdrawalRejected,
    message: t.transaction.withdrawalRejectedMessage
      .replace('{amount}', formattedAmount)
      .replace('{currency}', currency)
      .replace('{reason}', reason)
  };
}

/**
 * Generate ID verification notification content
 */
export function generateIdVerificationNotification(
  status: 'approved' | 'rejected',
  documentType: 'national_id' | 'passport',
  locale: Locale = 'en'
) {
  const t = getNotificationTranslations(locale);
  
  const title = status === 'approved' 
    ? t.idVerification.approved 
    : t.idVerification.rejected;
  
  let message = '';
  if (status === 'approved') {
    message = documentType === 'national_id' 
      ? t.idVerification.approvedMessageNationalId
      : t.idVerification.approvedMessagePassport;
  } else {
    message = documentType === 'national_id'
      ? t.idVerification.rejectedMessageNationalId
      : t.idVerification.rejectedMessagePassport;
  }
  
  return { title, message };
}
