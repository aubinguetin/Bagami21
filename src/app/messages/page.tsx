'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  MessageCircle,
  User,
  Check,
  CheckCheck,
  Users,
  Package,
  Plane,
  Home,
  Search,
  Filter,
  X,
  DollarSign,
  Bell,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { 
  useConversations, 
  useMessages,
  useSendMessage,
  useRefreshConversations 
} from '@/hooks/useQueries';
import { useSSEMessages } from '@/hooks/useSSEMessages';
import { useRealtimeMessageSender } from '@/hooks/useRealtimeSocket';
import { PostTypeSelectionModal } from '@/components/PostTypeSelectionModal';
import { useT } from '@/lib/i18n-helpers';

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

// Helper function to format card messages for display
function formatCardMessage(content: string, messageType: string, t: any): string {
  // If it's a system message, return as is
  if (messageType === 'system') {
    return t('cardMessages.systemMessage');
  }

  // Try to parse as JSON to detect card messages
  try {
    const parsed = JSON.parse(content);
    
    // Check if it's a card type message
    if (parsed.type) {
      switch (parsed.type) {
        case 'offer':
          return t('cardMessages.sentOffer');
        case 'offerAccepted':
          return t('cardMessages.offerAccepted');
        case 'offerRejected':
          return t('cardMessages.offerRejected');
        case 'payment':
        case 'paymentConfirmation':
          return t('cardMessages.paymentConfirmation');
        case 'deliveryConfirmation':
          return t('cardMessages.deliveryConfirmed');
        default:
          return t('cardMessages.sentCard');
      }
    }
  } catch (e) {
    // Not a JSON message, return content as is
  }

  // Return regular message content, truncated if too long
  return content.length > 50 ? content.substring(0, 50) + '...' : content;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { messages: t } = useT();
  
  // Check if user came from profile page
  const fromProfile = searchParams.get('from') === 'profile';
  
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showChatView, setShowChatView] = useState(false); // Mobile chat view state
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    type: 'all', // 'all', 'request', 'offer'
    status: 'all', // 'all', 'delivered', 'pending'
    priceRange: 'all' // 'all', 'low', 'medium', 'high'
  });
  
  // Navigation state
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);
  
  // Track other participant's online status
  const [participantStatus, setParticipantStatus] = useState<{ [userId: string]: boolean }>({});

  // Function to fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      const { userId, userContact } = getCurrentUserInfo();
      
      if (!userId && !userContact) {
        console.log('No user info available for unread count');
        return;
      }

      const params = new URLSearchParams();
      if (userId) params.append('currentUserId', userId);
      if (userContact) params.append('currentUserContact', encodeURIComponent(userContact));
      
      const response = await fetch(`/api/messages/unread-count?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setUnreadMessageCount(data.unreadCount || 0);
      } else {
        console.error('Failed to fetch unread count:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Function to fetch unread notification count
  const fetchUnreadNotificationCount = async () => {
    try {
      const { userId } = getCurrentUserInfo();
      if (!userId) return;
      
      const response = await fetch(`/api/notifications/unread-count?userId=${userId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setUnreadNotificationCount(result.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Enhanced polling with smart intervals and visibility detection
  useEffect(() => {
    const { userId, userContact } = getCurrentUserInfo();
    if (!userId && !userContact) return;

    fetchUnreadCount();
    fetchUnreadNotificationCount();
    
    // Smart polling: faster when active, slower when background
    const getPollingInterval = () => {
      return document.hidden ? 30000 : 5000; // 30s background, 5s active
    };

    let interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadNotificationCount();
    }, getPollingInterval());

    // Handle visibility change for immediate updates
    const handleVisibilityChange = () => {
      clearInterval(interval);
      
      if (!document.hidden) {
        // Immediate refresh when returning to tab
        fetchUnreadCount();
        fetchUnreadNotificationCount();
      }
      
      // Restart with appropriate interval
      interval = setInterval(() => {
        fetchUnreadCount();
        fetchUnreadNotificationCount();
      }, getPollingInterval());
    };

    // Listen for focus events for even faster response
    const handleFocus = () => {
      fetchUnreadCount();
      fetchUnreadNotificationCount();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Refetch unread count when user info changes
  useEffect(() => {
    fetchUnreadCount();
  }, [session, status]);

  // Use React Query hooks for data fetching
  const { 
    data: conversations = [], 
    isLoading,
    refetch: refetchConversations 
  } = useConversations();

  // Messages for selected conversation
  const { 
    data: messagesResponse, 
    isLoading: isLoadingMessages 
  } = useMessages(selectedConversation?.id);
  
  const messages = messagesResponse?.messages || [];

  // Message sending hooks
  const { mutate: sendMessageMutation, isPending: isSending } = useSendMessage();

  // Real-time messaging hooks
  const { sendMessage: realtimeSendMessage } = useRealtimeMessageSender();

  // Get current user info
  const getCurrentUserInfo = () => {
    if (session?.user?.id) {
      const userContact = session.user.email || (session.user as any).phone;
      return {
        userId: session.user.id,
        userContact: userContact
      };
    }
    
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('bagami_user_id') : null;
    const currentUserContact = typeof window !== 'undefined' ? localStorage.getItem('bagami_user_contact') : null;
    
    return {
      userId: currentUserId,
      userContact: currentUserContact
    };
  };

  // SSE configuration for selected conversation
  const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
  const sseConversationId = selectedConversation?.id || null;
  const sseUserId = currentUserId;
  const sseUserContact = currentUserContact;
  const sseEnabled = !!(sseConversationId && sseUserId && sseUserContact);

  // SSE for instant message delivery to receivers
  const { 
    isConnected: sseConnected, 
    error: sseError 
  } = useSSEMessages(
    sseConversationId,
    sseUserId || undefined,
    sseUserContact
  );

  // Handle typing updates in useEffect
  useEffect(() => {
    // This would need to be implemented based on the SSE message handling in the hook
  }, []);

  // Handle user status updates in useEffect  
  useEffect(() => {
    // This would need to be implemented based on the SSE message handling in the hook
  }, []);

  // Navigate to dedicated chat page
  const selectConversation = (conversationId: string) => {
    // Navigate to the dedicated chat page
    router.push(`/chat/${conversationId}`);
  };

  // Handle back to conversations list
  const handleBackToConversations = () => {
    setShowChatView(false);
    setSelectedConversation(null);
  };

  // Utility function to mask contact information (phone/email)
  const maskContactInfo = (contact: string) => {
    if (!contact) return '';
    
    // Check if it's an email
    if (contact.includes('@')) {
      const [username, domain] = contact.split('@');
      if (username.length <= 2) return contact; // Don't mask very short usernames
      
      const visibleStart = username.slice(0, 2);
      const visibleEnd = username.slice(-1);
      const maskedMiddle = '*'.repeat(Math.max(1, username.length - 3));
      
      return `${visibleStart}${maskedMiddle}${visibleEnd}@${domain}`;
    }
    
    // Check if it's a phone number (contains digits and + or -)
    if (/[\d+\-\s()]/g.test(contact)) {
      // Remove all non-digit characters to work with clean number
      const digitsOnly = contact.replace(/\D/g, '');
      if (digitsOnly.length < 6) return contact; // Don't mask very short numbers
      
      // Keep country code and last 3 digits visible
      const countryCode = contact.match(/^\+\d{1,3}/)?.[0] || '';
      const lastDigits = digitsOnly.slice(-3);
      const maskedMiddle = '*'.repeat(Math.max(3, digitsOnly.length - 6));
      
      if (countryCode) {
        return `${countryCode}${maskedMiddle}${lastDigits}`;
      } else {
        const firstDigits = digitsOnly.slice(0, 3);
        return `${firstDigits}${maskedMiddle}${lastDigits}`;
      }
    }
    
    // For other types of contact info
    if (contact.length <= 3) return contact;
    const visibleStart = contact.slice(0, 2);
    const visibleEnd = contact.slice(-1);
    const maskedMiddle = '*'.repeat(Math.max(1, contact.length - 3));
    return `${visibleStart}${maskedMiddle}${visibleEnd}`;
  };

  // Get delivery type icon with circular background
  const getDeliveryIcon = (deliveryType: string) => {
    switch (deliveryType?.toLowerCase()) {
      case 'request':
        // Delivery offers (delivery requests) use package icon with orange background
        return (
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <Package className="w-4 h-4 text-orange-600" />
          </div>
        );
      case 'offer':
        // Travel offers use plane icon with blue background
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Plane className="w-4 h-4 text-blue-600" />
          </div>
        );
      default:
        // Default to package icon with gray background for unknown types
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Package className="w-4 h-4 text-gray-500" />
          </div>
        );
    }
  };

  // Format time for messages
  const formatTime24Hour = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Check if conversation has delivery confirmation
  const hasDeliveryConfirmation = (conversation: any) => {
    // This checks if there's a deliveryConfirmation message in the conversation
    // We'll need to check the messages or add a flag to the conversation object
    return conversation.hasDeliveryConfirmation || false;
  };

  // Filter and search conversations
  const getFilteredConversations = () => {
    let filtered = [...conversations];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => {
        const userName = conv.otherParticipant?.name?.toLowerCase() || '';
        const fromCity = conv.delivery?.fromCity?.toLowerCase() || '';
        const toCity = conv.delivery?.toCity?.toLowerCase() || '';
        const deliveryTitle = conv.delivery?.title?.toLowerCase() || '';
        
        return userName.includes(query) || 
               fromCity.includes(query) || 
               toCity.includes(query) ||
               deliveryTitle.includes(query);
      });
    }

    // Apply type filter (requests vs offers)
    if (activeFilters.type !== 'all') {
      filtered = filtered.filter(conv => 
        conv.delivery?.type?.toLowerCase() === activeFilters.type
      );
    }

    // Apply status filter (delivered vs pending)
    if (activeFilters.status !== 'all') {
      if (activeFilters.status === 'delivered') {
        filtered = filtered.filter(conv => {
          const isDelivered = (conv as any).hasDeliveryConfirmation === true;
          if (isDelivered) {
            console.log('✅ Delivered conversation:', conv.id, 'hasDeliveryConfirmation:', (conv as any).hasDeliveryConfirmation);
          }
          return isDelivered;
        });
      } else if (activeFilters.status === 'pending') {
        filtered = filtered.filter(conv => {
          const isPending = (conv as any).hasDeliveryConfirmation !== true;
          if (!isPending) {
            console.log('⏳ Filtering out delivered:', conv.id, 'hasDeliveryConfirmation:', (conv as any).hasDeliveryConfirmation);
          }
          return isPending;
        });
      }
    }

    // Apply price range filter
    if (activeFilters.priceRange !== 'all') {
      filtered = filtered.filter(conv => {
        const price = conv.delivery?.price || 0;
        if (activeFilters.priceRange === 'low') return price < 50000;
        if (activeFilters.priceRange === 'medium') return price >= 50000 && price < 150000;
        if (activeFilters.priceRange === 'high') return price >= 150000;
        return true;
      });
    }

    return filtered;
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({
      type: 'all',
      status: 'all',
      priceRange: 'all'
    });
    setSearchQuery('');
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.type !== 'all') count++;
    if (activeFilters.status !== 'all') count++;
    if (activeFilters.priceRange !== 'all') count++;
    return count;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-transparent z-50">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {fromProfile ? (
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-300 text-gray-700 transition-all hover:scale-105 hover:border-gray-400"
                aria-label="Back to profile"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-300 text-gray-700 transition-all hover:scale-105 hover:border-gray-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 mx-4 flex justify-center">
              <div className="bg-white px-6 py-2 rounded-full border border-gray-300">
                <h1 className="text-base font-bold text-slate-800">{t('title')}</h1>
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </div>
      <div className="pt-16"></div>

      {/* Messages Content */}
      <div className="px-4 sm:px-6 py-4">
        {/* Search and Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 p-4">
          <div className="flex gap-3 items-center">
            {/* Search Bar */}
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-colors flex-shrink-0 ${
                getActiveFilterCount() > 0 || showFilters
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title="Filters"
            >
              <Filter className="w-5 h-5" />
              {getActiveFilterCount() > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Type</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilters({...activeFilters, type: 'all'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilters.type === 'all'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilters({...activeFilters, type: 'request'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeFilters.type === 'request'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    Requests
                  </button>
                  <button
                    onClick={() => setActiveFilters({...activeFilters, type: 'offer'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeFilters.type === 'offer'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Plane className="w-4 h-4" />
                    Offers
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Status</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilters({...activeFilters, status: 'all'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilters.status === 'all'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilters({...activeFilters, status: 'delivered'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeFilters.status === 'delivered'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CheckCheck className="w-4 h-4" />
                    Delivered
                  </button>
                  <button
                    onClick={() => setActiveFilters({...activeFilters, status: 'pending'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilters.status === 'pending'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilters({...activeFilters, priceRange: 'all'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeFilters.priceRange === 'all'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilters({...activeFilters, priceRange: 'low'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeFilters.priceRange === 'low'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    &lt; 50K
                  </button>
                  <button
                    onClick={() => setActiveFilters({...activeFilters, priceRange: 'medium'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeFilters.priceRange === 'medium'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    50K - 150K
                  </button>
                  <button
                    onClick={() => setActiveFilters({...activeFilters, priceRange: 'high'})}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeFilters.priceRange === 'high'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    &gt; 150K
                  </button>
                </div>
              </div>

              {/* Clear Filters */}
              {getActiveFilterCount() > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Summary */}
          {(searchQuery || getActiveFilterCount() > 0) && !isLoading && (
            <div className="mt-3 px-1 text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{getFilteredConversations().length}</span> of <span className="font-semibold text-gray-900">{conversations.length}</span> conversations
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-12rem)] lg:h-[600px] flex">
          
          {/* Mobile: Show conversations list OR chat view */}
          <div className={`${showChatView ? 'hidden' : 'flex'} lg:hidden w-full flex-col`}>
            <div className="flex-1 overflow-y-auto relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : getFilteredConversations().length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-400">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {conversations.length === 0 ? 'No conversations yet' : 'No results found'}
                    </h3>
                    <p>
                      {conversations.length === 0 
                        ? 'Start a conversation by contacting someone about a delivery.'
                        : 'Try adjusting your search or filters.'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {getFilteredConversations().map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation.id)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                        
                        {/* Left side - Main content */}
                        <div className="flex-1 min-w-0">
                          {/* User name */}
                          <h4 className="font-bold text-gray-900 truncate mb-1">
                            {conversation.otherParticipant.name || 'Unknown User'}
                          </h4>
                          
                          {/* Origin to destination */}
                          <p className="text-sm text-gray-600 truncate mb-1 flex items-center gap-1">
                            <span className="text-base">{getCountryFlag(conversation.delivery.fromCountry)}</span>
                            {conversation.delivery.fromCity} 
                            <span className="mx-1">→</span>
                            <span className="text-base">{getCountryFlag(conversation.delivery.toCountry)}</span>
                            {conversation.delivery.toCity}
                          </p>
                          
                          {/* Last message */}
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-500 truncate">
                              {formatCardMessage(
                                conversation.lastMessage.content,
                                conversation.lastMessage.messageType,
                                t
                              )}
                            </p>
                          )}
                          
                          {/* Delivery Status */}
                          {(conversation as any).hasDeliveryConfirmation && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCheck className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-semibold text-green-600">{t('status.delivered')}</span>
                            </div>
                          )}
                          
                          {/* Deleted Delivery Status */}
                          {conversation.delivery.deletedAt && (
                            <div className="flex items-center gap-1 mt-1">
                              <X className="w-3 h-3 text-red-600" />
                              <span className="text-xs font-semibold text-red-600">{t('status.deliveryDeleted')}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Right side */}
                        <div className="flex flex-col items-end justify-between h-20 shrink-0">
                          {/* Delivery type icon and unread badge */}
                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0">
                              {getDeliveryIcon(conversation.delivery.type)}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </div>
                            )}
                          </div>
                          
                          {/* Time */}
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-400">
                              {formatTime24Hour(new Date(conversation.lastMessage.createdAt))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Conversations List */}
          <div className="hidden lg:flex w-1/3 border-r border-gray-200 flex-col">
            {/* Conversations Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h2 className="font-semibold text-gray-900">Conversations</h2>
                </div>
                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {getFilteredConversations().length}
                </span>
              </div>
            </div>
            
            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : getFilteredConversations().length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">
                      {conversations.length === 0 ? 'No conversations yet' : 'No results found'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {getFilteredConversations().map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation.id)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                        
                        {/* Left side - Main content */}
                        <div className="flex-1 min-w-0">
                          {/* User name */}
                          <h4 className="font-bold text-gray-900 truncate mb-1">
                            {conversation.otherParticipant.name || 'Unknown User'}
                          </h4>
                          
                          {/* Origin to destination */}
                          <p className="text-sm text-gray-600 truncate mb-1 flex items-center gap-1">
                            <span className="text-base">{getCountryFlag(conversation.delivery.fromCountry)}</span>
                            {conversation.delivery.fromCity} 
                            <span className="mx-1">→</span>
                            <span className="text-base">{getCountryFlag(conversation.delivery.toCountry)}</span>
                            {conversation.delivery.toCity}
                          </p>
                          
                          {/* Last message */}
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-500 truncate">
                              {formatCardMessage(
                                conversation.lastMessage.content,
                                conversation.lastMessage.messageType,
                                t
                              )}
                            </p>
                          )}
                          
                          {/* Delivery Status */}
                          {(conversation as any).hasDeliveryConfirmation && (
                            <div className="flex items-center gap-1 mt-1">
                              <CheckCheck className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-semibold text-green-600">{t('status.delivered')}</span>
                            </div>
                          )}
                          
                          {/* Deleted Delivery Status */}
                          {conversation.delivery.deletedAt && (
                            <div className="flex items-center gap-1 mt-1">
                              <X className="w-3 h-3 text-red-600" />
                              <span className="text-xs font-semibold text-red-600">{t('status.deliveryDeleted')}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Right side */}
                        <div className="flex flex-col items-end justify-between h-20 shrink-0">
                          {/* Delivery type icon and unread badge */}
                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0">
                              {getDeliveryIcon(conversation.delivery.type)}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </div>
                            )}
                          </div>
                          
                          {/* Time */}
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-400">
                              {formatTime24Hour(new Date(conversation.lastMessage.createdAt))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Chat Area Placeholder */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p>Choose a conversation from the list to start messaging.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Navigation - Native App Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 z-50 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-5 h-16 max-w-screen-xl mx-auto">
          {/* Search */}
          <button
            onClick={() => router.push('/deliveries')}
            className="group flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <Search className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-semibold tracking-wide">{t('bottomNav.search')}</span>
          </button>

          {/* Messages - Active State */}
          <button
            onClick={() => {/* Already on messages page */}}
            className="flex flex-col items-center justify-center gap-1 relative active:scale-95 transition-all duration-200 group"
          >
            {/* Active Indicator Bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" />
            
            <div className="relative mt-1">
              {/* Glow effect for active state */}
              <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-150" />
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-2xl shadow-lg shadow-orange-500/30">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg border-2 border-white">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-wide bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">{t('title')}</span>
          </button>

          {/* Post Button - Center */}
          <button
            onClick={() => setShowPostTypeModal(true)}
            className="relative flex flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-95"
          >
            {/* Icon container with white background and orange border */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md blur-md opacity-40" />
              
              {/* Icon container */}
              <div className="relative bg-white border-2 border-orange-500 p-1 rounded-md shadow-lg">
                <Plus className="w-3 h-3 text-orange-500" />
              </div>
            </div>
            
            <span className="text-[10px] font-semibold text-orange-600 tracking-wide">{t('bottomNav.post')}</span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => router.push('/notifications')}
            className="group relative flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <div className="relative">
              <Bell className="w-6 h-6 transition-transform group-hover:scale-110" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-wide">{t('bottomNav.notifications')}</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => router.push('/profile')}
            className="group flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <User className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-semibold tracking-wide">{t('bottomNav.profile')}</span>
          </button>
        </div>
      </nav>

      {/* Post Type Selection Modal */}
      <PostTypeSelectionModal 
        isOpen={showPostTypeModal}
        onClose={() => setShowPostTypeModal(false)}
      />
    </div>
  );
}