import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Shield
} from 'lucide-react';
import { formatAmount } from '@/utils/currencyFormatter';
import { useLocale, useT, translateDeliveryTitle } from '@/lib/i18n-helpers';

// Helper function to get country flag emoji from country code or name
function getCountryFlag(countryCodeOrName: string): string {
  // Map of common country codes/names to flag emojis
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
    // Common country names
    'Burkina Faso': '🇧🇫', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'South Africa': '🇿🇦'
  };
  
  return flagMap[countryCodeOrName] || '🏳️';
}

interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: any;
  setActiveConversationId: (id: string | null) => void;
  session: any;
  status: string;
}

export function DeliveryDetailsModal({ 
  isOpen, 
  onClose, 
  delivery,
  setActiveConversationId,
  session,
  status
}: DeliveryDetailsModalProps) {
  const router = useRouter();
  const [showContactConfirm, setShowContactConfirm] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  const locale = useLocale();
  const { deliveries: t } = useT();

  // Get current user info from session or localStorage
  const getCurrentUserInfo = () => {
    // Try to get from NextAuth session first
    if (session?.user?.id) {
      const userContact = session.user.email || (session.user as any).phone;
      return {
        userId: session.user.id,
        userContact: userContact
      };
    }
    
    // Fallback to localStorage
    const currentUserId = localStorage.getItem('bagami_user_id');
    const currentUserContact = localStorage.getItem('bagami_user_contact');
    
    return {
      userId: currentUserId,
      userContact: currentUserContact
    };
  };

  if (!isOpen || !delivery) return null;

  const handleContactClick = () => {
    setShowContactConfirm(true);
  };

  const handleConfirmContact = async () => {
    setIsContacting(true);
    try {
      console.log('Creating conversation for delivery:', delivery);
      console.log('Delivery ID:', delivery.id);
      console.log('Sender ID:', delivery.senderId || delivery.sender?.id);
      console.log('Session status:', status);
      console.log('Session data:', session);
      console.log('Local storage auth:', localStorage.getItem('bagami_authenticated'));
      
      // Get current user information for authentication fallback
      const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
      
      // Create conversation with the delivery owner
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
      console.log('Conversation API response:', result);

      if (response.ok && result.conversation) {
        // Close modals and navigate to chat page
        setShowContactConfirm(false);
        onClose();
        
        console.log('🎯 Creating conversation and navigating to chat:', result.conversation.id);
        console.log('🎯 Full conversation object:', result.conversation);
        
        // Navigate directly to the new chat page
        router.push(`/chat/${result.conversation.id}`);
      } else {
        console.error('❌ Conversation creation failed:', result);
        alert(`Error: ${result.error || 'Failed to create conversation'}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsContacting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[98vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className={`relative p-3 ${
          delivery.type === 'request' 
            ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {delivery.type === 'request' ? 
                  <Package className="w-5 h-5 text-white" /> :
                  <Plane className="w-5 h-5 text-white" />
                }
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {delivery.type === 'request' ? t('card.deliveryRequest') : t('card.spaceOffer')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm">
                  {delivery.type === 'request' ? t('card.request') : t('card.offer')}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - All scrollable including buttons */}
        <div className="overflow-y-auto max-h-[calc(98vh-90px)] p-3 space-y-3">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Item/Service Details */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 mb-2">
                <Package className="w-4 h-4 text-gray-600" />
                <h3 className="font-semibold text-gray-800 text-sm">
                  {delivery.type === 'request' ? t('detailsModal.itemDetails') : t('detailsModal.serviceDetails')}
                </h3>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-xs">Title:</span>
                  <span className="font-medium text-slate-800 text-right flex-1 ml-2 text-xs">{translateDeliveryTitle(delivery.title || 'Not specified', locale)}</span>
                </div>
                {delivery.weight && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-xs">Weight:</span>
                    <span className="font-medium text-slate-800 text-xs">{delivery.weight} kg</span>
                  </div>
                )}
                {delivery.description && (
                  <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                    <span className="text-gray-600 text-xs">Description:</span>
                    <p className="text-slate-700 text-xs mt-1 leading-relaxed">{delivery.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 mb-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-800 text-sm">{t('detailsModal.route')}</h3>
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-800">
                <div className="flex items-center space-x-1">
                  <span className="text-base">{getCountryFlag(delivery.fromCountry)}</span>
                  <span>{delivery.fromCity}</span>
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center space-x-1">
                  <span className="text-base">{getCountryFlag(delivery.toCountry)}</span>
                  <span>{delivery.toCity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 mb-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-gray-800 text-sm">{t('detailsModal.timeline')}</h3>
              </div>
              <div className="space-y-1.5 text-xs">
                {delivery.departureDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('detailsModal.departure')}:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(delivery.departureDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
                )}
                {delivery.arrivalDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('detailsModal.arrival')}:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(delivery.arrivalDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
                )}
                {!delivery.departureDate && !delivery.arrivalDate && (
                  <div className="text-center text-gray-500 text-xs">
                    No dates specified
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-gray-800 text-sm">Pricing</h3>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-green-700 text-base">
                    {formatAmount(delivery.price || 0)} FCFA
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs text-green-700">Payment protected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3">
            <div className="flex items-center space-x-1.5 mb-2">
              <User className="w-4 h-4 text-orange-600" />
              <h3 className="font-semibold text-gray-800 text-sm">
                {delivery.type === 'request' ? t('detailsModal.sender') : t('detailsModal.traveler')}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 text-sm">{delivery.sender?.name || 'Anonymous'}</p>
                <div className="flex items-center space-x-2 mt-0.5 text-xs">
                  <div className="flex items-center space-x-0.5">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-gray-600">4.5 (127)</span>
                  </div>
                  <div className="flex items-center space-x-0.5">
                    <Award className="w-3 h-3 text-green-600" />
                    <span className="text-gray-600">Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Now scrollable with content */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all font-medium text-sm"
              >
                Close
              </button>
              {delivery.status === 'PENDING' && (
                <button
                  onClick={handleContactClick}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md text-sm ${
                    delivery.type === 'request'
                      ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                      : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
                  }`}
                >
                  {delivery.type === 'request' ? 'Accept Request' : 'Contact Traveler'}
                </button>
              )}
            </div>
          </div>

          {/* Transparent spacer to ensure buttons are fully visible when scrolling */}
          <div className="h-4 w-full opacity-0 pointer-events-none"></div>
        </div>
      </div>

      {/* Contact Confirmation Modal */}
      {showContactConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
                delivery.type === 'request' 
                  ? 'bg-gradient-to-br from-orange-100 to-orange-200' 
                  : 'bg-gradient-to-br from-blue-100 to-blue-200'
              }`}>
                <MessageCircle className={`w-6 h-6 ${
                  delivery.type === 'request' ? 'text-orange-600' : 'text-blue-600'
                }`} />
              </div>
              
              <h3 className="text-base font-bold text-slate-800 mb-1.5">
                {delivery.type === 'request' ? '✓ Accept Request' : '💬 Start Conversation'}
              </h3>
              
              <p className="text-gray-600 text-xs mb-4 leading-relaxed">
                {delivery.type === 'request' 
                  ? `Accept this delivery request and start chatting with ${delivery.sender?.name || 'the requester'}?`
                  : `Start a conversation with ${delivery.sender?.name || 'the traveler'} about this space offer?`
                }
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowContactConfirm(false)}
                  disabled={isContacting}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmContact}
                  disabled={isContacting}
                  className={`flex-1 px-3 py-2 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-sm hover:shadow-md text-sm ${
                    delivery.type === 'request'
                      ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                      : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
                  }`}
                >
                  {isContacting ? '⏳ Starting...' : '✓ Yes, Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}