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
  FiPhone,
  FiInfo,
  FiShield,
  FiRefreshCw,
} from 'react-icons/fi';

interface WithdrawalDetail {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  category: string;
  referenceId?: string;
  metadata?: {
    phoneNumber?: string;
    requestedAt?: string;
    withdrawalType?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;
  };
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    countryCode: string | null;
  };
}

interface Wallet {
  balance: number;
  currency: string;
}

interface RefundTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
}

interface AdminLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export default function WithdrawalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const withdrawalId = params.id as string;

  const [withdrawal, setWithdrawal] = useState<WithdrawalDetail | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [refundTransaction, setRefundTransaction] = useState<RefundTransaction | null>(null);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawalDetails();
  }, [withdrawalId]);

  const fetchWithdrawalDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/backoffice/withdrawals/${withdrawalId}/details`);
      const data = await response.json();

      if (response.ok) {
        setWithdrawal(data.withdrawal);
        setWallet(data.wallet);
        setRefundTransaction(data.refundTransaction);
        setAdminLogs(data.adminLogs || []);
      } else {
        alert('Failed to fetch withdrawal details');
        router.push('/backoffice/withdrawals');
      }
    } catch (error) {
      console.error('Error fetching withdrawal details:', error);
      alert('Failed to fetch withdrawal details');
      router.push('/backoffice/withdrawals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this withdrawal request?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/backoffice/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Withdrawal approved successfully!');
        fetchWithdrawalDetails();
      } else {
        const error = await response.json();
        alert(`Failed to approve withdrawal: ${error.error}`);
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Failed to approve withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/backoffice/withdrawals/${withdrawalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert('Withdrawal rejected successfully!');
        fetchWithdrawalDetails();
      } else {
        const error = await response.json();
        alert(`Failed to reject withdrawal: ${error.error}`);
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Failed to reject withdrawal');
    } finally {
      setIsProcessing(false);
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
        return <FiCheckCircle className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <FiClock className="w-6 h-6 text-yellow-500" />;
      case 'failed':
        return <FiXCircle className="w-6 h-6 text-red-500" />;
      default:
        return <FiAlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Approved';
      case 'failed':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading withdrawal details...</p>
        </div>
      </div>
    );
  }

  if (!withdrawal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Withdrawal Not Found</h2>
          <button
            onClick={() => router.push('/backoffice/withdrawals')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Withdrawals
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
          onClick={() => router.push('/backoffice/withdrawals')}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">Withdrawal Request Details</h1>
          <p className="text-slate-600 mt-1">Reference: {withdrawal.referenceId || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusIcon(withdrawal.status)}
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
            withdrawal.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : withdrawal.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {getStatusLabel(withdrawal.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Withdrawal Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="w-5 h-5" />
              Withdrawal Overview
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-600">Amount</label>
                <p className="mt-1 text-3xl font-bold text-red-600">
                  -{formatCurrency(withdrawal.amount, withdrawal.currency)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Request Date</label>
                <p className="mt-1 text-slate-900 font-medium">{formatDate(withdrawal.createdAt)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Withdrawal Method</label>
                <p className="mt-1 text-slate-900 capitalize">
                  {withdrawal.metadata?.withdrawalType || 'Mobile Money'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Phone Number</label>
                <p className="mt-1 text-slate-900 flex items-center gap-2">
                  <FiPhone className="w-4 h-4" />
                  {withdrawal.metadata?.phoneNumber || 'Not provided'}
                </p>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-600">Description</label>
                <p className="mt-1 text-slate-900">{withdrawal.description}</p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FiUser className="w-5 h-5" />
              User Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Name</label>
                <p className="mt-1">
                  <span 
                    className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium text-lg"
                    onClick={() => router.push(`/backoffice/users/${withdrawal.user.id}`)}
                  >
                    {withdrawal.user.name || 'Not provided'}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Email</label>
                <p className="mt-1 text-slate-900">{withdrawal.user.email || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">Phone</label>
                <p className="mt-1 text-slate-900">
                  {withdrawal.user.countryCode && withdrawal.user.phone
                    ? `${withdrawal.user.countryCode} ${withdrawal.user.phone}`
                    : 'Not provided'}
                </p>
              </div>

              {wallet && (
                <div className="pt-4 border-t border-slate-200">
                  <label className="text-sm font-medium text-slate-600">Current Wallet Balance</label>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatCurrency(wallet.balance, wallet.currency)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions History */}
          {adminLogs.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FiShield className="w-5 h-5" />
                Admin Actions History
              </h2>

              <div className="space-y-3">
                {adminLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-slate-900 capitalize">{log.action}</span>
                      <span className="text-xs text-slate-500">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{log.details}</p>
                    <p className="text-xs text-slate-600">
                      By: <span className="font-medium">{log.admin.name || log.admin.email}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Info */}
          {withdrawal.status === 'failed' && withdrawal.metadata?.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                <FiXCircle className="w-5 h-5" />
                Rejection Information
              </h2>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-red-800">Reason</label>
                  <p className="mt-1 text-red-900">{withdrawal.metadata.rejectionReason}</p>
                </div>
                {withdrawal.metadata.rejectedAt && (
                  <div>
                    <label className="text-sm font-medium text-red-800">Rejected At</label>
                    <p className="mt-1 text-red-900">{formatDate(withdrawal.metadata.rejectedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Refund Transaction */}
          {refundTransaction && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                <FiRefreshCw className="w-5 h-5" />
                Refund Transaction
              </h2>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-green-800">Amount Refunded</label>
                  <p className="mt-1 text-xl font-bold text-green-900">
                    +{formatCurrency(refundTransaction.amount, refundTransaction.currency)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Refund Date</label>
                  <p className="mt-1 text-green-900">{formatDate(refundTransaction.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Description</label>
                  <p className="mt-1 text-green-900">{refundTransaction.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Approval Info */}
          {withdrawal.status === 'completed' && withdrawal.metadata?.approvedAt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5" />
                Approval Information
              </h2>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-green-800">Approved At</label>
                  <p className="mt-1 text-green-900">{formatDate(withdrawal.metadata.approvedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {withdrawal.status === 'pending' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Actions</h2>

              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  <FiCheckCircle className="w-5 h-5" />
                  {isProcessing ? 'Processing...' : 'Approve Withdrawal'}
                </button>

                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  <FiXCircle className="w-5 h-5" />
                  Reject Withdrawal
                </button>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Approving will complete the withdrawal. Rejecting will refund the amount to the user's wallet.
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h2>

            <div className="space-y-2">
              <button
                onClick={() => router.push(`/backoffice/users/${withdrawal.user.id}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                View User Profile
              </button>

              <button
                onClick={() => router.push(`/backoffice/transactions?user=${withdrawal.userId}`)}
                className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
              >
                View User Transactions
              </button>

              <button
                onClick={() => router.push('/backoffice/withdrawals')}
                className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
              >
                Back to Withdrawals
              </button>
            </div>
          </div>

          {/* Additional Metadata */}
          {withdrawal.metadata && Object.keys(withdrawal.metadata).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FiInfo className="w-5 h-5" />
                Additional Details
              </h2>

              <div className="space-y-2">
                {Object.entries(withdrawal.metadata)
                  .filter(([key]) => !['rejectionReason', 'rejectedAt', 'approvedAt', 'approvedBy', 'rejectedBy'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-xs font-medium text-slate-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-xs text-slate-900">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
