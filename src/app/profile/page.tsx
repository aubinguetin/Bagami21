'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  User, 
  Package, 
  Home,
  Settings,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  ChevronDown,
  Star,
  TrendingUp,
  MessageCircle,
  Wallet,
  Gift,
  UserCheck,
  Lock,
  Mail,
  Heart,
  Trash2,
  Edit3,
  Eye,
  CreditCard,
  Award,
  Plus,
  Search,
  Share2
} from 'lucide-react';
import { PostTypeSelectionModal } from '@/components/PostTypeSelectionModal';
import { useT } from '@/lib/i18n-helpers';

interface UserInfo {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  idVerificationStatus?: 'approved' | 'pending' | 'rejected' | null;
}

function ProfileSection({ userInfo, onSignOut, onRefresh, router, isLoading }: { userInfo: UserInfo; onSignOut: () => void; onRefresh: () => void; router: any; isLoading?: boolean }) {
  const { profile } = useT();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [shareMessage, setShareMessage] = useState<string>('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500); // Brief delay to show the animation
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/download`;
    const shareData = {
      title: 'Bagami - Your Global Delivery Network',
      text: 'Join Bagami and connect with travelers to send packages worldwide!',
      url: shareUrl
    };

    try {
      // Check if Web Share API is available (works on mobile and some desktop browsers)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        console.log('Shared successfully');
      } else if (navigator.share) {
        // Fallback for browsers that support share but not canShare
        await navigator.share(shareData);
        console.log('Shared successfully');
      } else {
        // Fallback: Copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          setShareMessage('Link copied to clipboard! ✓');
          setTimeout(() => setShareMessage(''), 3000);
        } else {
          // Ultimate fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            setShareMessage('Link copied to clipboard! ✓');
            setTimeout(() => setShareMessage(''), 3000);
          } catch (err) {
            console.error('Failed to copy:', err);
            setShareMessage('Could not copy link');
            setTimeout(() => setShareMessage(''), 3000);
          }
          document.body.removeChild(textArea);
        }
      }
    } catch (error: any) {
      // User cancelled the share or an error occurred
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        // Try clipboard as fallback
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);
            setShareMessage('Link copied to clipboard! ✓');
            setTimeout(() => setShareMessage(''), 3000);
          }
        } catch (clipboardError) {
          console.error('Clipboard fallback failed:', clipboardError);
        }
      }
    }
  };

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!userInfo.id) {
      console.log('⏳ Waiting for user ID to fetch wallet balance...');
      return;
    }

    try {
      console.log('💰 Fetching wallet balance for user:', userInfo.id);
      const response = await fetch(`/api/wallet?userId=${userInfo.id}`);
      const data = await response.json();
      
      if (response.ok && data.stats) {
        const balance = data.stats.balance || 0;
        setWalletBalance(balance);
        console.log('✅ Wallet balance updated:', balance, 'FCFA');
      } else {
        console.error('❌ Error in wallet response:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Error fetching wallet balance:', error);
    }
  };

  // Fetch wallet balance when userInfo.id becomes available
  useEffect(() => {
    if (userInfo.id) {
      fetchWalletBalance();
    }
  }, [userInfo.id]);

  // Refresh wallet balance when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userInfo.id) {
        console.log('🔄 Page visible - refreshing wallet balance');
        fetchWalletBalance();
      }
    };

    const handleFocus = () => {
      if (userInfo.id) {
        console.log('🔄 Window focused - refreshing wallet balance');
        fetchWalletBalance();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userInfo.id]);

  return (
    <div className="px-4 py-4 space-y-2 max-w-md mx-auto">
      {/* Wallet Card */}
      <button 
        onClick={() => router.push('/wallet')}
        className="w-full bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white/80 text-xs font-medium">{profile('walletBalance')}</p>
              <p className="text-white text-base font-bold">{walletBalance.toLocaleString()} FCFA</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/70" />
        </div>
      </button>

      {/* Settings */}
      <button 
        onClick={() => router.push('/settings')}
        className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center space-x-3">
          <Settings className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">{profile('settings')}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      {/* My Deliveries */}
      <button 
        onClick={() => router.push('/my-deliveries')}
        className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center space-x-3">
          <Package className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">{profile('myDeliveries')}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      {/* My Alerts */}
      <button 
        onClick={() => router.push('/alerts')}
        className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center space-x-3">
          <Bell className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">{profile('myAlerts')}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      {/* Messages */}
      <button 
        onClick={() => router.push('/messages?from=profile')}
        className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">{profile('messages')}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      {/* My Wallet */}
      <button 
        onClick={() => router.push('/wallet')}
        className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center space-x-3">
          <CreditCard className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">{profile('myWallet')}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      {/* Reviews */}
      <button 
        onClick={() => router.push('/reviews')}
        className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center space-x-3">
          <UserCheck className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">{profile('reviews')}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      {/* Contact Bagami */}
      <button 
        onClick={() => router.push('/contact')}
        className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center space-x-3">
          <Mail className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">{profile('contactBagami')}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      {/* Rate Bagami */}
      <button className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <Heart className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">{profile('rateBagami')}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      {/* Share Bagami */}
      <button 
        onClick={handleShare}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all active:scale-95"
      >
        <div className="flex items-center space-x-3">
          <Share2 className="w-4 h-4 text-orange-600" />
          <span className="font-medium text-orange-700">
            {shareMessage || profile('shareBagami')}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-orange-500" />
      </button>

      {/* Log Out */}
      <button 
        onClick={() => setShowSignOutConfirm(true)}
        className="w-full flex items-center justify-between p-3 bg-orange-50 rounded-xl shadow-sm border border-orange-100"
      >
        <div className="flex items-center space-x-3">
          <LogOut className="w-4 h-4 text-orange-600" />
          <span className="font-medium text-orange-700">{profile('logOut')}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-orange-500" />
      </button>
      
      {/* Delete Account */}
      <div className="text-center">
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-600 hover:text-red-700 underline text-sm font-medium transition-colors"
        >
          {profile('deleteAccount')}
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-3xl flex items-center justify-center">
                <LogOut className="w-8 h-8 text-orange-600" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2">{profile('logOutModal.title')}</h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                {profile('logOutModal.message')}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  {profile('logOutModal.cancel')}
                </button>
                <button
                  onClick={() => {
                    setShowSignOutConfirm(false);
                    onSignOut();
                  }}
                  className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                >
                  {profile('logOutModal.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-3xl flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2">{profile('deleteAccountModal.title')}</h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                {profile('deleteAccountModal.message')}
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
                <p className="text-red-700 text-xs font-medium">
                  {profile('deleteAccountModal.warning')}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  {profile('deleteAccountModal.cancel')}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    // TODO: Implement account deletion logic
                    alert('Account deletion would be implemented here');
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                >
                  {profile('deleteAccountModal.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { profile } = useT();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);
  
  // Initialize user info immediately from session to avoid loading delay
  const getInitialUserInfo = (): UserInfo => {
    if (session?.user) {
      return {
        id: session.user.id || null,
        name: session.user.name || null,
        email: session.user.email || null,
        phone: (session.user as any).phone || null,
        image: session.user.image || null,
        emailVerified: !!(session.user as any).emailVerified,
        phoneVerified: !!(session.user as any).phoneVerified,
        idVerificationStatus: (session.user as any).idVerificationStatus || null
      };
    }
    return {
      id: null,
      name: null,
      email: null,
      phone: null,
      image: null,
      emailVerified: false,
      phoneVerified: false,
      idVerificationStatus: null
    };
  };

  // State for user information - initialized with session data for instant display
  const [userInfo, setUserInfo] = useState<UserInfo>(getInitialUserInfo());
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);

  // Update userInfo when session changes - but preserve existing data
  useEffect(() => {
    if (session?.user) {
      setUserInfo(prev => ({
        id: session.user.id || prev.id,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
        phone: (session.user as any).phone || prev.phone,
        image: session.user.image || prev.image,
        emailVerified: !!(session.user as any).emailVerified,
        phoneVerified: !!(session.user as any).phoneVerified,
        idVerificationStatus: (session.user as any).idVerificationStatus || prev.idVerificationStatus
      }));
    }
  }, [session]);

  // Function to fetch user data from API (for additional details and verification status)
  const fetchUserInfo = async (silent = false) => {
    // Only show loading state if we don't have data yet and not silent refresh
    if (!silent && !userInfo.id) {
      setIsLoadingUserInfo(true);
    }
    
    try {
      const response = await fetch('/api/user/profile');
      const result = await response.json();
      
      if (result.success && result.user) {
        const user = result.user;
        
        // Format phone number for display if it exists
        let displayPhone = user.phone;
        if (user.phone && user.countryCode) {
          displayPhone = `${user.countryCode} ${user.phone}`;
        }
        
        // Get ID verification status
        let idVerificationStatus = null;
        if (user.idDocuments && user.idDocuments.length > 0) {
          idVerificationStatus = user.idDocuments[0].verificationStatus;
        }
        
        setUserInfo({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: displayPhone,
          image: user.image,
          emailVerified: !!user.emailVerified,
          phoneVerified: !!user.phoneVerified,
          idVerificationStatus: idVerificationStatus
        });
        
        console.log('✅ User info updated:', user);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Keep existing session data if API fails
    } finally {
      if (!silent) {
        setIsLoadingUserInfo(false);
      }
    }
  };

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

  useEffect(() => {
    // Check for simple authentication flag
    const bagamiAuth = localStorage.getItem('bagami_authenticated');
    
    if (status === 'authenticated' || bagamiAuth === 'true') {
      setIsAuthenticated(true);
    } else if (status === 'unauthenticated' && !bagamiAuth) {
      // Use a timeout to avoid router.push during render
      const timeoutId = setTimeout(() => {
        router.push('/auth');
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [status, router]);

  // Fetch user info when component mounts or authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      // Check if profile was updated while user was away
      const profileUpdated = localStorage.getItem('profileUpdated');
      if (profileUpdated) {
        // Clear the flag
        localStorage.removeItem('profileUpdated');
        console.log('🔄 Profile was updated, fetching latest data...');
        // Visible refresh when there was an explicit update
        fetchUserInfo(false);
      } else {
        // Silent background refresh (no loading state)
        fetchUserInfo(true);
      }
    }
  }, [isAuthenticated]);

  // Check for profile updates on every mount (when user navigates back to profile)
  useEffect(() => {
    // Check if profile was recently updated
    const profileUpdated = localStorage.getItem('profileUpdated');
    if (profileUpdated && session?.user?.id) {
      // Clear the flag
      localStorage.removeItem('profileUpdated');
      console.log('🔄 Profile update detected on mount, refreshing...');
      // Visible refresh when there was an explicit update
      fetchUserInfo(false);
    }
  }, []); // Run once on mount

  // Listen for profile updates from other pages
  useEffect(() => {
    const handleProfileUpdate = () => {
      // Visible refresh when explicitly triggered by an update event
      fetchUserInfo(false);
    };

    // Listen for custom profile update events
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    // Also refresh when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Silent background refresh when tab becomes visible
        fetchUserInfo(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleProfileUpdate);
    };
  }, [isAuthenticated]);

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
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('bagami_authenticated');
      localStorage.removeItem('bagami_user_id');
      localStorage.removeItem('bagami_user_contact');
      localStorage.removeItem('bagami_user_name');
      
      // If using NextAuth, sign out
      if (session) {
        const { signOut } = await import('next-auth/react');
        await signOut({ redirect: false });
      }
      
      // Redirect to auth page
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even if there's an error
      router.push('/auth');
    }
  };

  // Add a function to refresh user info (to be called after updates)
  const refreshUserInfo = () => {
    fetchUserInfo();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">{profile('auth.signInRequired')}</h2>
          <p className="mt-2 text-sm text-gray-600">{profile('auth.authMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 bg-transparent z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center">
            <div className="bg-white px-6 py-2 rounded-full border border-gray-300">
              <h1 className="text-base font-bold text-slate-800">
                {profile('title')}
              </h1>
            </div>
          </div>
        </div>
      </header>
      <div className="pt-16"></div>

      {/* User Info Section - Below Header */}
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-transparent rounded-lg p-3">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center border-2 border-white shadow-md flex-shrink-0">
                {userInfo.image ? (
                  <img src={userInfo.image} alt="Profile" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-orange-600">
                    {(userInfo.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* User Info - Right Side */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-800 truncate">
                    {userInfo.name || 'User'}
                  </h2>
                  {/* ID Verification Badge */}
                  {userInfo.idVerificationStatus === 'approved' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex-shrink-0">
                      <Shield className="w-3 h-3 mr-1" />
                      {profile('verificationStatus.verified')}
                    </span>
                  )}
                  {userInfo.idVerificationStatus === 'pending' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 flex-shrink-0">
                      <Shield className="w-3 h-3 mr-1" />
                      {profile('verificationStatus.pending')}
                    </span>
                  )}
                  {userInfo.idVerificationStatus === 'rejected' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex-shrink-0">
                      <Shield className="w-3 h-3 mr-1" />
                      {profile('verificationStatus.rejected')}
                    </span>
                  )}
                  {!userInfo.idVerificationStatus && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 flex-shrink-0">
                      <Shield className="w-3 h-3 mr-1" />
                      {profile('verificationStatus.notVerified')}
                    </span>
                  )}
                </div>
                {userInfo.email && (
                  <p className="text-sm text-gray-600 truncate">
                    {userInfo.email}
                  </p>
                )}
                {userInfo.phone && (
                  <p className="text-sm text-gray-600 truncate">
                    {userInfo.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ProfileSection userInfo={userInfo} onSignOut={handleSignOut} onRefresh={refreshUserInfo} router={router} isLoading={isLoadingUserInfo} />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 z-50 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-5 h-16 max-w-screen-xl mx-auto">
          {/* Search */}
          <button
            onClick={() => router.push('/deliveries')}
            className="group flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <Search className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-semibold tracking-wide">{profile('bottomNav.search')}</span>
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
            <span className="text-[10px] font-semibold tracking-wide">{profile('bottomNav.messages')}</span>
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
            
            <span className="text-[10px] font-semibold text-orange-600 tracking-wide">{profile('bottomNav.post')}</span>
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
            <span className="text-[10px] font-semibold tracking-wide">{profile('bottomNav.notifications')}</span>
          </button>

          {/* Profile - Active */}
          <button className="relative flex flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-95">
            {/* Active indicator bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-b-full" />
            
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl blur-md opacity-40" />
              
              {/* Icon container */}
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-2xl shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <span className="text-[10px] font-semibold text-orange-600 tracking-wide">{profile('bottomNav.profile')}</span>
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