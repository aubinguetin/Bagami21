'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, Plane, Check, MapPin, Calendar, Scale, Shield, Loader2 } from 'lucide-react';
import { InsufficientBalanceModal } from '@/components/InsufficientBalanceModal';
import { formatAmount } from '@/utils/currencyFormatter';
import { useT, useLocale, translateDeliveryTitle } from '@/lib/i18n-helpers';

// Helper function to get country flag emoji from country code or name
function getCountryFlag(countryCodeOrName: string): string {
  const flagMap: { [key: string]: string } = {
    'AD': '🇦🇩', 'AE': '🇦🇪', 'AF': '🇦🇫', 'AG': '🇦🇬', 'AI': '🇦🇮', 'AL': '🇦🇱', 'AM': '🇦🇲', 'AO': '🇦🇴', 'AQ': '🇦🇶', 'AR': '🇦🇷', 'AS': '🇦🇸', 'AT': '🇦🇹', 'AU': '🇦🇺', 'AW': '🇦🇼', 'AX': '🇦🇽', 'AZ': '🇦🇿',
    'BA': '🇧🇦', 'BB': '🇧🇧', 'BD': '🇧🇩', 'BE': '🇧🇪', 'BF': '🇧🇫', 'BG': '🇧🇬', 'BH': '🇧🇭', 'BI': '🇧🇮', 'BJ': '🇧🇯', 'BL': '🇧🇱', 'BM': '🇧🇲', 'BN': '🇧🇳', 'BO': '🇧🇴', 'BQ': '🇧🇶', 'BR': '🇧🇷', 'BS': '🇧🇸', 'BT': '🇧🇹', 'BV': '🇧🇻', 'BW': '🇧🇼', 'BY': '🇧🇾', 'BZ': '🇧🇿',
    'CA': '🇨🇦', 'CC': '🇨🇨', 'CD': '🇨🇩', 'CF': '🇨🇫', 'CG': '🇨🇬', 'CH': '🇨🇭', 'CI': '🇨🇮', 'CK': '🇨🇰', 'CL': '🇨🇱', 'CM': '🇨🇲', 'CN': '🇨🇳', 'CO': '🇨🇴', 'CR': '🇨🇷', 'CU': '🇨🇺', 'CV': '🇨🇻', 'CW': '🇨🇼', 'CX': '🇨🇽', 'CY': '🇨🇾', 'CZ': '🇨🇿',
    'DE': '🇩🇪', 'DJ': '🇩🇯', 'DK': '🇩🇰', 'DM': '🇩🇲', 'DO': '🇩🇴', 'DZ': '🇩🇿',
    'EC': '🇪🇨', 'EE': '🇪🇪', 'EG': '🇪🇬', 'EH': '🇪🇭', 'ER': '🇪🇷', 'ES': '🇪🇸', 'ET': '🇪🇹', 'EU': '🇪🇺',
    'FI': '🇫🇮', 'FJ': '🇫🇯', 'FK': '🇫🇰', 'FM': '🇫🇲', 'FO': '🇫🇴', 'FR': '🇫🇷', 'France': '🇫🇷',
    'GA': '🇬🇦', 'GB': '🇬🇧', 'GD': '🇬🇩', 'GE': '🇬🇪', 'GF': '🇬🇫', 'GG': '🇬🇬', 'GH': '🇬🇭', 'GI': '🇬🇮', 'GL': '🇬🇱', 'GM': '🇬🇲', 'GN': '🇬🇳', 'GP': '🇬🇵', 'GQ': '🇬🇶', 'GR': '🇬🇷', 'GS': '🇬🇸', 'GT': '🇬🇹', 'GU': '🇬🇺', 'GW': '🇬🇼', 'GY': '🇬🇾',
    'HK': '🇭🇰', 'HM': '🇭🇲', 'HN': '🇭🇳', 'HR': '🇭🇷', 'HT': '🇭🇹', 'HU': '🇭🇺',
    'ID': '🇮🇩', 'IE': '🇮🇪', 'IL': '🇮🇱', 'IM': '🇮🇲', 'IN': '🇮🇳', 'IO': '🇮🇴', 'IQ': '🇮🇶', 'IR': '🇮🇷', 'IS': '🇮🇸', 'IT': '🇮🇹',
    'JE': '🇯🇪', 'JM': '🇯🇲', 'JO': '🇯🇴', 'JP': '🇯🇵',
    'KE': '🇰🇪', 'KG': '🇰🇬', 'KH': '🇰🇭', 'KI': '🇰🇮', 'KM': '🇰🇲', 'KN': '🇰🇳', 'KP': '🇰🇵', 'KR': '🇰🇷', 'KW': '🇰🇼', 'KY': '🇰🇾', 'KZ': '🇰🇿',
    'LA': '🇱🇦', 'LB': '🇱🇧', 'LC': '🇱🇨', 'LI': '🇱🇮', 'LK': '🇱🇰', 'LR': '🇱🇷', 'LS': '🇱🇸', 'LT': '🇱🇹', 'LU': '🇱🇺', 'LV': '🇱🇻', 'LY': '🇱🇾',
    'MA': '🇲🇦', 'MC': '🇲🇨', 'MD': '🇲🇩', 'ME': '🇲🇪', 'MF': '🇲🇫', 'MG': '🇲🇬', 'MH': '🇲🇭', 'MK': '🇲🇰', 'ML': '🇲🇱', 'MM': '🇲🇲', 'MN': '🇲🇳', 'MO': '🇲🇴', 'MP': '🇲🇵', 'MQ': '🇲🇶', 'MR': '🇲🇷', 'MS': '🇲🇸', 'MT': '🇲🇹', 'MU': '🇲🇺', 'MV': '🇲🇻', 'MW': '🇲🇼', 'MX': '🇲🇽', 'MY': '🇲🇾', 'MZ': '🇲🇿',
    'NA': '🇳🇦', 'NC': '🇳🇨', 'NE': '🇳🇪', 'NF': '🇳🇫', 'NG': '🇳🇬', 'NI': '🇳🇮', 'NL': '🇳🇱', 'NO': '🇳🇴', 'NP': '🇳🇵', 'NR': '🇳🇷', 'NU': '🇳🇺', 'NZ': '🇳🇿',
    'OM': '🇴🇲',
    'PA': '🇵🇦', 'PE': '🇵🇪', 'PF': '🇵🇫', 'PG': '🇵🇬', 'PH': '🇵🇭', 'PK': '🇵🇰', 'PL': '🇵🇱', 'PM': '🇵🇲', 'PN': '🇵🇳', 'PR': '🇵🇷', 'PS': '🇵🇸', 'PT': '🇵🇹', 'PW': '🇵🇼', 'PY': '🇵🇾',
    'QA': '🇶🇦',
    'RE': '🇷🇪', 'RO': '🇷🇴', 'RS': '🇷🇸', 'RU': '🇷🇺', 'RW': '🇷🇼',
    'SA': '🇸🇦', 'SB': '🇸🇧', 'SC': '🇸🇨', 'SD': '🇸🇩', 'SE': '🇸🇪', 'SG': '🇸🇬', 'SH': '🇸🇭', 'SI': '🇸🇮', 'SJ': '🇸🇯', 'SK': '🇸🇰', 'SL': '🇸🇱', 'SM': '🇸🇲', 'SN': '🇸🇳', 'SO': '🇸🇴', 'SR': '🇸🇷', 'SS': '🇸🇸', 'ST': '🇸🇹', 'SV': '🇸🇻', 'SX': '🇸🇽', 'SY': '🇸🇾', 'SZ': '🇸🇿',
    'TC': '🇹🇨', 'TD': '🇹🇩', 'TF': '🇹🇫', 'TG': '🇹🇬', 'TH': '🇹🇭', 'TJ': '🇹🇯', 'TK': '🇹🇰', 'TL': '🇹🇱', 'TM': '🇹🇲', 'TN': '🇹🇳', 'TO': '🇹🇴', 'TR': '🇹🇷', 'TT': '🇹🇹', 'TV': '🇹🇻', 'TW': '🇹🇼', 'TZ': '🇹🇿',
    'UA': '🇺🇦', 'UG': '🇺🇬', 'UM': '🇺🇲', 'US': '🇺🇸', 'UY': '🇺🇾', 'UZ': '🇺🇿',
    'VA': '🇻🇦', 'VC': '🇻🇨', 'VE': '🇻🇪', 'VG': '🇻🇬', 'VI': '🇻🇮', 'VN': '🇻🇳', 'VU': '🇻🇺',
    'WF': '🇼🇫', 'WS': '🇼🇸',
    'XK': '🇽🇰',
    'YE': '🇾🇪', 'YT': '🇾🇹',
    'ZA': '🇿🇦', 'ZM': '🇿🇲', 'ZW': '🇿🇼',
    'Burkina Faso': '🇧🇫', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'South Africa': '🇿🇦'
  };
  
  return flagMap[countryCodeOrName] || '🏳️';
}

interface Conversation {
  id: string;
  delivery: {
    id: string;
    title: string;
    description: string | null;
    type: 'request' | 'offer';
    fromCountry: string;
    fromCity: string;
    toCountry: string;
    toCity: string;
    departureDate: string;
    weight: number | null;
    price: number;
    currency: string;
  };
}

export default function PaymentSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const conversationId = params?.conversationId as string;
  const { payment } = useT();
  const locale = useLocale();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [agreedPrice, setAgreedPrice] = useState<number>(0);
  const [agreedCurrency, setAgreedCurrency] = useState<string>('FCFA');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [directPaymentCompleted, setDirectPaymentCompleted] = useState(false);
  const [directPaymentMethod, setDirectPaymentMethod] = useState<string>('');
  const [directPaymentAmount, setDirectPaymentAmount] = useState<number>(0);

  // Check for direct payment completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const completed = urlParams.get('directPaymentCompleted');
    const method = urlParams.get('method');
    const amount = urlParams.get('amount');
    
    if (completed === 'true' && method && amount) {
      setDirectPaymentCompleted(true);
      setDirectPaymentMethod(method);
      setDirectPaymentAmount(parseFloat(amount));
    }
  }, []);

  // Auto-confirm payment after direct payment is completed
  useEffect(() => {
    // Only proceed if direct payment was completed, conversation is loaded, and not already processing
    if (directPaymentCompleted && conversation && agreedPrice > 0 && !isProcessingPayment && session?.user?.id) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleConfirmPayment();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [directPaymentCompleted, conversation, agreedPrice, session]);

  // Fetch conversation data
  useEffect(() => {
    if (!conversationId) return;

    const fetchConversation = async () => {
      try {
        console.log('🔍 Fetching conversation:', conversationId);
        const response = await fetch(`/api/conversations/${conversationId}`);
        if (!response.ok) throw new Error('Failed to fetch conversation');
        
        const data = await response.json();
        console.log('📦 Conversation data received:', data);
        console.log('💰 Delivery price from API:', data.delivery.price);
        setConversation(data);

        // Fetch messages to get agreed price
        const messagesResponse = await fetch(`/api/conversations/${conversationId}/messages`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const messages = messagesData.messages || [];
          console.log('📨 Messages received:', messages.length);
          
          // Find the most recent accepted offer or use delivery price
          const offerMessages = messages
            .filter((m: any) => m.messageType === 'offer')
            .map((m: any) => {
              try {
                const offer = JSON.parse(m.content);
                return {
                  ...offer,
                  messageCreatedAt: m.createdAt // Include message timestamp
                };
              } catch {
                return null;
              }
            })
            .filter((offer: any) => offer && offer.status === 'accepted');

          console.log('💼 All accepted offers:', offerMessages);

          // Sort by message creation time (most recent first) to get the last agreed price
          const lastAcceptedOffer = offerMessages.sort((a: any, b: any) => {
            const dateA = new Date(a.messageCreatedAt).getTime();
            const dateB = new Date(b.messageCreatedAt).getTime();
            return dateB - dateA; // Most recent first
          })[0];

          if (lastAcceptedOffer) {
            console.log('✅ Found last accepted offer:', lastAcceptedOffer);
            console.log('💵 Setting agreed price to:', lastAcceptedOffer.price);
            setAgreedPrice(lastAcceptedOffer.price);
            setAgreedCurrency('FCFA'); // Always use FCFA
          } else {
            console.log('ℹ️ No accepted offer found, using delivery price:', data.delivery.price);
            setAgreedPrice(data.delivery.price);
            setAgreedCurrency('FCFA'); // Always use FCFA
          }
        } else {
          console.log('⚠️ Failed to fetch messages, using delivery price:', data.delivery.price);
          setAgreedPrice(data.delivery.price);
          setAgreedCurrency('FCFA'); // Always use FCFA
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error fetching conversation:', error);
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId]);

  const handleConfirmPayment = async () => {
    console.log('=== PAYMENT CONFIRMATION DEBUG ===');
    console.log('Session state:', session);
    console.log('User ID:', session?.user?.id);
    console.log('Agreed Price:', agreedPrice);
    console.log('Agreed Currency:', agreedCurrency);
    console.log('Delivery Title:', conversation?.delivery?.title);
    
    if (!conversation) {
      alert('Conversation not found. Please try again.');
      return;
    }
    
    if (!session?.user?.id) {
      alert('Session expired. Please login again.');
      router.push('/auth/signin');
      return;
    }
    
    setIsProcessingPayment(true);
    try {
      // Calculate platform fee (call API endpoint instead of direct function)
      const feeResponse = await fetch('/api/platform-fee/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: agreedPrice })
      });
      
      if (!feeResponse.ok) {
        throw new Error('Failed to calculate platform fee');
      }
      
      const feeCalculation = await feeResponse.json();
      
      console.log('🔍 Platform Fee Calculation:', {
        agreedPrice,
        feeRate: feeCalculation.feeRate,
        feePercentage: feeCalculation.feePercentage,
        feeAmount: feeCalculation.feeAmount,
        netAmount: feeCalculation.netAmount,
        grossAmount: feeCalculation.grossAmount
      });
      
      console.log('Payment data:', {
        userId: session.user.id,
        amount: agreedPrice,
        description: `Wallet payment for delivery: ${conversation.delivery.title}`,
        platformFee: feeCalculation.feeAmount,
        netAmount: feeCalculation.netAmount
      });
      
      // Check wallet balance first
      const walletCheckResponse = await fetch(`/api/wallet/balance?userId=${session.user.id}`);
      
      if (!walletCheckResponse.ok) {
        throw new Error('Failed to check wallet balance');
      }
      
      const walletData = await walletCheckResponse.json();
      const currentBalance = walletData.balance || 0;
      
      // If direct payment was completed, we need to process both transactions
      if (directPaymentCompleted && directPaymentAmount > 0) {
        // User has already paid the shortfall via direct payment
        // Now we need to deduct the wallet balance and create both transactions
        
        const walletAmount = currentBalance; // Use all available wallet balance
        const shortfall = directPaymentAmount; // Amount paid via direct payment
        
        // Deduct wallet balance
        if (walletAmount > 0) {
          const walletRequestBody = {
            userId: session.user.id,
            amount: walletAmount,
            description: `Wallet payment for delivery: ${conversation.delivery.title}`,
            category: 'Delivery Payment',
            referenceId: `DELIVERY-${conversation.delivery.id}`,
            metadata: {
              deliveryId: conversation.delivery.id,
              deliveryType: conversation.delivery.type,
              fromCity: conversation.delivery.fromCity,
              toCity: conversation.delivery.toCity,
              paymentType: 'partial_wallet',
              totalAmount: agreedPrice,
              walletAmount: walletAmount,
              directPaymentAmount: shortfall
            }
          };
          
          const walletResponse = await fetch('/api/wallet/debit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(walletRequestBody)
          });
  
          if (!walletResponse.ok) {
            throw new Error('Failed to deduct wallet balance');
          }
        }
        
        // Record the direct payment transaction
        const directPaymentRequestBody = {
          userId: session.user.id,
          amount: shortfall,
          description: `Direct payment for delivery: ${conversation.delivery.title}`,
          category: 'Delivery Payment',
          type: 'debit',
          referenceId: `DELIVERY-${conversation.delivery.id}`,
          metadata: {
            deliveryId: conversation.delivery.id,
            deliveryType: conversation.delivery.type,
            fromCity: conversation.delivery.fromCity,
            toCity: conversation.delivery.toCity,
            paymentType: 'direct_payment',
            paymentMethod: directPaymentMethod,
            totalAmount: agreedPrice,
            walletAmount: walletAmount,
            directPaymentAmount: shortfall
          }
        };
        
        const directPaymentResponse = await fetch('/api/wallet/record-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(directPaymentRequestBody)
        });

        if (!directPaymentResponse.ok) {
          throw new Error('Failed to record direct payment transaction');
        }
        
        // Continue with payment confirmation...
      } else {
        // Check if user has sufficient balance for full wallet payment
        if (currentBalance < agreedPrice) {
          setWalletBalance(currentBalance);
          setShowInsufficientBalanceModal(true);
          setIsProcessingPayment(false);
          return;
        }
      }
      
      // Validate all required fields before sending
      if (!session.user.id) {
        throw new Error('User ID is missing');
      }
      
      if (!agreedPrice || agreedPrice <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      if (!conversation.delivery.title) {
        throw new Error('Delivery title is missing');
      }
      
      let walletResult;
      
      // Only deduct full amount from wallet if NOT using direct payment
      if (!directPaymentCompleted) {
        // Deduct payment from user's wallet
        const requestBody = {
          userId: session.user.id,
          amount: agreedPrice,
          description: `Wallet payment for delivery: ${conversation.delivery.title}`,
          category: 'Delivery Payment',
          referenceId: `DELIVERY-${conversation.delivery.id}`,
          metadata: {
            deliveryId: conversation.delivery.id,
            deliveryType: conversation.delivery.type,
            fromCity: conversation.delivery.fromCity,
            toCity: conversation.delivery.toCity,
            grossAmount: feeCalculation.grossAmount,
            platformFee: feeCalculation.feeAmount,
            netAmount: feeCalculation.netAmount
          }
        };
        
        console.log('Sending wallet debit request:', requestBody);
        
        const walletResponse = await fetch('/api/wallet/debit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!walletResponse.ok) {
          const error = await walletResponse.json();
          throw new Error(error.error || 'Insufficient balance in wallet');
        }

        walletResult = await walletResponse.json();
      } else {
        // Get updated wallet balance after partial deduction
        const balanceResponse = await fetch(`/api/wallet/balance?userId=${session.user.id}`);
        if (balanceResponse.ok) {
          walletResult = await balanceResponse.json();
        }
      }
      
      // Generate a 6-digit delivery confirmation code
      const deliveryCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create payment confirmation data
      const paymentData: any = {
        type: 'payment',
        amount: agreedPrice,
        currency: agreedCurrency,
        paidBy: session.user.name || 'User',
        paidById: session.user.id,
        deliveryId: conversation.delivery.id,
        deliveryTitle: conversation.delivery.title,
        deliveryType: conversation.delivery.type,
        paidAt: new Date().toISOString(),
        status: 'completed',
        deliveryCode: deliveryCode,
        newBalance: walletResult?.balance || walletResult?.wallet?.balance || 0,
        platformFee: feeCalculation.feeAmount,
        netAmount: feeCalculation.netAmount,
        feeRate: feeCalculation.feeRate,
        feePercentage: feeCalculation.feePercentage
      };
      
      // Add payment breakdown if direct payment was used
      if (directPaymentCompleted && directPaymentAmount > 0) {
        paymentData.paymentBreakdown = {
          totalAmount: agreedPrice,
          walletAmount: currentBalance,
          directPaymentAmount: directPaymentAmount,
          directPaymentMethod: directPaymentMethod
        };
      } else if (walletResult?.transaction?.id) {
        paymentData.transactionId = walletResult.transaction.id;
      }

      // Send payment confirmation message
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(paymentData),
          messageType: 'payment'
        })
      });
      
      // Redirect back to chat with success message
      router.push(`/chat/${conversationId}?paymentSuccess=true`);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error instanceof Error ? error.message : 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  // Show processing indicator when auto-confirming after direct payment
  if (directPaymentCompleted && isProcessingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Your Payment</h2>
          <p className="text-gray-600 mb-4">
            Completing your payment transaction...
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✓ Direct payment of {formatAmount(directPaymentAmount)} FCFA received
            </p>
            <p className="text-xs text-green-600 mt-1">
              Finalizing transaction details
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Conversation not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-transparent sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center relative">
            <button
              onClick={() => router.back()}
              className={`absolute left-0 flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 transition-all hover:scale-105 ${
                conversation.delivery.type === 'request'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-blue-500 text-blue-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`px-6 py-2 rounded-full border-2 ${
              conversation.delivery.type === 'request'
                ? 'bg-orange-500 border-orange-500'
                : 'bg-blue-500 border-blue-500'
            }`}>
              <h1 className="text-base font-bold text-white">{payment('title')}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Direct Payment Success Banner */}
        {directPaymentCompleted && !isProcessingPayment && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-4 mb-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Check className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">{payment('successBanner.title')}</h3>
                <p className="text-xs text-white/90 mt-0.5">
                  {payment('successBanner.message')
                    .replace('{amount}', formatAmount(directPaymentAmount))
                    .replace('{method}', directPaymentMethod.replace('_', ' '))}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Trip Details Card */}
            <div className={`rounded-lg p-3 border space-y-2 ${
              conversation.delivery.type === 'request'
                ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
            }`}>
              <div className="flex items-start gap-2">
                <div className={`p-2 rounded-lg ${
                  conversation.delivery.type === 'request' ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {conversation.delivery.type === 'request' ? (
                    <Package className="w-4 h-4 text-white" />
                  ) : (
                    <Plane className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{translateDeliveryTitle(conversation.delivery.title, locale)}</h3>
                  {conversation.delivery.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{conversation.delivery.description}</p>
                  )}
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center gap-2 text-xs">
                <MapPin className={`w-4 h-4 flex-shrink-0 ${
                  conversation.delivery.type === 'request' ? 'text-orange-600' : 'text-blue-600'
                }`} />
                <span className="text-gray-700 truncate">
                  <span className="font-semibold">{getCountryFlag(conversation.delivery.fromCountry)} {conversation.delivery.fromCity}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-semibold">{getCountryFlag(conversation.delivery.toCountry)} {conversation.delivery.toCity}</span>
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-xs">
                <Calendar className={`w-4 h-4 flex-shrink-0 ${
                  conversation.delivery.type === 'request' ? 'text-orange-600' : 'text-blue-600'
                }`} />
                <span className="text-gray-700">
                  {new Date(conversation.delivery.departureDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {/* Weight */}
              {conversation.delivery.weight && (
                <div className="flex items-center gap-2 text-xs">
                  <Scale className={`w-4 h-4 flex-shrink-0 ${
                    conversation.delivery.type === 'request' ? 'text-orange-600' : 'text-blue-600'
                  }`} />
                  <span className="text-gray-700">{conversation.delivery.weight} kg</span>
                </div>
              )}

              {/* Type Badge */}
              <div className="flex items-center gap-2 pt-1">
                {conversation.delivery.type === 'request' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                    <Package className="w-3 h-3" />
                    {payment('tripDetails.deliveryRequest')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    <Plane className="w-3 h-3" />
                    {payment('tripDetails.spaceOffer')}
                  </span>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-green-200">
                <span className="text-xs text-gray-600">{payment('priceBreakdown.originalPrice')}</span>
                <span className="text-xs text-gray-500 line-through">
                  {formatAmount(conversation.delivery.price)} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-gray-900">{payment('priceBreakdown.amountToPay')}</span>
                  {agreedPrice !== conversation.delivery.price && (
                    <p className="text-xs text-green-600 mt-0.5">{payment('priceBreakdown.negotiated')}</p>
                  )}
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {formatAmount(agreedPrice)} {agreedCurrency}
                </span>
              </div>
            </div>

            {/* Payment Protection Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700">
                <p className="font-bold text-blue-900 mb-1">{payment('protection.title')}</p>
                <p className="leading-relaxed">
                  {conversation.delivery.type === 'request' 
                    ? payment('protection.messageRequest')
                    : payment('protection.messageOffer')
                  }
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.back()}
                disabled={isProcessingPayment}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {payment('buttons.cancel')}
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessingPayment}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {payment('buttons.processing')}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {payment('buttons.confirm')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        isOpen={showInsufficientBalanceModal}
        onClose={() => setShowInsufficientBalanceModal(false)}
        requiredAmount={agreedPrice}
        currentBalance={walletBalance}
        currency={agreedCurrency}
        onPayDirectly={() => {
          // Navigate to direct payment page
          const shortfall = agreedPrice - walletBalance;
          router.push(`/direct-payment?conversationId=${conversationId}&required=${agreedPrice}&balance=${walletBalance}&currency=${agreedCurrency}`);
        }}
      />
    </div>
  );
}
