'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  MessageCircle,
  Search,
  User,
  Plus,
  CheckCheck,
  Clock,
  ChevronRight
} from 'lucide-react';
import { PostTypeSelectionModal } from '@/components/PostTypeSelectionModal';
import { useT, useLocale } from '@/lib/i18n-helpers';
import { translateNotification } from '@/utils/translateNotification';

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

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { notifications: t, common } = useT();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);

  // Check authentication
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

  // Get user ID
  const getUserId = () => {
    if (session?.user?.id) {
      return session.user.id;
    }
    return localStorage.getItem('bagami_user_id');
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    const userId = getUserId();
    if (!userId) {
      console.log('⏳ Waiting for user ID to fetch notifications...');
      return;
    }

    try {
      console.log('📬 Fetching notifications for user:', userId);
      const response = await fetch(`/api/notifications?userId=${userId}&limit=50`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        console.log('✅ Loaded notifications:', data.notifications.length);
      } else {
        console.error('❌ Error fetching notifications:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/unread-count?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const userId = getUserId();
    if (!userId) return;

    try {
      console.log('✅ Marking notification as read:', notificationId);
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId })
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date() }
              : n
          )
        );
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      console.log('✅ Marking all notifications as read');
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAllAsRead: true })
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  };

  // Handle notification click
    const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'alert_match':
        if (notification.relatedId) {
          router.push(`/deliveries/${notification.relatedId}?from=notifications`);
        }
        break;
      case 'transaction':
        if (notification.relatedId) {
          router.push(`/wallet?transactionId=${notification.relatedId}`);
        }
        break;
      case 'review':
        if (notification.relatedId) {
          router.push(`/reviews?reviewId=${notification.relatedId}`);
        } else {
          router.push('/reviews');
        }
        break;
      case 'rating_reminder':
        if (notification.relatedId) {
          // relatedId contains the conversation ID
          router.push(`/chat/${notification.relatedId}`);
        } else {
          router.push('/messages');
        }
        break;
      case 'admin_notification':
        if (notification.relatedId) {
          // relatedId contains the link URL
          const link = notification.relatedId;
          // Check if it's an external link or internal route
          if (link.startsWith('http://') || link.startsWith('https://')) {
            window.location.href = link;
          } else {
            router.push(link);
          }
        }
        break;
      case 'id_verification':
        // ID verification notifications redirect to settings page
        router.push('/settings?returnUrl=/notifications');
        break;
      case 'update':
        // Check message content to determine destination
        const message = notification.message.toLowerCase();
        
        // Profile information updates (name, email, phone) go to my-information page
        if (message.includes('full name') || 
            message.includes('email address') || 
            message.includes('phone number')) {
          router.push('/settings/my-information');
        } 
        // Password and ID verification go to settings page
        else if (message.includes('password') || 
                 message.includes('id verification')) {
          router.push('/settings?returnUrl=/notifications');
        }
        // Default to settings for other update notifications
        else {
          router.push('/settings?returnUrl=/notifications');
        }
        break;
      case 'message':
        // TODO: Navigate to messages
        break;
      case 'delivery_update':
        // TODO: Navigate to delivery details
        break;
      default:
        break;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if it's today
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if it's yesterday
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // Check if it's within the last week
    const daysDiff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[d.getDay()];
    }

    // Otherwise return formatted date
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  // Refresh on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        fetchNotifications();
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">{t('signIn.title')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('signIn.message')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-transparent z-50">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-300 text-gray-700 transition-all hover:scale-105 hover:border-gray-400"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
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

      {/* Main Content */}
      <main className="flex-1">
        <div className="px-4 sm:px-6 py-4">
          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <div className="mb-4">
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors border border-orange-200"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{t('markAllAsRead')}</span>
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <BellOff className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('empty.title')}</h3>
              <p className="text-sm text-gray-600">
                {t('empty.message')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                // Translate notification content based on current locale
                const { title, message } = translateNotification(notification, locale as 'en' | 'fr');
                
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                      notification.isRead
                        ? 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm'
                        : 'bg-gradient-to-br from-orange-50 to-orange-50/50 border-2 border-orange-200 hover:border-orange-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Title and unread indicator */}
                        <div className="flex items-start gap-2 mb-1.5">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5"></div>
                          )}
                          <p className={`text-sm font-bold leading-snug ${
                            notification.isRead ? 'text-gray-900' : 'text-orange-900'
                          }`}>
                            {title}
                          </p>
                        </div>
                        
                        {/* Message */}
                        <p className={`text-sm mb-3 leading-relaxed ${
                          notification.isRead ? 'text-gray-600' : 'text-gray-800'
                        } ${!notification.isRead ? 'ml-4' : ''}`}>
                          {message}
                        </p>
                      
                      {/* Time ago */}
                      <div className={`flex items-center gap-1.5 text-xs ${
                        notification.isRead ? 'text-gray-500' : 'text-orange-700/70'
                      } ${!notification.isRead ? 'ml-4' : ''}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTimeAgo(notification.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* Chevron */}
                    <ChevronRight className={`w-5 h-5 flex-shrink-0 mt-1 ${
                      notification.isRead ? 'text-gray-300' : 'text-orange-400'
                    }`} />
                  </div>
                </button>
                );
              })}
            </div>
          )}
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
            <span className="text-[10px] font-semibold tracking-wide">{common('navigation.home')}</span>
          </button>

          {/* Messages */}
          <button
            onClick={() => router.push('/messages')}
            className="group flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-semibold tracking-wide">{common('navigation.messages')}</span>
          </button>

          {/* Post Button - Center */}
          <button
            onClick={() => setShowPostTypeModal(true)}
            className="relative flex flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-95"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md blur-md opacity-40" />
              <div className="relative bg-white border-2 border-orange-500 p-1 rounded-md shadow-lg">
                <Plus className="w-3 h-3 text-orange-500" />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-orange-600 tracking-wide">{common('actions.submit')}</span>
          </button>

          {/* Notifications - Active */}
          <button className="relative flex flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-95">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-b-full" />
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl blur-md opacity-40" />
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-2xl shadow-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-orange-600 tracking-wide">{common('navigation.alerts')}</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => router.push('/profile')}
            className="group flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <User className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-semibold tracking-wide">{common('navigation.profile')}</span>
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
