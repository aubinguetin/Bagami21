import enTranslations from '@/locales/en.json';
import frTranslations from '@/locales/fr.json';
import { translateDeliveryTitle } from '@/lib/i18n-helpers';

type Locale = 'en' | 'fr';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * Convert XOF to FCFA for display
 */
function convertCurrencyForDisplay(currency: string): string {
  return currency === 'XOF' ? 'FCFA' : currency;
}

/**
 * Translate a notification title and message based on locale
 * This function detects patterns in the notification content and translates them
 */
export function translateNotification(
  notification: Notification,
  locale: Locale = 'en'
): { title: string; message: string } {
  // If locale is English, return as-is
  if (locale === 'en') {
    return {
      title: notification.title,
      message: notification.message
    };
  }

  const t = frTranslations.notifications.types;
  let translatedTitle = notification.title;
  let translatedMessage = notification.message;

  // Translate based on notification type
  switch (notification.type) {
    case 'alert_match':
      if (notification.title.includes('delivery request')) {
        translatedTitle = t.alertMatch.requestTitle;
      } else if (notification.title.includes('offer of space')) {
        translatedTitle = t.alertMatch.offerTitle;
      }
      // Message is just location, keep it as-is
      translatedMessage = notification.message;
      break;

    case 'transaction':
      // Wallet top-up
      if (notification.title.includes('Wallet top-up')) {
        translatedTitle = t.transaction.walletTopUp;
      }
      // Refund received
      else if (notification.title.includes('Refund received')) {
        translatedTitle = t.transaction.refundReceived;
      }
      // Payment received
      else if (notification.title.includes('Payment received')) {
        translatedTitle = t.transaction.paymentReceived;
      }
      // Wallet credited
      else if (notification.title.includes('Wallet credited')) {
        translatedTitle = t.transaction.walletCredited;
      }
      // Money received
      else if (notification.title.includes('Money received')) {
        translatedTitle = t.transaction.moneyReceived;
      }
      // Withdrawal requested
      else if (notification.title.includes('Withdrawal requested')) {
        translatedTitle = t.transaction.withdrawalRequested;
      }
      // Payment sent
      else if (notification.title.includes('Payment sent')) {
        translatedTitle = t.transaction.paymentSent;
      }
      // Money sent
      else if (notification.title.includes('Money sent')) {
        translatedTitle = t.transaction.moneySent;
      }
      // Direct payment completed
      else if (notification.title.includes('Direct payment completed')) {
        translatedTitle = t.transaction.directPaymentCompleted;
      }
      // Payment processed
      else if (notification.title.includes('Payment processed')) {
        translatedTitle = t.transaction.paymentProcessed;
      }
      // Withdrawal approved
      else if (notification.title.includes('Withdrawal approved')) {
        translatedTitle = t.transaction.withdrawalApproved;
        // Extract amount and currency from message - handle formatted numbers with commas/spaces
        const approvalMatch = notification.message.match(/(?:of|de)\s+([\d\s,]+)\s+(\w+)\s+(?:has been approved)/);
        if (approvalMatch) {
          const amount = approvalMatch[1].trim();
          const currency = convertCurrencyForDisplay(approvalMatch[2]);
          translatedMessage = t.transaction.withdrawalApprovedMessage
            .replace('{amount}', amount)
            .replace('{currency}', currency);
        }
      }
      // Withdrawal rejected
      else if (notification.title.includes('Withdrawal rejected')) {
        translatedTitle = t.transaction.withdrawalRejected;
        // Extract amount, currency, and reason from message - handle formatted numbers
        const rejectionMatch = notification.message.match(/(?:of|de)\s+([\d\s,]+)\s+(\w+)\s+(?:was rejected).*(?:Reason)\s*:\s*(.+)$/);
        if (rejectionMatch) {
          const amount = rejectionMatch[1].trim();
          const currency = convertCurrencyForDisplay(rejectionMatch[2]);
          const reason = rejectionMatch[3];
          translatedMessage = t.transaction.withdrawalRejectedMessage
            .replace('{amount}', amount)
            .replace('{currency}', currency)
            .replace('{reason}', reason);
        }
      }
      
      // For other transaction types, translate common description patterns in the message
      if (!translatedMessage || translatedMessage === notification.message) {
        // Extract amount and description pattern: "Description - Amount Currency"
        const transactionMatch = notification.message.match(/^(.+?)\s+-\s+([\d\s,]+)\s+(\w+)$/);
        if (transactionMatch) {
          const description = transactionMatch[1];
          const amount = transactionMatch[2];
          const currency = convertCurrencyForDisplay(transactionMatch[3]);
          
          // Translate common description patterns but preserve proper nouns (delivery titles, user names)
          let translatedDesc = description;
          
          // Translate full patterns that include common phrases
          if (/^Direct payment for delivery:\s*(.+)$/i.test(description)) {
            const deliveryTitle = description.match(/^Direct payment for delivery:\s*(.+)$/i)?.[1] || '';
            const translatedDeliveryTitle = translateDeliveryTitle(deliveryTitle, locale);
            translatedDesc = `Paiement direct pour la livraison : ${translatedDeliveryTitle}`;
          } else if (/^Wallet payment for delivery:\s*(.+)$/i.test(description)) {
            const deliveryTitle = description.match(/^Wallet payment for delivery:\s*(.+)$/i)?.[1] || '';
            const translatedDeliveryTitle = translateDeliveryTitle(deliveryTitle, locale);
            translatedDesc = `Paiement par portefeuille pour la livraison : ${translatedDeliveryTitle}`;
          } else if (/^Payment for delivery:\s*(.+)$/i.test(description)) {
            const deliveryTitle = description.match(/^Payment for delivery:\s*(.+)$/i)?.[1] || '';
            const translatedDeliveryTitle = translateDeliveryTitle(deliveryTitle, locale);
            translatedDesc = `Paiement pour la livraison : ${translatedDeliveryTitle}`;
          } else if (/^Payment received for delivery:\s*(.+)$/i.test(description)) {
            const deliveryTitle = description.match(/^Payment received for delivery:\s*(.+)$/i)?.[1] || '';
            const translatedDeliveryTitle = translateDeliveryTitle(deliveryTitle, locale);
            translatedDesc = `Paiement reçu pour la livraison : ${translatedDeliveryTitle}`;
          } else if (/^Payment for travel offer from .+ to .+$/i.test(description)) {
            translatedDesc = description.replace(/^Payment for travel offer from (.+) to (.+)$/i, 'Paiement pour offre de voyage de $1 à $2');
          } else if (/^Payment for delivery from .+ to .+$/i.test(description)) {
            translatedDesc = description.replace(/^Payment for delivery from (.+) to (.+)$/i, 'Paiement pour livraison de $1 à $2');
          } else if (/^Wallet top-up from Bagami:\s*(.+)$/i.test(description)) {
            // Extract the reason and keep it as-is (admin-entered text)
            const reason = description.match(/^Wallet top-up from Bagami:\s*(.+)$/i)?.[1] || '';
            translatedDesc = `Recharge du portefeuille par Bagami : ${reason}`;
          } else if (/^Wallet top-up from Bagami$/i.test(description)) {
            translatedDesc = 'Recharge du portefeuille par Bagami';
          } else if (/^Wallet top-up via\s+(.+)$/i.test(description)) {
            // Extract the payment method and keep it as-is
            const method = description.match(/^Wallet top-up via\s+(.+)$/i)?.[1] || '';
            translatedDesc = `Recharge du portefeuille via ${method}`;
          }
          
          translatedMessage = `${translatedDesc} - ${amount} ${currency}`;
        } else {
          // Keep original if no pattern match
          translatedMessage = notification.message;
        }
      }
      break;

    case 'review':
      // Extract stars and translate
      const stars = notification.title.match(/^(⭐+)/)?.[1] || '';
      translatedTitle = `${stars} ${t.review.title}`;
      
      // Translate message - extract name, rating, and comment
      const reviewMatch = notification.message.match(/^(.+?)\s+gave you\s+(\d+)\s+stars(?::\s+"(.+)")?$/);
      if (reviewMatch) {
        const name = reviewMatch[1];
        const rating = reviewMatch[2];
        const comment = reviewMatch[3];
        
        if (comment) {
          translatedMessage = t.review.withComment
            .replace('{name}', name)
            .replace('{rating}', rating)
            .replace('{comment}', comment);
        } else {
          translatedMessage = t.review.withoutComment
            .replace('{name}', name)
            .replace('{rating}', rating);
        }
      }
      break;

    case 'rating_reminder':
      translatedTitle = t.ratingReminder.title;
      
      // Extract time and name from message
      const reminderMatch = notification.message.match(/It's been (.+?) since.*experience with (.+?)\?/);
      if (reminderMatch) {
        let time = reminderMatch[1];
        const name = reminderMatch[2];
        
        // Translate time expressions
        const timeTranslations: Record<string, string> = {
          '3 hours': '3 heures',
          '24 hours': '24 heures',
          '2 days': '2 jours',
          '3 days': '3 jours',
          '4 days': '4 jours',
          '7 days': '7 jours'
        };
        
        if (timeTranslations[time]) {
          time = timeTranslations[time];
        } else if (time.includes('hours')) {
          time = time.replace('hours', 'heures');
        }
        
        translatedMessage = t.ratingReminder.message
          .replace('{time}', time)
          .replace('{name}', name);
      }
      break;

    case 'update':
      // Password changed (only translate if in English)
      if (notification.title.includes('Password changed') && !notification.title.includes('Mot de passe')) {
        translatedTitle = t.update.passwordChanged;
        translatedMessage = t.update.passwordChangedMessage;
      }
      // Profile updated - Email (only translate if in English)
      else if (notification.message.includes('Your profile information has been updated: Email address')) {
        translatedTitle = t.update.profileUpdated;
        translatedMessage = t.update.emailUpdated;
      }
      // Profile updated - Phone (only translate if in English)
      else if (notification.message.includes('Your profile information has been updated: Phone number')) {
        translatedTitle = t.update.profileUpdated;
        translatedMessage = t.update.phoneUpdated;
      }
      // Profile updated - Multiple fields (only translate if in English)
      else if (notification.title.includes('Profile updated') && !notification.title.includes('Profil mis à jour')) {
        translatedTitle = t.update.profileUpdated;
        
        // Extract field names from message and translate them
        const fieldMatch = notification.message.match(/Your profile information has been updated:\s*(.+)$/);
        if (fieldMatch) {
          let fields = fieldMatch[1];
          
          // Translate field names
          fields = fields
            .replace(/Full name/g, 'Nom complet')
            .replace(/Email address/g, 'Adresse e-mail')
            .replace(/Phone number/g, 'Numéro de téléphone');
          
          translatedMessage = `Vos informations de profil ont été mises à jour : ${fields}`;
        } else {
          translatedMessage = notification.message;
        }
      } else {
        // Already in French or unknown format, keep as-is
        translatedTitle = notification.title;
        translatedMessage = notification.message;
      }
      break;

    case 'id_verification':
      // ID verification approved
      if (notification.title.includes('ID verification approved')) {
        translatedTitle = t.idVerification.approved;
        
        // Translate message based on document type
        if (notification.message.includes('national ID') || notification.message.includes('national_id')) {
          translatedMessage = t.idVerification.approvedMessageNationalId;
        } else if (notification.message.includes('passport')) {
          translatedMessage = t.idVerification.approvedMessagePassport;
        } else {
          translatedMessage = notification.message;
        }
      }
      // ID verification rejected
      else if (notification.title.includes('ID verification rejected')) {
        translatedTitle = t.idVerification.rejected;
        
        // Translate message based on document type
        if (notification.message.includes('national ID') || notification.message.includes('national_id')) {
          translatedMessage = t.idVerification.rejectedMessageNationalId;
        } else if (notification.message.includes('passport')) {
          translatedMessage = t.idVerification.rejectedMessagePassport;
        } else {
          translatedMessage = notification.message;
        }
      } else {
        // Already in French, keep as-is
        translatedTitle = notification.title;
        translatedMessage = notification.message;
      }
      break;

    case 'update':
      // Check if this is an old ID verification notification (before type was changed)
      if (notification.title.includes('ID verification approved')) {
        translatedTitle = t.idVerification.approved;
        
        if (notification.message.includes('national ID') || notification.message.includes('national_id')) {
          translatedMessage = t.idVerification.approvedMessageNationalId;
        } else if (notification.message.includes('passport')) {
          translatedMessage = t.idVerification.approvedMessagePassport;
        } else {
          translatedMessage = notification.message;
        }
      }
      else if (notification.title.includes('ID verification rejected')) {
        translatedTitle = t.idVerification.rejected;
        
        if (notification.message.includes('national ID') || notification.message.includes('national_id')) {
          translatedMessage = t.idVerification.rejectedMessageNationalId;
        } else if (notification.message.includes('passport')) {
          translatedMessage = t.idVerification.rejectedMessagePassport;
        } else {
          translatedMessage = notification.message;
        }
      }
      // Password changed (only translate if in English)
      else if (notification.title.includes('Password changed') && !notification.title.includes('Mot de passe')) {
        translatedTitle = t.update.passwordChanged;
        translatedMessage = t.update.passwordChangedMessage;
      }
      // Profile updated - Email (only translate if in English)
      else if (notification.message.includes('Your profile information has been updated: Email address')) {
        translatedTitle = t.update.profileUpdated;
        translatedMessage = t.update.emailUpdated;
      }
      // Profile updated - Phone (only translate if in English)
      else if (notification.message.includes('Your profile information has been updated: Phone number')) {
        translatedTitle = t.update.profileUpdated;
        translatedMessage = t.update.phoneUpdated;
      }
      // Profile updated - Multiple fields (only translate if in English)
      else if (notification.title.includes('Profile updated') && !notification.title.includes('Profil mis à jour')) {
        translatedTitle = t.update.profileUpdated;
        
        // Extract field names from message and translate them
        const fieldMatch = notification.message.match(/Your profile information has been updated:\s*(.+)$/);
        if (fieldMatch) {
          let fields = fieldMatch[1];
          
          // Translate field names
          fields = fields
            .replace(/Full name/g, 'Nom complet')
            .replace(/Email address/g, 'Adresse e-mail')
            .replace(/Phone number/g, 'Numéro de téléphone');
          
          translatedMessage = `Vos informations de profil ont été mises à jour : ${fields}`;
        } else {
          translatedMessage = notification.message;
        }
      } else {
        // Already in French or unknown format, keep as-is
        translatedTitle = notification.title;
        translatedMessage = notification.message;
      }
      break;

    default:
      // For admin notifications or unknown types, keep original
      translatedTitle = notification.title;
      translatedMessage = notification.message;
  }

  // Final pass: Replace XOF with FCFA in the message for display
  translatedMessage = translatedMessage.replace(/\bXOF\b/g, 'FCFA');

  return {
    title: translatedTitle,
    message: translatedMessage
  };
}
