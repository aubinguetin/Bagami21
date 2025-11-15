'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiPackage, 
  FiMapPin, 
  FiCalendar, 
  FiDollarSign,
  FiUser,
  FiClock,
  FiInfo,
  FiBox,
  FiTrash2,
  FiMessageSquare,
  FiCheckCircle,
  FiCircle,
} from 'react-icons/fi';

interface DeliveryDetails {
  id: string;
  title: string;
  description: string | null;
  type: 'request' | 'offer';
  fromCity: string;
  fromCountry: string;
  toCity: string;
  toCountry: string;
  price: number;
  currency: string;
  weight: number | null;
  status: string;
  createdAt: Date;
  departureDate: Date | null;
  arrivalDate: Date | null;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    createdAt: Date;
  };
  conversations: ConversationWithStatus[];
}

interface ConversationWithStatus {
  id: string;
  participant1: {
    id: string;
    name: string | null;
    email: string | null;
  };
  participant2: {
    id: string;
    name: string | null;
    email: string | null;
  };
  status: 'pending' | 'paid' | 'delivered';
  hasPayment: boolean;
  hasDeliveryConfirmation: boolean;
  paymentDate?: Date;
  deliveryDate?: Date;
  createdAt: Date;
  lastMessageAt: Date;
}

export default function DeliveryDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDelivery();
  }, [params.id]);

  const fetchDelivery = async () => {
    try {
      const response = await fetch(`/api/backoffice/deliveries/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setDelivery(data);
      } else {
        alert('Failed to fetch delivery details');
      }
    } catch (error) {
      console.error('Error fetching delivery:', error);
      alert('Error fetching delivery details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this delivery? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/backoffice/deliveries/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/backoffice/deliveries');
      } else {
        alert('Failed to delete delivery');
      }
    } catch (error) {
      console.error('Error deleting delivery:', error);
      alert('Error deleting delivery');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency = 'XOF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Delivery not found</h2>
          <button
            onClick={() => router.push('/backoffice/deliveries')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Deliveries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/backoffice/deliveries')}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Delivery Details</h1>
            <p className="text-slate-600 mt-1">View delivery information</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <FiTrash2 className="w-4 h-4" />
          Delete Delivery
        </button>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{delivery.title}</h2>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                delivery.type === 'request'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {delivery.type}
              </span>
            </div>
            {delivery.description && (
              <p className="text-slate-600 mt-2">{delivery.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Route Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FiMapPin className="w-5 h-5 text-blue-600" />
              Route Information
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">From</p>
                <p className="font-semibold text-slate-900">
                  {delivery.fromCity}, {delivery.fromCountry}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">To</p>
                <p className="font-semibold text-slate-900">
                  {delivery.toCity}, {delivery.toCountry}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing & Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FiInfo className="w-5 h-5 text-blue-600" />
              Details
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiDollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-slate-600">Price</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(delivery.price, delivery.currency)}
                </span>
              </div>
              {delivery.weight && (
                <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiBox className="w-5 h-5 text-blue-600" />
                    <span className="text-slate-600">Weight</span>
                  </div>
                  <span className="font-semibold text-slate-900">{delivery.weight} kg</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FiCalendar className="w-5 h-5 text-blue-600" />
              Dates
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Created</p>
                <p className="font-semibold text-slate-900">{formatDate(delivery.createdAt)}</p>
              </div>
              {delivery.type === 'offer' && delivery.departureDate && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Departure</p>
                  <p className="font-semibold text-slate-900">{formatDate(delivery.departureDate)}</p>
                </div>
              )}
              {delivery.arrivalDate && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">
                    {delivery.type === 'request' ? 'Needed By' : 'Arrival'}
                  </p>
                  <p className="font-semibold text-slate-900">{formatDate(delivery.arrivalDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sender Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FiUser className="w-5 h-5 text-blue-600" />
              Sender Information
            </h3>
            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-slate-600">Name</p>
                <p className="font-semibold text-slate-900">{delivery.sender.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="font-semibold text-slate-900">{delivery.sender.email || 'N/A'}</p>
              </div>
              {delivery.sender.phone && (
                <div>
                  <p className="text-sm text-slate-600">Phone</p>
                  <p className="font-semibold text-slate-900">{delivery.sender.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-600">Role</p>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  delivery.sender.role === 'admin' || delivery.sender.role === 'superadmin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {delivery.sender.role}
                </span>
              </div>
              <button
                onClick={() => router.push(`/backoffice/users/${delivery.sender.id}`)}
                className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                View User Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations & Status */}
      {delivery.conversations && delivery.conversations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <FiMessageSquare className="w-5 h-5 text-blue-600" />
            Related Conversations ({delivery.conversations.length})
          </h3>
          
          <div className="space-y-3">
            {delivery.conversations.map((conversation) => {
              const otherParticipant = conversation.participant1.id === delivery.sender.id 
                ? conversation.participant2 
                : conversation.participant1;
              
              return (
                <div 
                  key={conversation.id} 
                  className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <FiUser className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-900">
                            {otherParticipant.name || otherParticipant.email || 'Unknown User'}
                          </span>
                        </div>
                        {conversation.status !== 'pending' && (
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            conversation.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {conversation.status === 'delivered' ? '✓ Delivered' : '$ Paid'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <FiClock className="w-3.5 h-3.5" />
                          <span>Started: {formatDate(conversation.createdAt)}</span>
                        </div>
                      </div>

                      {/* Payment & Delivery Timeline */}
                      <div className="mt-3 space-y-2">
                        {/* Payment Status */}
                        <div className="flex items-center gap-2">
                          {conversation.hasPayment ? (
                            <>
                              <FiCheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-slate-700">
                                Payment made on {formatDate(conversation.paymentDate || null)}
                              </span>
                            </>
                          ) : (
                            <>
                              <FiCircle className="w-4 h-4 text-slate-300" />
                              <span className="text-sm text-slate-500">No payment yet</span>
                            </>
                          )}
                        </div>

                        {/* Delivery Status */}
                        <div className="flex items-center gap-2">
                          {conversation.hasDeliveryConfirmation ? (
                            <>
                              <FiCheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-slate-700">
                                Delivered on {formatDate(conversation.deliveryDate || null)}
                              </span>
                            </>
                          ) : (
                            <>
                              <FiCircle className="w-4 h-4 text-slate-300" />
                              <span className="text-sm text-slate-500">Not delivered yet</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/chat/${conversation.id}`)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
