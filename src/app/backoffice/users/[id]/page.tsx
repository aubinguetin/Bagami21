'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiMail, 
  FiPhone, 
  FiCalendar,
  FiMapPin,
  FiUser,
  FiStar,
  FiPackage,
  FiCreditCard,
  FiDollarSign,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiCheck,
  FiX,
  FiImage,
} from 'react-icons/fi';

interface UserDetails {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  countryCode: string | null;
  role: string;
  isActive: boolean;
  emailVerified: Date | null;
  phoneVerified: Date | null;
  createdAt: Date;
  country: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  idVerificationStatus: 'not_verified' | 'pending' | 'verified' | 'rejected';
  averageRating: number;
  totalReviews: number;
  sentDeliveries: number;
  receivedDeliveries: number;
  walletBalance: number;
  transactions: number;
  totalSpent: number;
  totalReceived: number;
}

interface Delivery {
  id: string;
  title: string;
  fromCity: string;
  toCity: string;
  price: number;
  currency: string;
  status: string;
  createdAt: Date;
  type: string;
  direction: 'sent' | 'received';
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: Date;
}

interface IdDocument {
  id: string;
  documentType: string;
  frontImagePath: string | null;
  backImagePath: string | null;
  verificationStatus: string;
  uploadedAt: Date;
}

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [idDocument, setIdDocument] = useState<IdDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deliveries' | 'transactions' | 'verification'>('deliveries');

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/backoffice/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setUser(data.user);
      setDeliveries(data.deliveries || []);
      setTransactions(data.transactions || []);
      setIdDocument(data.idDocument || null);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!user) return;
    
    if (!confirm(`Are you sure you want to ${user.isActive ? 'suspend' : 'activate'} this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/backoffice/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (response.ok) {
        fetchUserDetails();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleVerifyId = async (status: 'approved' | 'rejected') => {
    if (!idDocument) return;
    
    if (!confirm(`Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} this ID document?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/backoffice/users/${userId}/verify-id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentId: idDocument.id,
          status 
        }),
      });

      if (response.ok) {
        fetchUserDetails();
      }
    } catch (error) {
      console.error('Error updating ID verification:', error);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">User Not Found</h2>
        <button
          onClick={() => router.push('/backoffice/users')}
          className="text-blue-600 hover:text-blue-800"
        >
          Return to Users
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/backoffice/users')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <FiArrowLeft className="w-5 h-5" />
          Back to Users
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{user.name || 'Unnamed User'}</h1>
                <p className="text-slate-500">ID: {user.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Suspended'}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' || user.role === 'superadmin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {user.role !== 'admin' && user.role !== 'superadmin' && (
              <button
                onClick={handleSuspendUser}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                  user.isActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {user.isActive ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                {user.isActive ? 'Suspend User' : 'Activate User'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Wallet Balance</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(user.walletBalance)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Average Rating</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {user.averageRating.toFixed(1)} / 5.0
              </p>
              <p className="text-xs text-slate-500">{user.totalReviews} reviews</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FiStar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Deliveries</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {user.sentDeliveries + user.receivedDeliveries}
              </p>
              <p className="text-xs text-slate-500">
                {user.sentDeliveries} sent, {user.receivedDeliveries} received
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiPackage className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Transactions</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{user.transactions}</p>
              <p className="text-xs text-slate-500">
                ↑ {formatCurrency(user.totalReceived)} | ↓ {formatCurrency(user.totalSpent)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiCreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FiUser className="w-5 h-5" />
            User Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
              <div className="flex items-center gap-2 text-slate-900">
                <FiMail className="w-4 h-4 text-slate-400" />
                <span>{user.email || 'N/A'}</span>
                {user.emailVerified && (
                  <span className="text-xs text-green-600">✓ Verified</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
              <div className="flex items-center gap-2 text-slate-900">
                <FiPhone className="w-4 h-4 text-slate-400" />
                <span>
                  {user.phone ? `${user.countryCode}${user.phone}` : 'N/A'}
                </span>
                {user.phoneVerified && (
                  <span className="text-xs text-green-600">✓ Verified</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Country</label>
              <div className="flex items-center gap-2 text-slate-900">
                <FiMapPin className="w-4 h-4 text-slate-400" />
                <span>{user.country || 'N/A'}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Gender</label>
              <div className="flex items-center gap-2 text-slate-900">
                <FiUser className="w-4 h-4 text-slate-400" />
                <span>{user.gender || 'N/A'}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Date of Birth</label>
              <div className="flex items-center gap-2 text-slate-900">
                <FiCalendar className="w-4 h-4 text-slate-400" />
                <span>{formatDate(user.dateOfBirth)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Member Since</label>
              <div className="flex items-center gap-2 text-slate-900">
                <FiCalendar className="w-4 h-4 text-slate-400" />
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">ID Verification</label>
              <div className="flex items-center gap-2">
                <FiShield className="w-4 h-4 text-slate-400" />
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  user.idVerificationStatus === 'verified'
                    ? 'bg-green-100 text-green-800'
                    : user.idVerificationStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : user.idVerificationStatus === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {user.idVerificationStatus === 'verified'
                    ? 'Verified'
                    : user.idVerificationStatus === 'pending'
                    ? 'Pending'
                    : user.idVerificationStatus === 'rejected'
                    ? 'Rejected'
                    : 'Not Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deliveries and Transactions */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
                activeTab === 'deliveries'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FiPackage className="w-4 h-4" />
                Deliveries ({deliveries.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
                activeTab === 'transactions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FiCreditCard className="w-4 h-4" />
                Transactions ({transactions.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
                activeTab === 'verification'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FiShield className="w-4 h-4" />
                ID Verification
                {user.idVerificationStatus === 'pending' && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                    Pending
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'deliveries' ? (
            <div className="space-y-3">
              {deliveries.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No deliveries yet</p>
              ) : (
                deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => router.push(`/backoffice/deliveries/${delivery.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{delivery.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {delivery.fromCity} → {delivery.toCity}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-500">
                            {formatDate(delivery.createdAt)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            delivery.type === 'request'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {delivery.type}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            delivery.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : delivery.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {delivery.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatCurrency(delivery.price, delivery.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'transactions' ? (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No transactions yet</p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => router.push(`/backoffice/transactions/${transaction.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{transaction.type}</h3>
                        <p className="text-sm text-slate-600 mt-1">{transaction.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-500">
                            {formatDate(transaction.createdAt)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type.includes('credit') || transaction.type.includes('refund')
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {transaction.type.includes('credit') || transaction.type.includes('refund') ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* ID Verification Tab */
            <div className="space-y-4">
              {!idDocument ? (
                <div className="text-center py-12">
                  <FiImage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">No ID document uploaded</p>
                  <p className="text-slate-400 text-sm mt-2">The user hasn't submitted any ID documents yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Document Info */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Document Type</label>
                        <p className="text-slate-900 font-medium">{idDocument.documentType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Uploaded Date</label>
                        <p className="text-slate-900">{formatDate(idDocument.uploadedAt)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Current Status</label>
                        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                          idDocument.verificationStatus === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : idDocument.verificationStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {idDocument.verificationStatus === 'approved'
                            ? 'Approved'
                            : idDocument.verificationStatus === 'rejected'
                            ? 'Rejected'
                            : 'Pending Review'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document Images */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Document Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Front Image */}
                      {idDocument.frontImagePath && (
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-2">Front Side</label>
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <img
                              src={idDocument.frontImagePath}
                              alt="ID Front"
                              className="w-full h-64 object-contain bg-slate-50"
                            />
                          </div>
                        </div>
                      )}

                      {/* Back Image */}
                      {idDocument.backImagePath && (
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-2">Back Side</label>
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <img
                              src={idDocument.backImagePath}
                              alt="ID Back"
                              className="w-full h-64 object-contain bg-slate-50"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Actions */}
                  {idDocument.verificationStatus === 'pending' && (
                    <div className="flex gap-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleVerifyId('approved')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                      >
                        <FiCheck className="w-5 h-5" />
                        Approve ID
                      </button>
                      <button
                        onClick={() => handleVerifyId('rejected')}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                      >
                        <FiX className="w-5 h-5" />
                        Reject ID
                      </button>
                    </div>
                  )}

                  {/* Status Message for Already Processed */}
                  {idDocument.verificationStatus !== 'pending' && (
                    <div className={`p-4 rounded-lg ${
                      idDocument.verificationStatus === 'approved'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        idDocument.verificationStatus === 'approved'
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}>
                        This ID document has been {idDocument.verificationStatus === 'approved' ? 'approved' : 'rejected'}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
