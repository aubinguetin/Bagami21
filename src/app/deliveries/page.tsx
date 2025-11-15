'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  Package,
  User,
  LogOut, 
  Bell, 
  MessageCircle,
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  Star,
  Edit2,
  Trash2,
  Plus,
  ArrowLeft,
  RefreshCw,
  Home,
  X,
  Filter,
  Award
} from 'lucide-react';
import { getCountriesList } from '@/data/locations';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
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
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';
import { 
  useDeliveries, 
  useRefreshDeliveries
} from '@/hooks/useQueries';
import { AlertModal } from '@/components/AlertModal';
import { PostTypeSelectionModal } from '@/components/PostTypeSelectionModal';
import countries from 'i18n-iso-countries';

// Initialize countries with both English and French
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));
countries.registerLocale(require('i18n-iso-countries/langs/fr.json'));

// Helper function to translate French search terms to English for better search results
function enhanceSearchQuery(query: string, locale: string): string {
  if (!query) return query;
  
  const lowerQuery = query.toLowerCase().trim();
  const searchTerms: string[] = []; // Don't include original query - we'll add translations only
  
  // French to English item type mapping (only for French users)
  if (locale === 'fr') {
    const frenchToEnglish: { [key: string]: string } = {
      'documents': 'documents',
      'électronique': 'electronics',
      'electronique': 'electronics', // without accent
      'vêtements': 'clothing',
      'vetements': 'clothing', // without accent
      'nourriture': 'food',
      'consommables': 'food',
      'cadeaux': 'gifts',
      'autre': 'other',
      // Common French delivery terms
      'livraison': 'delivery',
      'demande': 'request',
      'offre': 'offer',
      'espace': 'space'
    };
    
    // Check if the query contains any French terms and add English equivalents
    let foundTranslation = false;
    Object.entries(frenchToEnglish).forEach(([french, english]) => {
      if (lowerQuery.includes(french)) {
        searchTerms.push(english);
        foundTranslation = true;
      }
    });
    
    // If no translation found, keep original query
    if (!foundTranslation) {
      searchTerms.push(query);
    }
  } else {
    // For English users, just use the original query
    searchTerms.push(query);
  }
  
  // Handle ALL country names for both French and English users
  // This allows searching for any country name and finding related cities
  if (query.length >= 3) { // Minimum 3 characters for country search
    // Get all country codes
    const allCountryCodes = Object.keys(countries.getAlpha2Codes());
    
    // Check each country code
    for (const code of allCountryCodes) {
      // Get country name in both French and English
      const frenchName = countries.getName(code, 'fr', { select: 'official' });
      const englishName = countries.getName(code, 'en', { select: 'official' });
      
      // For French users searching with French country name
      if (locale === 'fr' && frenchName && frenchName.toLowerCase().includes(lowerQuery)) {
        // Replace with ONLY the country code (database stores codes like "ZA" not "South Africa")
        searchTerms.length = 0; // Clear array
        searchTerms.push(code);  // Just the code, e.g., "ZA"
        break;
      }
      // For English users searching with English country name
      else if (locale === 'en' && englishName && englishName.toLowerCase().includes(lowerQuery)) {
        // Replace with ONLY the country code (database stores codes like "ZA" not "South Africa")
        searchTerms.length = 0; // Clear array
        searchTerms.push(code);  // Just the code, e.g., "ZA"
        break;
      }
    }
  }
  
  // Return unique terms joined together
  const uniqueTerms = Array.from(new Set(searchTerms));
  return uniqueTerms.join(' ');
}

// SearchableSelect component for country filters with optimization
function SearchableSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label,
  customClassName 
}: {
  value: string;
  onChange: (value: string) => void;
  options: { code: string; name: string }[];
  placeholder: string;
  label?: string;
  customClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setDebouncedTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Memoized filtering for optimal performance
  const filteredOptions = useMemo(() => {
    if (!debouncedTerm.trim()) {
      return options;
    }
    
    const lowerSearchTerm = debouncedTerm.toLowerCase();
    return options.filter(option =>
      option.name.toLowerCase().includes(lowerSearchTerm) ||
      option.code.toLowerCase().includes(lowerSearchTerm)
    );
  }, [options, debouncedTerm]);
  
  const selectedOption = options.find(option => option.code === value);
  
  // Optimized callback to clear search and close dropdown
  const handleClear = useCallback(() => {
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);

  // Optimized callback to select option
  const handleSelect = useCallback((optionCode: string) => {
    onChange(optionCode);
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);
  
  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={customClassName || "w-full px-3 py-2 pr-9 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-400 bg-white hover:border-gray-400 transition-all duration-200 text-sm"}
        >
          <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </button>
        
        {/* Clear button */}
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-all duration-200"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        
        {isOpen && (
          <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <input
                type="text"
                placeholder={`Search ${label ? label.toLowerCase() : 'countries'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                autoFocus
              />
              {searchTerm !== debouncedTerm && (
                <div className="text-xs text-orange-600 mt-1 px-1 flex items-center gap-1">
                  <div className="w-2.5 h-2.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </div>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto">
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100"
              >
                {placeholder}
              </button>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.code}
                    onClick={() => handleSelect(option.code)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 transition-all duration-150 border-b border-gray-50 ${
                      value === option.code ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DeliveriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  
  // Filters and search state
  const [activeFilter, setActiveFilter] = useState<'all' | 'requests' | 'offers'>('all');
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departureCountry, setDepartureCountry] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allDeliveries, setAllDeliveries] = useState<any[]>([]);

  const locale = useLocale();
  const countries = getCountriesList(locale);
  const { deliveries: t } = useT();

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

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
      
      const params = new URLSearchParams();
      if (currentUserId) params.set('currentUserId', currentUserId);
      if (currentUserContact) params.set('currentUserContact', encodeURIComponent(currentUserContact));
      
      const url = `/api/messages/unread-count${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (response.ok) {
        setUnreadMessageCount(result.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch unread notification count
  const fetchUnreadNotificationCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { userId: currentUserId } = getCurrentUserInfo();
      if (!currentUserId) return;
      
      const response = await fetch(`/api/notifications/unread-count?userId=${currentUserId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setUnreadNotificationCount(result.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Authentication check
  useEffect(() => {
    const bagamiAuth = localStorage.getItem('bagami_authenticated');
    
    if (status === 'authenticated' || bagamiAuth === 'true') {
      setIsAuthenticated(true);
    } else if (status === 'unauthenticated' && !bagamiAuth) {
      const timeoutId = setTimeout(() => {
        router.push('/auth');
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [status, router]);

  // Enhance search query for French users (add English equivalents for better search)
  const enhancedSearchQuery = useMemo(() => {
    console.log('🎯 FRONTEND: Debounced search query:', debouncedSearchQuery, 'Locale:', locale);
    const enhanced = enhanceSearchQuery(debouncedSearchQuery, locale);
    console.log('🔍 FRONTEND: Enhanced search query:', { original: debouncedSearchQuery, enhanced, locale });
    return enhanced;
  }, [debouncedSearchQuery, locale]);

  // Use React Query for deliveries with smart caching
  const deliveryFilters = {
    filter: activeFilter,
    searchQuery: enhancedSearchQuery,
    departureCountry,
    destinationCountry,
    mineOnly: showMineOnly,
    page: currentPage,
    limit: 20
  };

  const { 
    data: deliveryResponse, 
    isLoading, 
    error,
    refetch: refetchDeliveries 
  } = useDeliveries(deliveryFilters);

  // Handle pagination data
  const pagination = deliveryResponse?.pagination;

  // Reset accumulated deliveries when filters change
  useEffect(() => {
    setCurrentPage(1);
    setAllDeliveries([]);
  }, [activeFilter, enhancedSearchQuery, departureCountry, destinationCountry, showMineOnly]);

  // Accumulate deliveries when new page loads or when data updates (for real-time updates)
  useEffect(() => {
    if (deliveryResponse?.deliveries) {
      if (currentPage === 1) {
        // For page 1, merge new deliveries with existing ones intelligently
        setAllDeliveries(prev => {
          // If this is a real-time update (user is still on page 1), merge intelligently
          const newDeliveryIds = new Set(deliveryResponse.deliveries.map((d: any) => d.id));
          const existingDeliveries = prev.filter((d: any) => !newDeliveryIds.has(d.id));
          
          // Add new deliveries at the beginning (they're newer)
          return [...deliveryResponse.deliveries, ...existingDeliveries];
        });
      } else {
        // For subsequent pages, append to the list
        setAllDeliveries(prev => {
          const existingIds = new Set(prev.map((d: any) => d.id));
          const newDeliveries = deliveryResponse.deliveries.filter((d: any) => !existingIds.has(d.id));
          return [...prev, ...newDeliveries];
        });
      }
    }
  }, [deliveryResponse, currentPage]);

  // Sort deliveries by date
  const sortedDeliveries = useMemo(() => {
    const sorted = [...allDeliveries];
    return sorted.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      
      if (dateSort === 'newest') {
        return dateB.getTime() - dateA.getTime(); // Newest first
      } else {
        return dateA.getTime() - dateB.getTime(); // Oldest first
      }
    });
  }, [allDeliveries, dateSort]);

  const deliveries = sortedDeliveries;

  // Preserve scroll position when loading more
  const scrollPositionRef = useRef<number>(0);
  const isLoadingMoreRef = useRef<boolean>(false);

  const loadMore = () => {
    if (pagination?.hasMore && !isLoading) {
      // Save current scroll position before loading more
      scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
      isLoadingMoreRef.current = true;
      setCurrentPage(prev => prev + 1);
    }
  };

  // Restore scroll position after new deliveries are loaded
  useEffect(() => {
    if (isLoadingMoreRef.current && !isLoading && currentPage > 1) {
      // Restore scroll position
      window.scrollTo(0, scrollPositionRef.current);
      isLoadingMoreRef.current = false;
    }
  }, [isLoading, currentPage]);

  // Pull-to-refresh functionality
  const deliveryContainerRef = useRef<HTMLDivElement>(null);
  const { 
    bindToElement: bindDeliveryContainer,
    isPulling: isDeliveryPulling,
    isRefreshing: isDeliveryRefreshing,
    pullDistance: deliveryPullDistance,
    canRefresh: canRefreshDeliveries
  } = usePullToRefresh({
    onRefresh: async () => {
      await refetchDeliveries();
    },
    threshold: 60
  });

  // Bind pull-to-refresh to the container
  useEffect(() => {
    bindDeliveryContainer(deliveryContainerRef.current);
  }, [bindDeliveryContainer]);

  // Enhanced polling with smart intervals and visibility detection
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated]);

  // Handler functions for delivery management
  const handleEditDelivery = (delivery: any) => {
    // Store that we're coming from deliveries browse page
    sessionStorage.setItem('delivery_edit_referrer', '/deliveries');
    
    // Navigate to appropriate edit page based on delivery type
    if (delivery.type === 'request') {
      router.push(`/deliveries/edit-request/${delivery.id}`);
    } else {
      router.push(`/deliveries/edit-offer/${delivery.id}`);
    }
  };

  const handleDeleteDelivery = async (delivery: any) => {
    if (!confirm('Are you sure you want to delete this delivery? This action cannot be undone.')) {
      return;
    }

    try {
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');
      
      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentUserId,
          currentUserContact
        }),
      });

      if (response.ok) {
        refetchDeliveries();
        alert('Delivery deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete delivery: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting delivery:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleViewDetails = (delivery: any) => {
    router.push(`/deliveries/${delivery.id}`);
  };

  const handleSignOut = async () => {
    setIsAuthenticated(false);
    localStorage.removeItem('bagami_authenticated');
    localStorage.removeItem('bagami_user_contact');
    localStorage.removeItem('bagami_user_id');
    localStorage.removeItem('bagami_user_name');
    
    setTimeout(async () => {
      if (session) {
        await signOut({ callbackUrl: '/auth' });
      } else {
        router.push('/auth');
      }
    }, 0);
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white pb-20">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 mb-6">
          {/* Modern Search Bar with Gradient */}
          <div className="mb-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-sm"></div>
              <div className="relative flex items-center bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-xl border-2 border-gray-200 focus-within:border-orange-400 focus-within:shadow-lg transition-all duration-300">
                <Search className="w-5 h-5 text-gray-500 ml-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  className="w-full px-4 py-3.5 bg-transparent focus:outline-none placeholder-gray-500 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
                
                {/* Loading indicator */}
                {searchQuery !== debouncedSearchQuery && searchQuery.length >= 2 && (
                  <div className="mr-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                  </div>
                )}
                
                {/* Clear button */}
                {searchQuery.length > 0 && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mr-3 p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-100 rounded-lg transition-all duration-200"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Route Selection with Swap Button - Cocolis Style */}
          <div className="mb-5">
            <div className="flex items-stretch bg-white border-2 border-gray-300 rounded-xl shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200">
              {/* From and To Container */}
              <div className="flex-1">
                {/* From Location */}
                <div className="relative border-b border-gray-200">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <MapPin className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="pl-10 pr-3">
                    <SearchableSelect
                      value={departureCountry}
                      onChange={setDepartureCountry}
                      options={countries}
                      placeholder={t('search.fromCountry')}
                      label=""
                      customClassName="w-full py-3.5 text-left border-0 bg-transparent hover:bg-gray-50 focus:bg-gray-50 transition-colors text-sm pr-8"
                    />
                  </div>
                </div>

                {/* To Location */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <MapPin className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="pl-10 pr-3">
                    <SearchableSelect
                      value={destinationCountry}
                      onChange={setDestinationCountry}
                      options={countries}
                      placeholder={t('search.destinationCountry')}
                      label=""
                      customClassName="w-full py-3.5 text-left border-0 bg-transparent hover:bg-gray-50 focus:bg-gray-50 transition-colors text-sm pr-8"
                    />
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex items-center px-3 border-l border-gray-200 bg-gray-50 rounded-r-xl">
                <button
                  onClick={() => {
                    const temp = departureCountry;
                    setDepartureCountry(destinationCountry);
                    setDestinationCountry(temp);
                  }}
                  className="p-2.5 text-gray-600 hover:text-orange-500 hover:bg-white rounded-lg transition-all duration-200 active:scale-95"
                  title={t('search.swapLocations')}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Filter Toggle and Alert Button Row */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-sm ${
                showFilters 
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="font-medium">
                {showFilters ? t('filters.hide') : t('filters.show')}
              </span>
            </button>
            
            <button
              onClick={() => setShowAlertModal(true)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
            >
              <Bell className="w-4 h-4" />
              {t('buttons.createAlert')}
            </button>
          </div>
          
          {/* Filters Section */}
          {showFilters && (
          <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
            {/* Primary Filters - Type Selection */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">{t('filters.postType')}</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    activeFilter === 'all' 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  {t('filters.allPosts')}
                </button>
                <button
                  onClick={() => setActiveFilter('requests')}
                  className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    activeFilter === 'requests' 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  {t('filters.requests')}
                </button>
                <button
                  onClick={() => setActiveFilter('offers')}
                  className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    activeFilter === 'offers' 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                  }`}
                >
                  <Plane className="w-3.5 h-3.5" />
                  {t('filters.offers')}
                </button>
              </div>
            </div>

            {/* Secondary Filters - View Options */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">{t('filters.viewOptions')}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowMineOnly(!showMineOnly)}
                  className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    showMineOnly 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-600 border border-gray-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  {t('filters.myPostsOnly')}
                </button>

                <div className="w-px h-6 bg-gray-300"></div>

                <button
                  onClick={() => setDateSort(dateSort === 'newest' ? 'oldest' : 'newest')}
                  className="px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {dateSort === 'newest' ? t('filters.newestFirst') : t('filters.oldestFirst')}
                </button>
              </div>
            </div>

            {/* Clear All Filters */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDepartureCountry('');
                  setDestinationCountry('');
                  setActiveFilter('all');
                  setShowMineOnly(false);
                  setDateSort('newest');
                }}
                className="px-3 py-1.5 text-sm rounded-lg font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('filters.clearAll')}
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Delivery Cards */}
        <div 
          ref={deliveryContainerRef}
          className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto"
        >
          {/* Pull-to-refresh indicator */}
          <PullToRefreshIndicator
            isPulling={isDeliveryPulling}
            isRefreshing={isDeliveryRefreshing}
            pullDistance={deliveryPullDistance}
            canRefresh={canRefreshDeliveries}
          />

          {isLoading ? (
            // Loading state
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-3.5 bg-gray-200 rounded w-24 mb-1.5"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="space-y-1.5 mb-2.5">
                  <div className="h-3.5 bg-gray-200 rounded"></div>
                  <div className="h-3.5 bg-gray-200 rounded"></div>
                  <div className="h-3.5 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                    <div className="h-3.5 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-3.5 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))
          ) : deliveries.length > 0 ? (
            // Delivery cards
            deliveries.map((delivery) => (
              <div 
                key={delivery.id} 
                className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 relative cursor-pointer overflow-hidden group hover:shadow-lg hover:scale-[1.02] ${
                  delivery.type === 'request' 
                    ? 'border-orange-100 hover:border-orange-200' 
                    : 'border-blue-100 hover:border-blue-200'
                }`}
                onClick={() => {
                  if ((delivery as any).isOwnedByCurrentUser) {
                    handleEditDelivery(delivery);
                  } else {
                    handleViewDetails(delivery);
                  }
                }}
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full ${
                  delivery.type === 'request' ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                }`} />
                
                {/* Expired indicator for user's own posts */}
                {delivery.isExpired && delivery.isOwnedByCurrentUser && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-md z-10">
                    {t('card.expired')}
                  </div>
                )}
                
                <div className="p-3">
                  {/* Header with icon, title and type badge */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 ${
                        delivery.type === 'request' ? 'bg-gradient-to-br from-orange-100 to-orange-200' : 'bg-gradient-to-br from-blue-100 to-blue-200'
                      }`}>
                        {delivery.type === 'request' ? 
                          <Package className="w-4 h-4 text-orange-600" /> :
                          <Plane className="w-4 h-4 text-blue-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm leading-tight mb-0.5 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const
                        }}>{translateDeliveryTitle(delivery.title, locale)}</p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">{delivery.weight ? `${delivery.weight} kg` : t('card.weightTBD')}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Route and details section */}
                  <div className="space-y-1.5 mb-2">
                    {/* Route with enhanced styling and flags */}
                    <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
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
                    
                    {/* Date and price in a compact row */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1.5">
                        <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 font-medium">
                          {delivery.arrivalDate ? 
                            `${t('card.by')} ${new Date(delivery.arrivalDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}` :
                            delivery.departureDate ? `${new Date(delivery.departureDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}` : t('card.tbd')
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1.5">
                        <DollarSign className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-gray-800">{formatAmount(delivery.price || 0)} FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer with user info and actions */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-2.5 h-2.5 text-gray-500" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {(delivery as any).isOwnedByCurrentUser ? t('card.createdByYou') : (delivery.sender?.name || t('card.anonymous'))}
                      </span>
                      {delivery.sender?.isVerified && (
                        <div className="flex items-center bg-green-50 px-1 py-0.5 rounded-full">
                          <Award className="w-2.5 h-2.5 text-green-600" />
                          <span className="text-[10px] font-medium text-green-700 ml-0.5">{t('card.verified')}</span>
                        </div>
                      )}
                      {delivery.sender?.averageRating !== null && delivery.sender?.averageRating !== undefined ? (
                        <div className="flex items-center bg-yellow-50 px-1 py-0.5 rounded-full">
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                          <span className="text-xs font-medium text-yellow-700 ml-0.5">
                            {delivery.sender.averageRating.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-yellow-600 ml-0.5">
                            ({delivery.sender.reviewCount || 0})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center bg-gray-50 px-1 py-0.5 rounded-full">
                          <span className="text-[10px] text-gray-500">{t('card.noReviews')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Empty state
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
              <Search className="w-16 h-16 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
              <p className="text-center">{t('empty.message')}</p>
            </div>
          )}
        </div>

        {/* Load More button */}
        {pagination?.hasMore && deliveries.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="font-medium">{t('buttons.loading')}</span>
                </>
              ) : (
                <span className="font-medium">{t('buttons.loadMore')}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Alert Modal */}
      {showAlertModal && (
        <AlertModal 
          isOpen={showAlertModal} 
          onClose={() => setShowAlertModal(false)}
          currentFilters={{
            searchQuery,
            departureCountry,
            destinationCountry,
            activeFilter
          }}
        />
      )}

      {/* Post Type Selection Modal */}
      {showPostTypeModal && (
        <PostTypeSelectionModal
          isOpen={showPostTypeModal}
          onClose={() => setShowPostTypeModal(false)}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 z-50 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-5 h-16 max-w-screen-xl mx-auto">
          {/* Search - Active */}
          <button className="relative flex flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-95">
            {/* Active indicator bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-b-full" />
            
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl blur-md opacity-40" />
              
              {/* Icon container */}
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-2xl shadow-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <span className="text-[10px] font-semibold text-orange-600 tracking-wide">{t('bottomNav.search')}</span>
          </button>

          {/* Messages */}
          <button
            onClick={() => router.push('/messages')}
            className="group relative flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-wide">{t('bottomNav.messages')}</span>
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
    </div>
  );
}