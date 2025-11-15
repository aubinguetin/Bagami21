'use client';

import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Calendar,
  Hash,
  CreditCard,
  FileText,
  Tag,
  Share2
} from 'lucide-react';
import { formatAmount } from '@/utils/currencyFormatter';
import { useT, useLocale } from '@/lib/i18n-helpers';
import { shareTransactionPDF } from '@/utils/generateTransactionPDF';
import { useState } from 'react';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  category: string;
  date: string;
  referenceId?: string;
  metadata?: any;
}

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export function TransactionDetailsModal({ isOpen, onClose, transaction }: TransactionDetailsModalProps) {
  const t = useT();
  const locale = useLocale();
  const [isSharing, setIsSharing] = useState(false);
  
  if (!isOpen || !transaction) return null;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t.walletPage('status.completed');
      case 'pending':
        return t.walletPage('status.pending');
      case 'failed':
        return t.walletPage('status.failed');
      default:
        return status;
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const labels = {
        title: t.walletPage('transactionDetails.title'),
        type: transaction.type === 'credit' ? t.walletPage('transactionDetails.received') : t.walletPage('transactionDetails.sent'),
        amount: 'Amount',
        status: 'Status',
        description: t.walletPage('transactionDetails.description'),
        category: t.walletPage('transactionDetails.category'),
        dateTime: t.walletPage('transactionDetails.dateTime'),
        transactionId: t.walletPage('transactionDetails.transactionId'),
        referenceId: t.walletPage('transactionDetails.referenceId'),
        paymentBreakdown: t.walletPage('transactionDetails.paymentBreakdown'),
        walletPayment: t.walletPage('transactionDetails.walletPayment'),
        directPayment: t.walletPage('transactionDetails.directPayment'),
        paymentMethod: t.walletPage('transactionDetails.paymentMethod'),
        additionalInfo: t.walletPage('transactionDetails.additionalInfo'),
        reason: t.walletPage('transactionDetails.reason'),
        received: t.walletPage('transactionDetails.received'),
        sent: t.walletPage('transactionDetails.sent'),
        completed: t.walletPage('status.completed'),
        pending: t.walletPage('status.pending'),
        failed: t.walletPage('status.failed'),
      };
      
      await shareTransactionPDF(transaction, labels, locale);
    } catch (error) {
      console.error('Error sharing transaction:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t.walletPage('transactionDetails.copiedToClipboard'));
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">{t.walletPage('transactionDetails.title')}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Amount Section */}
            <div className="text-center py-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {transaction.type === 'credit' ? (
                  <ArrowDownLeft className="w-8 h-8 text-green-600" />
                ) : (
                  <ArrowUpRight className="w-8 h-8 text-red-600" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                {transaction.type === 'credit' ? t.walletPage('transactionDetails.received') : t.walletPage('transactionDetails.sent')}
              </p>
              
              <p className={`text-4xl font-bold mb-2 ${
                transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'credit' ? '+' : '-'}
                {formatAmount(transaction.amount)} {transaction.currency === 'XOF' ? 'FCFA' : transaction.currency}
              </p>

              {/* Status Badge */}
              <div className="flex items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(transaction.status)}`}>
                  {getStatusIcon(transaction.status)}
                  {getStatusText(transaction.status)}
                </span>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t.walletPage('transactionDetails.detailsSection')}</h3>
              
              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">{t.walletPage('transactionDetails.description')}</p>
                    <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                  </div>
                </div>

                {/* Category */}
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">{t.walletPage('transactionDetails.category')}</p>
                    <p className="text-sm font-medium text-gray-800">{transaction.category}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">{t.walletPage('transactionDetails.dateTime')}</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(transaction.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </p>
                  </div>
                </div>

                {/* Transaction ID */}
                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">{t.walletPage('transactionDetails.transactionId')}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-gray-800 truncate">
                        {transaction.id}
                      </p>
                      <button
                        onClick={() => copyToClipboard(transaction.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        title={t.walletPage('transactionDetails.copyId')}
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reference ID */}
                {transaction.referenceId && (
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">{t.walletPage('transactionDetails.referenceId')}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono text-gray-800 truncate">
                          {transaction.referenceId}
                        </p>
                        <button
                          onClick={() => copyToClipboard(transaction.referenceId!)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                          title={t.walletPage('transactionDetails.copyReferenceId')}
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Breakdown (if available in metadata) */}
              {transaction.metadata?.paymentBreakdown && (
                <>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mt-6">{t.walletPage('transactionDetails.paymentBreakdown')}</h3>
                  <div className="bg-blue-50 rounded-xl p-4 space-y-2 border border-blue-100">
                    {transaction.metadata.paymentBreakdown.walletAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{t.walletPage('transactionDetails.walletPayment')}</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {formatAmount(transaction.metadata.paymentBreakdown.walletAmount)} FCFA
                        </span>
                      </div>
                    )}
                    {transaction.metadata.paymentBreakdown.directPaymentAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{t.walletPage('transactionDetails.directPayment')}</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {formatAmount(transaction.metadata.paymentBreakdown.directPaymentAmount)} FCFA
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Payment Method (if available in metadata) */}
              {transaction.metadata?.paymentMethod && (
                <>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mt-6">{t.walletPage('transactionDetails.paymentMethod')}</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <p className="text-sm font-medium text-gray-800 capitalize">
                        {transaction.metadata.paymentMethod.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Additional Metadata */}
              {transaction.metadata?.reason && (
                <>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mt-6">{t.walletPage('transactionDetails.additionalInfo')}</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">{t.walletPage('transactionDetails.reason')}</p>
                    <p className="text-sm text-gray-800">{transaction.metadata.reason}</p>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                {t.walletPage('transactionDetails.close')}
              </button>
              {transaction.status === 'completed' && (
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {isSharing ? (locale === 'fr' ? 'Partage...' : 'Sharing...') : t.walletPage('transactionDetails.share')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
