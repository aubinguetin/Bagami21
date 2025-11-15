'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { 
  Package,
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Star,
  ArrowLeft,
  Search,
  Filter,
  X
} from 'lucide-react';
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

export default function MyDeliveriesPage() {
  const { myDeliveries } = useT();
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Initialize deliveries from cache for instant display
  const getInitialDeliveries = () => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('bagami_my_deliveries_cache');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (error) {
          console.error('Error parsing cached deliveries:', error);
        }
      }
    }
    return [];
  };

  const [deliveries, setDeliveries] = useState<any[]>(getInitialDeliveries());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'requests' | 'offers'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');

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

  // Authentication check
  useEffect(() => {
    const bagamiAuth = localStorage.getItem('bagami_authenticated');
    
    if (status === 'authenticated' || bagamiAuth === 'true') {
      setIsAuthenticated(true);
    } else if (status === 'unauthenticated' && !bagamiAuth) {
      router.push('/auth');
    }
  }, [status, router]);

  // Fetch user's deliveries (including expired ones)
  const fetchMyDeliveries = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    
    try {
      const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
      
      const params = new URLSearchParams({
        filter: 'all',
        search: '',
        departureCountry: '',
        destinationCountry: '',
        mineOnly: 'true',
        includeExpired: 'true', // Include expired deliveries
        page: '1',
        limit: '100'
      });

      if (currentUserId) params.set('currentUserId', currentUserId);
      if (currentUserContact) params.set('currentUserContact', encodeURIComponent(currentUserContact));

      const response = await fetch(`/api/deliveries/search?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        const fetchedDeliveries = data.deliveries || [];
        setDeliveries(fetchedDeliveries);
        
        // Cache deliveries for instant loading next time
        if (typeof window !== 'undefined') {
          localStorage.setItem('bagami_my_deliveries_cache', JSON.stringify(fetchedDeliveries));
        }
      } else {
        console.error('Failed to fetch deliveries:', data.error);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch in background without showing loader since we have cached data
      fetchMyDeliveries(deliveries.length === 0);
    }
  }, [isAuthenticated]);

  // Filter deliveries
  const filteredDeliveries = useMemo(() => {
    let filtered = [...deliveries];

    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(d => 
        activeFilter === 'requests' ? d.type === 'request' : d.type === 'offer'
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => 
        statusFilter === 'expired' ? d.isExpired : !d.isExpired
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => {
        const translatedTitle = translateDeliveryTitle(d.title, locale);
        return translatedTitle?.toLowerCase().includes(query) ||
          d.fromCity?.toLowerCase().includes(query) ||
          d.toCity?.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [deliveries, activeFilter, statusFilter, searchQuery]);

  const handleEditDelivery = (delivery: any) => {
    // Store that we're coming from my-deliveries page
    sessionStorage.setItem('delivery_edit_referrer', '/my-deliveries');
    
    if (delivery.type === 'request') {
      router.push(`/deliveries/edit-request/${delivery.id}`);
    } else {
      router.push(`/deliveries/edit-offer/${delivery.id}`);
    }
  };

  if (status === 'loading' || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{myDeliveries('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white pb-6">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-transparent z-50">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-300 text-gray-700 transition-all hover:scale-105 hover:border-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 mx-4 flex justify-center">
            <div className="bg-white px-6 py-2 rounded-full border border-gray-300">
              <h1 className="text-base font-semibold text-gray-900">{myDeliveries('title')}</h1>
            </div>
          </div>
          <div className="w-10"></div>
        </div>
      </div>
      <div className="pt-16"></div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative flex items-center bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-xl border-2 border-gray-200 focus-within:border-orange-400 focus-within:shadow-lg transition-all duration-300">
              <Search className="w-5 h-5 text-gray-500 ml-4 flex-shrink-0" />
              <input
                type="text"
                placeholder={myDeliveries('search.placeholder')}
                className="w-full px-4 py-3 bg-transparent focus:outline-none placeholder-gray-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {searchQuery.length > 0 && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mr-3 p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-100 rounded-lg transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Type Filter */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">{myDeliveries('filters.type')}</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${
                  activeFilter === 'all' 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                }`}
              >
                {myDeliveries('filters.all')}
              </button>
              <button
                onClick={() => setActiveFilter('requests')}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${
                  activeFilter === 'requests' 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                }`}
              >
                {myDeliveries('filters.requests')}
              </button>
              <button
                onClick={() => setActiveFilter('offers')}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${
                  activeFilter === 'offers' 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                }`}
              >
                {myDeliveries('filters.offers')}
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">{myDeliveries('filters.status')}</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
                }`}
              >
                {myDeliveries('filters.all')}
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${
                  statusFilter === 'active' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-600 border border-gray-200'
                }`}
              >
                {myDeliveries('filters.active')}
              </button>
              <button
                onClick={() => setStatusFilter('expired')}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${
                  statusFilter === 'expired' 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'
                }`}
              >
                {myDeliveries('filters.expired')}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-gray-900">{deliveries.length}</div>
            <div className="text-xs text-gray-500 mt-1">{myDeliveries('stats.total')}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-green-600">
              {deliveries.filter(d => !d.isExpired).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">{myDeliveries('stats.active')}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-red-600">
              {deliveries.filter(d => d.isExpired).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">{myDeliveries('stats.expired')}</div>
          </div>
        </div>

        {/* Delivery Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                </div>
                <div className="space-y-1.5 mb-2.5">
                  <div className="h-3.5 bg-gray-200 rounded"></div>
                  <div className="h-3.5 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))
          ) : filteredDeliveries.length > 0 ? (
            // Delivery cards
            filteredDeliveries.map((delivery) => (
              <div 
                key={delivery.id} 
                onClick={() => handleEditDelivery(delivery)}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 relative overflow-hidden group hover:shadow-lg cursor-pointer ${
                  delivery.type === 'request' 
                    ? 'border-orange-100 hover:border-orange-200' 
                    : 'border-blue-100 hover:border-blue-200'
                } ${delivery.isExpired ? 'opacity-75' : ''}`}
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full ${
                  delivery.type === 'request' ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                }`} />
                
                {/* Expired indicator */}
                {delivery.isExpired && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-md z-10">
                    {myDeliveries('card.expired')}
                  </div>
                )}
                
                <div className="p-3">
                  {/* Header */}
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
                          <span className="font-medium">{delivery.weight ? `${delivery.weight} kg` : myDeliveries('card.weightTBD')}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="space-y-1.5 mb-2">
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
                    
                    {/* Date and price */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1.5">
                        <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 font-medium">
                          {delivery.arrivalDate ? 
                            `${myDeliveries('card.by')} ${new Date(delivery.arrivalDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}` :
                            delivery.departureDate ? `${new Date(delivery.departureDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}` : myDeliveries('card.tbd')
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1.5">
                        <DollarSign className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-gray-800">{formatAmount(delivery.price || 0)} FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Empty state
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
              <Package className="w-16 h-16 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{myDeliveries('search.noResults')}</h3>
              <p className="text-center mb-4">
                {searchQuery || activeFilter !== 'all' || statusFilter !== 'all'
                  ? myDeliveries('search.tryAdjusting')
                  : myDeliveries('search.noDeliveriesYet')}
              </p>
              <button
                onClick={() => router.push('/deliveries')}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                {myDeliveries('search.browseDeliveries')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
