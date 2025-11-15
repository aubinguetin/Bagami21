'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  X,
  Package,
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  User,
  MessageCircle,
  Star,
  Award,
  Shield,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Phone
} from 'lucide-react';
import { formatAmount } from '@/utils/currencyFormatter';
import { useT, useLocale, translateDeliveryTitle } from '@/lib/i18n-helpers';
import { getCountriesList } from '@/data/locations';

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

// Helper to get status badge styling
function getStatusBadge(status: string, t: any) {
  const statusMap: { [key: string]: { label: string; className: string; icon: any } } = {
    'PENDING': { 
      label: t('status.available'), 
      className: 'bg-green-100 text-green-700 border-green-200',
      icon: Clock
    },
    'IN_PROGRESS': { 
      label: t('status.inProgress'), 
      className: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Package
    },
    'COMPLETED': { 
      label: t('status.completed'), 
      className: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: CheckCircle2
    },
    'CANCELLED': { 
      label: t('status.cancelled'), 
      className: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle
    }
  };
  
  return statusMap[status] || statusMap['PENDING'];
}

// Helper function to mask email
function maskEmail(email: string): string {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  const visibleChars = Math.min(2, Math.floor(username.length / 3));
  const maskedUsername = username.slice(0, visibleChars) + '***' + username.slice(-1);
  return `${maskedUsername}@${domain}`;
}

// Helper function to mask phone number
function maskPhone(phone: string): string {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 4) return '****';
  
  const visibleEnd = cleanPhone.slice(-2);
  const maskedSection = '*'.repeat(cleanPhone.length - 2);
  return maskedSection + visibleEnd;
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContactConfirm, setShowContactConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  const [existingConversation, setExistingConversation] = useState<any>(null);
  const [checkingConversation, setCheckingConversation] = useState(true);

  const t = useT();
  const locale = useLocale();
  const deliveryId = params?.id as string;

  // Get current user info from session or localStorage
  const getCurrentUserInfo = () => {
    if (session?.user?.id) {
      const userContact = session.user.email || (session.user as any).phone;
      return {
        userId: session.user.id,
        userContact: userContact
      };
    }
    
    const currentUserId = localStorage.getItem('bagami_user_id');
    const currentUserContact = localStorage.getItem('bagami_user_contact');
    
    return {
      userId: currentUserId,
      userContact: currentUserContact
    };
  };

  // Fetch delivery details
  useEffect(() => {
    async function fetchDelivery() {
      if (!deliveryId) return;
      
      try {
        const response = await fetch(`/api/deliveries/${deliveryId}`);
        if (response.ok) {
          const data = await response.json();
          setDelivery(data);
        } else {
          console.error('Failed to fetch delivery');
          router.push('/deliveries');
        }
      } catch (error) {
        console.error('Error fetching delivery:', error);
        router.push('/deliveries');
      } finally {
        setLoading(false);
      }
    }

    fetchDelivery();
  }, [deliveryId, router]);

  // Check for existing conversation
  useEffect(() => {
    async function checkExistingConversation() {
      if (!deliveryId || !delivery) {
        setCheckingConversation(false);
        return;
      }

      try {
        const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
        
        if (!currentUserId && !currentUserContact) {
          setCheckingConversation(false);
          return;
        }

        // Fetch all conversations for current user
        const response = await fetch(
          `/api/conversations?currentUserId=${currentUserId || ''}&currentUserContact=${encodeURIComponent(currentUserContact || '')}`
        );

        if (response.ok) {
          const data = await response.json();
          
          // Find conversation for this specific delivery
          const conversation = data.conversations?.find(
            (conv: any) => conv.deliveryId === deliveryId
          );

          if (conversation) {
            setExistingConversation(conversation);
          }
        }
      } catch (error) {
        console.error('Error checking for existing conversation:', error);
      } finally {
        setCheckingConversation(false);
      }
    }

    checkExistingConversation();
  }, [deliveryId, delivery]);

  const handleContactClick = () => {
    setShowContactConfirm(true);
  };

  const handleConfirmContact = async () => {
    setIsContacting(true);
    try {
      const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryId: delivery.id,
          otherUserId: delivery.senderId || delivery.sender?.id,
          currentUserId: currentUserId,
          currentUserContact: currentUserContact
        }),
      });

      const result = await response.json();

      if (response.ok && result.conversation) {
        setShowContactConfirm(false);
        router.push(`/chat/${result.conversation.id}?from=delivery&deliveryId=${delivery.id}`);
      } else {
        alert(`Error: ${result.error || 'Failed to create conversation'}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsContacting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t.deliveryDetail('loading')}</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{t.deliveryDetail('notFound')}</p>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(delivery.status, t.deliveryDetail);
  const StatusIcon = statusBadge.icon;
  const countries = getCountriesList(locale);
  
  // Helper to get translated country name
  const getCountryName = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    return country?.name || countryCode;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Transparent Header with Styled Elements */}
      <div className="fixed top-0 left-0 right-0 bg-transparent z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                // Check if user came from notifications page
                if (typeof window !== 'undefined') {
                  const searchParams = new URLSearchParams(window.location.search);
                  const from = searchParams.get('from');
                  
                  if (from === 'notifications') {
                    router.push('/notifications');
                  } else {
                    router.push('/deliveries');
                  }
                } else {
                  router.push('/deliveries');
                }
              }}
              className={`flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 transition-all hover:scale-105 ${
                delivery.type === 'request' 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-blue-500 text-blue-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className={`flex-1 mx-4 flex justify-center`}>
              <div className={`px-6 py-2 rounded-full border-2 flex items-center justify-center ${
                delivery.type === 'request' 
                  ? 'bg-orange-500 border-orange-500' 
                  : 'bg-blue-500 border-blue-500'
              }`}>
                <h1 className="text-base font-bold text-white text-center">{delivery.title || t.deliveryDetail('title')}</h1>
              </div>
            </div>
            
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Content padding to account for fixed header */}
      <div className="pt-20"></div>

      {/* Compact Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-3">
            {/* Compact Route - Cocolis Style */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                {/* Departure */}
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-2xl">{getCountryFlag(delivery.fromCountry)}</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{delivery.fromCity}</p>
                    <p className="text-xs text-gray-500">{getCountryName(delivery.fromCountry)}</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="px-3">
                  <div className="flex items-center space-x-1 text-gray-400">
                    <div className="w-8 h-px bg-gray-300"></div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Destination */}
                <div className="flex items-center space-x-2 flex-1 justify-end">
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{delivery.toCity}</p>
                    <p className="text-xs text-gray-500">{getCountryName(delivery.toCountry)}</p>
                  </div>
                  <span className="text-2xl">{getCountryFlag(delivery.toCountry)}</span>
                </div>
              </div>
            </div>

            {/* Info Grid - Cocolis Style */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Weight */}
                {delivery.weight && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t.deliveryDetail('info.weight')}</p>
                    <p className="font-semibold text-gray-900">{delivery.weight} kg</p>
                  </div>
                )}

                {/* Price */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t.deliveryDetail('info.price')}</p>
                  <p className="font-bold text-green-600 text-xl">{formatAmount(delivery.price || 0)} FCFA</p>
                </div>

                {/* Arrival Date / Needed By - Only show for delivery requests */}
                {delivery.arrivalDate && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      {delivery.type === 'request' ? t.deliveryDetail('info.neededBy') : t.deliveryDetail('info.arrivalDate')}
                    </p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {new Date(delivery.arrivalDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {/* Departure Date - Only show for travel offers */}
                {delivery.type === 'offer' && delivery.departureDate && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t.deliveryDetail('info.departureDate')}</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {new Date(delivery.departureDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {delivery.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    {delivery.type === 'request' ? t.deliveryDetail('info.itemDescription') : t.deliveryDetail('info.serviceDescription')}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {delivery.type === 'request' && delivery.description.includes('\n\nAdditional Notes:\n')
                      ? delivery.description.split('\n\nAdditional Notes:\n')[0]
                      : delivery.description}
                  </p>
                </div>
              )}

              {/* Additional Notes - Only for delivery requests */}
              {delivery.type === 'request' && delivery.description && delivery.description.includes('\n\nAdditional Notes:\n') && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t.deliveryDetail('info.additionalInfo')}</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {delivery.description.split('\n\nAdditional Notes:\n')[1]}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Protection */}
            <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">{t.deliveryDetail('security.paymentProtection')}</span>
            </div>
          </div>

          {/* Right Column - Sender Card */}
          <div className="space-y-3">
            {/* Sender Card - Cocolis Style */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-orange-600" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {delivery.sender?.name || 'Anonymous'}
                </h3>

                <p className="text-xs text-gray-500 mb-3">
                  {delivery.type === 'request' ? t.deliveryDetail('sender.title') : t.deliveryDetail('sender.traveler')}
                </p>
                
                <div className="flex items-center justify-center space-x-3 mb-4 pb-4 border-b border-gray-200">
                  {delivery.sender?.averageRating !== null && delivery.sender?.averageRating !== undefined ? (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold text-gray-900">
                        {delivery.sender.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">/5</span>
                      <span className="text-xs text-gray-400">
                        ({delivery.sender.reviewCount || 0})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{t.deliveryDetail('sender.noReviews')}</span>
                    </div>
                  )}
                  
                  {delivery.sender?.isVerified && (
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">{t.deliveryDetail('sender.verified')}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline mb-4"
                >
                  {t.deliveryDetail('sender.viewProfile')}
                </button>
              </div>
            </div>

            {/* Action Button */}
            {!checkingConversation && (
              <>
                {existingConversation ? (
                  // Show "View Conversation" button if conversation exists
                  <button
                    onClick={() => router.push(`/chat/${existingConversation.id}?from=delivery&deliveryId=${delivery.id}`)}
                    className={`w-full py-3 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 ${
                      delivery.type === 'request'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{t.deliveryDetail('actions.viewConversation')}</span>
                  </button>
                ) : delivery.status === 'PENDING' ? (
                  // Show "Contact" button if no conversation exists and status is PENDING
                  <button
                    onClick={handleContactClick}
                    className={`w-full py-3 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 ${
                      delivery.type === 'request'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{delivery.type === 'request' ? t.deliveryDetail('actions.acceptRequest') : t.deliveryDetail('actions.contactTraveler')}</span>
                  </button>
                ) : (
                  // Show "Start Conversation" button for non-PENDING deliveries without existing conversation
                  <button
                    onClick={handleContactClick}
                    className="w-full py-3 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{t.deliveryDetail('actions.startConversation')}</span>
                  </button>
                )}
              </>
            )}

            {/* Loading state while checking conversation */}
            {checkingConversation && (
              <div className="w-full py-3 bg-gray-100 text-gray-400 rounded-lg font-bold flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">{t.deliveryDetail('actions.loading')}</span>
              </div>
            )}

            {/* Status Badge - Only show if delivery is not PENDING */}
            {delivery.status !== 'PENDING' && (
              <div className={`p-3 rounded-lg border text-center mt-3 ${
                delivery.status === 'COMPLETED' || delivery.status === 'DELIVERED'
                  ? 'bg-gray-50 border-gray-200 text-gray-700'
                  : delivery.status === 'IN_PROGRESS'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <StatusIcon className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs font-semibold">{statusBadge.label}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && delivery?.sender && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient background */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white relative">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/30">
                  <User className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold mb-1">
                  {delivery.sender.name || 'Anonymous User'}
                </h2>
                
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {delivery.sender.averageRating !== null && delivery.sender.averageRating !== undefined ? (
                    <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Star className="w-3.5 h-3.5 text-yellow-300 fill-current" />
                      <span className="text-sm font-semibold">
                        {delivery.sender.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-white/80">
                        ({delivery.sender.reviewCount || 0} {t.deliveryDetail('sender.reviews')})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Star className="w-3.5 h-3.5 text-white/60" />
                      <span className="text-xs text-white/80">{t.deliveryDetail('sender.noReviews')}</span>
                    </div>
                  )}
                  
                  {delivery.sender.isVerified && (
                    <div className="flex items-center space-x-1 bg-green-500/90 px-2 py-1 rounded-full">
                      <Award className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-medium text-white">{t.deliveryDetail('sender.verified')}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-white/90">
                  {delivery.type === 'request' ? t.deliveryDetail('sender.requester') : t.deliveryDetail('sender.traveler')}
                </p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6 space-y-4">
              {/* Contact Information Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {t.deliveryDetail('profile.contactInfo')}
                </h3>
                
                <div className="space-y-3">
                  {/* Email */}
                  {delivery.sender.email && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">{t.deliveryDetail('profile.emailAddress')}</p>
                        <p className="text-sm font-medium text-gray-900 break-all">
                          {maskEmail(delivery.sender.email)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Phone */}
                  {delivery.sender.phone && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">{t.deliveryDetail('profile.phoneNumber')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {delivery.sender.countryCode && `${delivery.sender.countryCode} `}
                          {maskPhone(delivery.sender.phone)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Location */}
                  {delivery.sender.country && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">{t.deliveryDetail('profile.location')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {delivery.sender.country}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {t.deliveryDetail('security.privacyNotice')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
                >
                  {t.common('actions.close')}
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowContactConfirm(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t.deliveryDetail('actions.contact')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Confirmation Modal */}
      {showContactConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                delivery.type === 'request' 
                  ? 'bg-orange-100' 
                  : 'bg-blue-100'
              }`}>
                <MessageCircle className={`w-6 h-6 ${
                  delivery.type === 'request' ? 'text-orange-600' : 'text-blue-600'
                }`} />
              </div>
              
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {delivery.type === 'request' ? t.deliveryDetail('confirmModal.acceptTitle') : t.deliveryDetail('confirmModal.startTitle')}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {delivery.type === 'request' 
                  ? t.deliveryDetail('confirmModal.acceptMessage').replace('{name}', delivery.sender?.name || t.deliveryDetail('confirmModal.theRequester'))
                  : t.deliveryDetail('confirmModal.startMessage').replace('{name}', delivery.sender?.name || t.deliveryDetail('confirmModal.theTraveler'))
                }
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowContactConfirm(false)}
                  disabled={isContacting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium disabled:opacity-50 text-sm"
                >
                  {t.common('actions.cancel')}
                </button>
                <button
                  onClick={handleConfirmContact}
                  disabled={isContacting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-all disabled:opacity-50 text-sm ${
                    delivery.type === 'request'
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isContacting ? t.deliveryDetail('actions.starting') : t.common('actions.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
