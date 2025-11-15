import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

// Types for our data structures
interface Delivery {
  id: string;
  type: 'request' | 'offer';
  title: string;
  description: string;
  weight?: number;
  price?: number;
  currency?: string;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  departureDate?: string;
  arrivalDate?: string;
  status: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  route: string;
  isOwnedByCurrentUser: boolean;
  isExpired: boolean;
}

interface Conversation {
  id: string;
  deliveryId: string;
  delivery: any;
  otherParticipant: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    country?: string;
    countryCode?: string;
    averageRating?: number | null;
    reviewCount?: number;
    isVerified?: boolean;
  };
  lastMessage: any;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface DeliveryFilters {
  filter: 'all' | 'requests' | 'offers';
  searchQuery: string;
  departureCountry: string;
  destinationCountry: string;
  mineOnly: boolean;
  page?: number;
  limit?: number;
}

interface DeliveryResponse {
  deliveries: Delivery[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Utility function to get current user info
const getCurrentUserInfo = () => {
  // Try localStorage first (fallback auth)
  const currentUserId = localStorage.getItem('bagami_user_id');
  const currentUserContact = localStorage.getItem('bagami_user_contact');
  
  return {
    userId: currentUserId,
    userContact: currentUserContact
  };
};

// Query Keys
export const queryKeys = {
  deliveries: ['deliveries'] as const,
  deliveriesWithFilters: (filters: DeliveryFilters) => ['deliveries', filters] as const,
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  unreadCount: ['unreadCount'] as const,
};

// API Functions
const fetchDeliveries = async (filters: DeliveryFilters): Promise<DeliveryResponse> => {
  const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
  
  const params = new URLSearchParams({
    filter: filters.filter,
    search: filters.searchQuery,
    departureCountry: filters.departureCountry,
    destinationCountry: filters.destinationCountry,
    mineOnly: filters.mineOnly.toString(),
    page: (filters.page || 1).toString(),
    limit: (filters.limit || 20).toString()
  });
  
  // Add fallback auth params for ownership checking
  if (currentUserId) params.set('currentUserId', currentUserId);
  if (currentUserContact) params.set('currentUserContact', currentUserContact);

  const response = await fetch(`/api/deliveries/search?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch deliveries');
  }
  
  const result = await response.json();
  return {
    deliveries: result.deliveries || [],
    pagination: result.pagination || {}
  };
};

const fetchConversations = async (): Promise<Conversation[]> => {
  const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
  
  const params = new URLSearchParams();
  if (currentUserId) params.set('currentUserId', currentUserId);
  if (currentUserContact) params.set('currentUserContact', encodeURIComponent(currentUserContact));
  
  const response = await fetch(`/api/conversations${params.toString() ? '?' + params.toString() : ''}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }
  
  const result = await response.json();
  return result.conversations || [];
};

const fetchMessages = async (conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> => {
  const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
  
  const params = new URLSearchParams();
  if (currentUserId) params.set('currentUserId', currentUserId);
  if (currentUserContact) params.set('currentUserContact', encodeURIComponent(currentUserContact));
  
  const response = await fetch(`/api/conversations/${conversationId}/messages${params.toString() ? '?' + params.toString() : ''}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  
  const result = await response.json();
  return {
    conversation: result.conversation,
    messages: result.messages || []
  };
};

const fetchUnreadCount = async (): Promise<number> => {
  const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
  
  const params = new URLSearchParams();
  if (currentUserId) params.set('currentUserId', currentUserId);
  if (currentUserContact) params.set('currentUserContact', encodeURIComponent(currentUserContact));
  
  const response = await fetch(`/api/messages/unread-count${params.toString() ? '?' + params.toString() : ''}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch unread count');
  }
  
  const result = await response.json();
  return result.unreadCount || 0;
};

// Custom Hooks

/**
 * Hook to fetch deliveries with caching and smart refresh
 * Cache duration: 10 seconds for real-time updates
 * Background refetch: enabled with auto-polling
 */
export const useDeliveries = (filters: DeliveryFilters, options?: Partial<UseQueryOptions<DeliveryResponse, Error>>) => {
  return useQuery({
    queryKey: queryKeys.deliveriesWithFilters(filters),
    queryFn: () => fetchDeliveries(filters),
    staleTime: 10 * 1000, // 10 seconds (fresh for real-time feel)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 10 * 1000, // Auto-refetch every 10 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue polling in background
    retry: 3,
    ...options,
  });
};

/**
 * Hook to fetch conversations with shorter cache duration
 * Cache duration: 2 minutes (messages change more frequently)
 * Background refetch: enabled
 */
export const useConversations = (options?: Partial<UseQueryOptions<Conversation[], Error>>) => {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: fetchConversations,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 10 * 1000, // Auto-refetch every 10 seconds
    refetchIntervalInBackground: true,
    retry: 3,
    ...options,
  });
};

/**
 * Hook to fetch messages for a conversation
 * Cache duration: 1 minute (real-time feel)
 * Background refetch: enabled
 */
export const useMessages = (conversationId: string, options?: Partial<UseQueryOptions<{ conversation: Conversation; messages: Message[] }, Error>>) => {
  return useQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: () => fetchMessages(conversationId),
    staleTime: 2 * 1000, // 2 seconds (very fresh for real-time feel)
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 3 * 1000, // Auto-refetch every 3 seconds for real-time messaging
    refetchIntervalInBackground: true, // Continue polling in background
    retry: 3,
    enabled: !!conversationId, // Only fetch if conversationId is provided
    ...options,
  });
};

/**
 * Hook to fetch unread message count
 * Cache duration: 30 seconds (should be very fresh)
 * Background refetch: enabled
 */
export const useUnreadCount = (options?: Partial<UseQueryOptions<number, Error>>) => {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: fetchUnreadCount,
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 5 * 1000, // Auto-refetch every 5 seconds
    refetchIntervalInBackground: true,
    retry: 3,
    ...options,
  });
};

// Mutation Hooks

/**
 * Hook to send a message with optimistic updates
 */
export const useSendMessage = (options?: UseMutationOptions<any, Error, { conversationId: string; content: string }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, content }) => {
      const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          currentUserId: currentUserId,
          currentUserContact: currentUserContact
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data, { conversationId }) => {
      // Invalidate and refetch messages for this conversation
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      // Invalidate unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
    ...options,
  });
};

// Refresh helpers for manual refresh functionality
export const useRefreshDeliveries = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.deliveries });
  };
};

export const useRefreshConversations = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
  };
};

export const useRefreshMessages = () => {
  const queryClient = useQueryClient();
  
  return (conversationId?: string) => {
    if (conversationId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
    } else {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  };
};

export const useRefreshUnreadCount = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
  };
};