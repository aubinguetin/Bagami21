'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  CreditCard,
  Plus,
  Download,
  Upload,
  Filter,
  Calendar,
  Eye,
  EyeOff,
  Shield,
  AlertCircle
} from 'lucide-react';
import { formatAmount, formatCurrency } from '@/utils/currencyFormatter';
import { WithdrawModal } from '@/components/WithdrawModal';
import { AddMoneyModal } from '@/components/AddMoneyModal';
import { TransactionDetailsModal } from '@/components/TransactionDetailsModal';
import { useT, useLocale, translateDeliveryTitle } from '@/lib/i18n-helpers';

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
}

interface WalletStats {
  balance: number;
  currency: string;
  totalCredit: number;
  totalDebit: number;
  pendingAmount: number;
}

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const t = useT();
  const locale = useLocale();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletStats, setWalletStats] = useState<WalletStats>({
    balance: 0,
    currency: 'XOF',
    totalCredit: 0,
    totalDebit: 0,
    pendingAmount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [highlightedTransactionId, setHighlightedTransactionId] = useState<string | null>(null);

  // Helper function to translate transaction descriptions and categories using translation keys
  const translateTransaction = (description: string, category: string) => {
    // Translate category using t function
    const categoryTranslations: { [key: string]: string } = {
      'Delivery Payment': t.walletPage('categories.deliveryPayment'),
      'Direct Payment': t.walletPage('categories.directPayment'),
      'Platform Fee': t.walletPage('categories.platformFee'),
      'Withdrawal': t.walletPage('categories.withdrawal'),
      'Deposit': t.walletPage('categories.deposit'),
      'Refund': t.walletPage('categories.refund'),
      'Transfer': t.walletPage('categories.transfer'),
      'Top-up': t.walletPage('categories.topUp'),
      'Fee': t.walletPage('categories.fee'),
      'Service Fee': t.walletPage('categories.serviceFee'),
      'Commission': t.walletPage('categories.commission'),
      'Bonus': t.walletPage('categories.bonus'),
      'Delivery Income': t.walletPage('categories.deliveryIncome')
    };

    const translatedCategory = categoryTranslations[category] || category;

    // Try to match description patterns and use translation keys
    let translatedDescription = description;
    
    // Match: "Withdrawal rejected - Amount refunded"
    if (description.match(/^Withdrawal rejected - Amount refunded$/i)) {
      translatedDescription = t.walletPage('descriptions.withdrawalRejectedRefunded');
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Direct payment for delivery: X"
    const directPaymentDeliveryMatch = description.match(/^Direct payment for delivery:\s*(.+)$/i);
    if (directPaymentDeliveryMatch) {
      const deliveryTitle = translateDeliveryTitle(directPaymentDeliveryMatch[1], locale);
      translatedDescription = t.walletPage('descriptions.directPaymentForDelivery')
        .replace('{title}', deliveryTitle);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Wallet payment for delivery: X"
    const walletPaymentDeliveryMatch = description.match(/^Wallet payment for delivery:\s*(.+)$/i);
    if (walletPaymentDeliveryMatch) {
      const deliveryTitle = translateDeliveryTitle(walletPaymentDeliveryMatch[1], locale);
      translatedDescription = t.walletPage('descriptions.walletPaymentForDelivery')
        .replace('{title}', deliveryTitle);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Payment received for delivery: X"
    const paymentReceivedDeliveryMatch = description.match(/^Payment received for delivery:\s*(.+)$/i);
    if (paymentReceivedDeliveryMatch) {
      const deliveryTitle = translateDeliveryTitle(paymentReceivedDeliveryMatch[1], locale);
      translatedDescription = t.walletPage('descriptions.paymentReceivedForDelivery')
        .replace('{title}', deliveryTitle);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Payment for delivery: X" (legacy format, treat as wallet payment)
    const paymentForDeliveryMatch = description.match(/^Payment for delivery:\s*(.+)$/i);
    if (paymentForDeliveryMatch) {
      const deliveryTitle = translateDeliveryTitle(paymentForDeliveryMatch[1], locale);
      translatedDescription = t.walletPage('descriptions.walletPaymentForDelivery')
        .replace('{title}', deliveryTitle);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Payment received for travel offer: X"
    const paymentReceivedTravelOfferMatch = description.match(/^Payment received for travel offer:\s*(.+)$/i);
    if (paymentReceivedTravelOfferMatch) {
      const deliveryTitle = translateDeliveryTitle(paymentReceivedTravelOfferMatch[1], locale);
      translatedDescription = t.walletPage('descriptions.paymentReceivedForTravelOffer')
        .replace('{title}', deliveryTitle);
      return { description: translatedDescription, category: translatedCategory };
    }
    
    // Match: "Payment for delivery from X to Y"
    const deliveryMatch = description.match(/^Payment for delivery from (.+) to (.+)$/i);
    if (deliveryMatch) {
      translatedDescription = t.walletPage('descriptions.paymentForDeliveryFromTo')
        .replace('{from}', deliveryMatch[1])
        .replace('{to}', deliveryMatch[2]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Payment for travel offer from X to Y"
    const travelOfferMatch = description.match(/^Payment for travel offer from (.+) to (.+)$/i);
    if (travelOfferMatch) {
      translatedDescription = t.walletPage('descriptions.paymentForTravelOfferFromTo')
        .replace('{from}', travelOfferMatch[1])
        .replace('{to}', travelOfferMatch[2]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Payment for delivery offer from X to Y"
    const deliveryOfferMatch = description.match(/^Payment for delivery offer from (.+) to (.+)$/i);
    if (deliveryOfferMatch) {
      translatedDescription = t.walletPage('descriptions.paymentForDeliveryOffer')
        .replace('{from}', deliveryOfferMatch[1])
        .replace('{to}', deliveryOfferMatch[2]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Payment from X"
    const paymentFromMatch = description.match(/^Payment from (.+)$/i);
    if (paymentFromMatch) {
      translatedDescription = t.walletPage('descriptions.paymentFrom')
        .replace('{name}', paymentFromMatch[1]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Payment to X"
    const paymentToMatch = description.match(/^Payment to (.+)$/i);
    if (paymentToMatch) {
      translatedDescription = t.walletPage('descriptions.paymentTo')
        .replace('{name}', paymentToMatch[1]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Withdrawal request"
    if (description.match(/^Withdrawal request$/i)) {
      translatedDescription = t.walletPage('descriptions.withdrawalRequest');
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Withdrawal to X"
    const withdrawalToMatch = description.match(/^Withdrawal to (.+)$/i);
    if (withdrawalToMatch) {
      translatedDescription = t.walletPage('descriptions.withdrawalTo')
        .replace('{destination}', withdrawalToMatch[1]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Wallet top-up"
    if (description.match(/^Wallet top-up$/i)) {
      translatedDescription = t.walletPage('descriptions.walletTopUp');
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Wallet top-up from Bagami"
    if (description.match(/^Wallet top-up from Bagami/i)) {
      translatedDescription = t.walletPage('descriptions.walletTopUpFromBagami');
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Wallet top-up via X"
    const walletTopUpViaMatch = description.match(/^Wallet top-up via (.+)$/i);
    if (walletTopUpViaMatch) {
      translatedDescription = t.walletPage('descriptions.walletTopUpVia')
        .replace('{method}', walletTopUpViaMatch[1]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Direct payment from X"
    const directPaymentFromMatch = description.match(/^Direct payment from (.+)$/i);
    if (directPaymentFromMatch) {
      translatedDescription = t.walletPage('descriptions.directPaymentFrom')
        .replace('{name}', directPaymentFromMatch[1]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Direct payment to X"
    const directPaymentToMatch = description.match(/^Direct payment to (.+)$/i);
    if (directPaymentToMatch) {
      translatedDescription = t.walletPage('descriptions.directPaymentTo')
        .replace('{name}', directPaymentToMatch[1]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Money received from X"
    const moneyReceivedMatch = description.match(/^Money received from (.+)$/i);
    if (moneyReceivedMatch) {
      translatedDescription = t.walletPage('descriptions.moneyReceivedFrom')
        .replace('{name}', moneyReceivedMatch[1]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Money sent to X"
    const moneySentMatch = description.match(/^Money sent to (.+)$/i);
    if (moneySentMatch) {
      translatedDescription = t.walletPage('descriptions.moneySentTo')
        .replace('{name}', moneySentMatch[1]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Platform fee for X"
    const platformFeeMatch = description.match(/^Platform fee for (.+)$/i);
    if (platformFeeMatch) {
      translatedDescription = t.walletPage('descriptions.platformFeeFor')
        .replace('{item}', platformFeeMatch[1]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Refund for X"
    const refundForMatch = description.match(/^Refund for (.+)$/i);
    if (refundForMatch) {
      translatedDescription = t.walletPage('descriptions.refundFor')
        .replace('{item}', refundForMatch[1]);
      return { description: translatedDescription, category: translatedCategory };
    }

    // Match: "Service fee"
    if (description.match(/^Service fee$/i)) {
      translatedDescription = t.walletPage('descriptions.serviceFee');
      return { description: translatedDescription, category: translatedCategory };
    }

    // If no pattern matched, return original
    return { description, category: translatedCategory };
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

  // Mock data - Replace with actual API call later
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchWalletData = async () => {
      setIsLoading(true);
      
      try {
        const currentUserId = localStorage.getItem('bagami_user_id');
        const currentUserContact = localStorage.getItem('bagami_user_contact');

        const params = new URLSearchParams();
        if (currentUserId) params.set('userId', currentUserId);
        if (currentUserContact) params.set('userContact', encodeURIComponent(currentUserContact));

        const response = await fetch(`/api/wallet?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setWalletStats(data.stats);
          setTransactions(data.transactions);
        } else {
          console.error('Error fetching wallet data:', data.error);
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserVerification = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        
        if (data.success && data.user) {
          console.log('👤 User profile data:', data.user);
          console.log('📄 ID Documents:', data.user.idDocuments);
          
          // Check if user has any approved ID document
          const hasApprovedId = data.user.idDocuments?.some(
            (doc: any) => doc.verificationStatus === 'approved'
          );
          
          console.log('✅ User verification status:', hasApprovedId);
          setIsUserVerified(hasApprovedId || false);
        }
      } catch (error) {
        console.error('Error fetching user verification status:', error);
        setIsUserVerified(false);
      }
    };

    fetchWalletData();
    fetchUserVerification();
  }, [isAuthenticated]);

  // Handle transaction highlighting from URL params
  useEffect(() => {
    const transactionId = searchParams.get('transactionId');
    if (transactionId && transactions.length > 0) {
      setHighlightedTransactionId(transactionId);
      
      // Scroll to the highlighted transaction
      setTimeout(() => {
        const element = transactionRefs.current[transactionId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      // Remove highlight after 5 seconds
      setTimeout(() => {
        setHighlightedTransactionId(null);
      }, 5000);
    }
  }, [searchParams, transactions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === 'all') return true;
    return transaction.type === filterType;
  });

  const handleTransactionClick = (transaction: Transaction) => {
    // Translate the transaction before setting it
    const { description, category } = translateTransaction(transaction.description, transaction.category);
    const translatedTransaction = {
      ...transaction,
      description,
      category
    };
    setSelectedTransaction(translatedTransaction);
    setIsTransactionDetailsOpen(true);
  };

  const handleWithdrawClick = () => {
    if (!isUserVerified) {
      setShowVerificationModal(true);
    } else {
      setIsWithdrawModalOpen(true);
    }
  };

  const handleWithdraw = async (amount: number, phoneNumber: string) => {
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, phoneNumber })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process withdrawal');
      }

      const data = await response.json();

      // Refresh wallet data
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');

      const params = new URLSearchParams();
      if (currentUserId) params.set('userId', currentUserId);
      if (currentUserContact) params.set('userContact', encodeURIComponent(currentUserContact));

      const walletResponse = await fetch(`/api/wallet?${params.toString()}`);
      const walletData = await walletResponse.json();

      if (walletResponse.ok) {
        setWalletStats(walletData.stats);
        setTransactions(walletData.transactions);
      }

      // Show success message
      alert(t.walletPage('withdrawSuccess'));

    } catch (error: any) {
      throw new Error(error.message || 'Failed to process withdrawal');
    }
  };

  const handleAddMoney = async (amount: number, paymentMethod: string) => {
    try {
      const response = await fetch('/api/wallet/add-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add money to wallet');
      }

      const data = await response.json();

      // Refresh wallet data
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');

      const params = new URLSearchParams();
      if (currentUserId) params.set('userId', currentUserId);
      if (currentUserContact) params.set('userContact', encodeURIComponent(currentUserContact));

      const walletResponse = await fetch(`/api/wallet?${params.toString()}`);
      const walletData = await walletResponse.json();

      if (walletResponse.ok) {
        setWalletStats(walletData.stats);
        setTransactions(walletData.transactions);
      }

      // Show success message
      alert(t.walletPage('addMoneySuccess').replace('{amount}', formatCurrency(amount, 'XOF')));

    } catch (error: any) {
      throw new Error(error.message || 'Failed to add money to wallet');
    }
  };

  if (status === 'loading' || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t.walletPage('loading')}</p>
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
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 mx-4 flex justify-center">
              <div className="bg-white px-6 py-2 rounded-full border border-gray-300">
                <h1 className="text-base font-bold text-slate-800">{t.walletPage('title')}</h1>
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </div>
      <div className="pt-16"></div>

      <div className="px-4 sm:px-6 py-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl p-6 shadow-xl mb-4 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium">{t.walletPage('availableBalance')}</p>
                  <p className="text-xs text-white/60">FCFA</p>
                </div>
              </div>
              <button
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label={isBalanceHidden ? t.walletPage('showBalance') : t.walletPage('hideBalance')}
              >
                {isBalanceHidden ? (
                  <EyeOff className="w-5 h-5 text-white/90" />
                ) : (
                  <Eye className="w-5 h-5 text-white/90" />
                )}
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-4xl font-bold text-white mb-1">
                {isBalanceHidden 
                  ? '* * * * * *' 
                  : `${formatAmount(walletStats.balance)} FCFA`
                }
              </h2>
              {walletStats.pendingAmount > 0 && (
                <p className="text-white/70 text-xs flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {isBalanceHidden 
                      ? `* * * * * * ${t.walletPage('pending')}` 
                      : `${formatAmount(walletStats.pendingAmount)} FCFA ${t.walletPage('pending')}`
                    }
                  </span>
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setIsAddMoneyModalOpen(true)}
                className="bg-white/95 backdrop-blur-sm hover:bg-white text-orange-600 font-semibold py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">{t.walletPage('addMoney')}</span>
              </button>
              <button 
                onClick={handleWithdrawClick}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 border border-white/30 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">{t.walletPage('withdraw')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">{t.walletPage('credit')}</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {isBalanceHidden ? '* * * * * *' : formatCurrency(walletStats.totalCredit)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">{t.walletPage('debit')}</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {isBalanceHidden ? '* * * * * *' : formatCurrency(walletStats.totalDebit)}
            </p>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Transactions Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800">{t.walletPage('transactions')}</h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterType === 'all'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.walletPage('all')}
              </button>
              <button
                onClick={() => setFilterType('credit')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterType === 'credit'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.walletPage('income')}
              </button>
              <button
                onClick={() => setFilterType('debit')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterType === 'debit'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.walletPage('expenses')}
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => {
                const isHighlighted = highlightedTransactionId === transaction.id;
                const translated = translateTransaction(transaction.description, transaction.category);
                
                return (
                  <div
                    key={transaction.id}
                    ref={(el) => { transactionRefs.current[transaction.id] = el; }}
                    onClick={() => handleTransactionClick(transaction)}
                    className={`p-4 hover:bg-gray-50 transition-all cursor-pointer active:bg-gray-100 ${
                      isHighlighted 
                        ? 'border-2 border-orange-500 bg-orange-50 rounded-lg' 
                        : 'border-2 border-transparent'
                    }`}
                  >
                  <div className="flex items-center space-x-3">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'credit'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {transaction.type === 'credit' ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 mb-0.5">
                        <h4 className="font-semibold text-sm text-gray-800 truncate">
                          {translated.description}
                        </h4>
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <span className="truncate">{translated.category}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p
                        className={`font-bold text-sm ${
                          transaction.type === 'credit'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'credit' ? '+' : '-'}
                        {formatAmount(transaction.amount)} {transaction.currency === 'XOF' ? 'FCFA' : transaction.currency}
                      </p>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {t.walletPage(`status.${transaction.status}`)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
            ) : (
              // Empty state
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">
                  {t.walletPage('emptyState.title')}
                </h3>
                <p className="text-xs text-gray-600">
                  {filterType === 'all'
                    ? t.walletPage('emptyState.allMessage')
                    : filterType === 'credit' 
                    ? t.walletPage('emptyState.creditMessage')
                    : t.walletPage('emptyState.debitMessage')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-800">{t.walletPage('paymentMethods')}</h3>
            <button className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center space-x-1">
              <Plus className="w-3 h-3" />
              <span>{t.walletPage('add')}</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{t.walletPage('mobileMoney')}</p>
                <p className="text-xs text-gray-600">MTN: •••• 1234</p>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                {t.walletPage('primary')}
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{t.walletPage('orangeMoney')}</p>
                <p className="text-xs text-gray-600">•••• 5678</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        currentBalance={walletStats.balance}
        onWithdraw={handleWithdraw}
      />

      {/* ID Verification Required Modal */}
      {showVerificationModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-in fade-in duration-200"
          onClick={() => setShowVerificationModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-3xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2">{t.walletPage('verificationModal.title')}</h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                {t.walletPage('verificationModal.description')}
              </p>
              
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-orange-900 mb-1">
                      {t.walletPage('verificationModal.whatYouNeed')}
                    </p>
                    <ul className="text-xs text-orange-800 space-y-1">
                      <li>• {t.walletPage('verificationModal.requirement1')}</li>
                      <li>• {t.walletPage('verificationModal.requirement2')}</li>
                      <li>• {t.walletPage('verificationModal.requirement3')}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  {t.walletPage('verificationModal.cancel')}
                </button>
                <button
                  onClick={() => {
                    setShowVerificationModal(false);
                    router.push('/settings');
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-lg"
                >
                  {t.walletPage('verificationModal.verifyId')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={isAddMoneyModalOpen}
        onClose={() => setIsAddMoneyModalOpen(false)}
        currentBalance={walletStats.balance}
        onAddMoney={handleAddMoney}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={isTransactionDetailsOpen}
        onClose={() => setIsTransactionDetailsOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
