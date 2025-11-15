'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  FiArrowLeft,
  FiUser,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiMapPin,
  FiPackage,
  FiInfo,
  FiLink,
} from 'react-icons/fi';

interface TransactionDetail {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: string;
  description: string;
  category: string;
  referenceId?: string;
  metadata?: any;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    countryCode: string | null;
  };
}

interface Delivery {
  id: string;
  title: string;
  description: string | null;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  price: number;
  currency: string;
  status: string;
  departureDate: string;
  arrivalDate: string | null;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    countryCode: string | null;
  };
  receiver: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    countryCode: string | null;
  } | null;
}

interface RelatedTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  category: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [relatedTransactions, setRelatedTransactions] = useState<RelatedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactionDetails();
  }, [transactionId]);

  const fetchTransactionDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/backoffice/transactions/${transactionId}`);
      const data = await response.json();

      if (response.ok) {
        setTransaction(data.transaction);
        setDelivery(data.delivery);
        setRelatedTransactions(data.relatedTransactions || []);
      } else {
        alert('Failed to fetch transaction details');
        router.push('/backoffice/transactions');
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      alert('Failed to fetch transaction details');
      router.push('/backoffice/transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency = 'XOF') => {
    const isoCurrency = currency === 'FCFA' ? 'XOF' : currency;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: isoCurrency,
    }).format(amount).replace('XOF', 'FCFA');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <FiClock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiAlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Transaction Not Found</h2>
          <button
            onClick={() => router.push('/backoffice/transactions')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/backoffice/transactions')}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">Transaction Details</h1>
          <p className="text-slate-600 mt-1">Reference: {transaction.referenceId || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(transaction.status)}
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            transaction.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : transaction.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {transaction.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Transaction Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="w-5 h-5" />
              Transaction Overview
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-600">Type</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    transaction.type === 'credit'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type === 'credit' ? '↑ Credit' : '↓ Debit'}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Category</label>
                <p className="mt-1 text-slate-900 font-medium">{transaction.category}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Amount</label>
                <p className={`mt-1 text-2xl font-bold ${
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Date & Time</label>
                <p className="mt-1 text-slate-900">{formatDate(transaction.createdAt)}</p>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-600">Description</label>
                <p className="mt-1 text-slate-900">{transaction.description}</p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FiUser className="w-5 h-5" />
              User Information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-600">Name</label>
                <p className="mt-1">
                  <span 
                    className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                    onClick={() => router.push(`/backoffice/users/${transaction.user.id}`)}
                  >
                    {transaction.user.name || 'Not provided'}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Email</label>
                <p className="mt-1 text-slate-900">{transaction.user.email || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Phone</label>
                <p className="mt-1 text-slate-900">
                  {transaction.user.countryCode && transaction.user.phone
                    ? `${transaction.user.countryCode} ${transaction.user.phone}`
                    : 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Information (if applicable) */}
          {delivery && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FiPackage className="w-5 h-5" />
                Related Delivery
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Title</label>
                  <p className="mt-1 text-slate-900 font-medium">{delivery.title}</p>
                </div>

                {delivery.description && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Description</label>
                    <p className="mt-1 text-slate-700">{delivery.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                      <FiMapPin className="w-4 h-4" /> From
                    </label>
                    <p className="mt-1 text-slate-900">{delivery.fromCity}, {delivery.fromCountry}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                      <FiMapPin className="w-4 h-4" /> To
                    </label>
                    <p className="mt-1 text-slate-900">{delivery.toCity}, {delivery.toCountry}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Sender</label>
                    <p className="mt-1">
                      <span 
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        onClick={() => router.push(`/backoffice/users/${delivery.sender.id}`)}
                      >
                        {delivery.sender.name || delivery.sender.email}
                      </span>
                    </p>
                  </div>

                  {delivery.receiver && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">Receiver</label>
                      <p className="mt-1">
                        <span 
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => delivery.receiver && router.push(`/backoffice/users/${delivery.receiver.id}`)}
                        >
                          {delivery.receiver.name || delivery.receiver.email}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FiInfo className="w-5 h-5" />
                Additional Information
              </h2>

              <div className="space-y-2">
                {Object.entries(transaction.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm font-medium text-slate-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-slate-900">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Transactions */}
          {relatedTransactions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FiLink className="w-5 h-5" />
                Related Transactions
              </h2>

              <div className="space-y-3">
                {relatedTransactions.map((relTx) => (
                  <div
                    key={relTx.id}
                    className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                    onClick={() => router.push(`/backoffice/transactions/${relTx.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        relTx.type === 'credit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {relTx.type === 'credit' ? '↑' : '↓'} {relTx.category}
                      </span>
                      <span className={`text-sm font-bold ${
                        relTx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {relTx.type === 'credit' ? '+' : '-'}{formatCurrency(relTx.amount, relTx.currency)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">{relTx.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{relTx.user.name || relTx.user.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>

            <div className="space-y-2">
              <button
                onClick={() => router.push(`/backoffice/users/${transaction.user.id}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                View User Profile
              </button>

              {delivery && (
                <button
                  onClick={() => router.push(`/backoffice/deliveries/${delivery.id}`)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  View Delivery
                </button>
              )}

              <button
                onClick={() => router.push('/backoffice/transactions')}
                className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Back to Transactions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
