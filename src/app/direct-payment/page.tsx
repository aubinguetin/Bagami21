'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  ArrowRight, 
  Wallet, 
  AlertCircle,
  Info
} from 'lucide-react';
import { useT, useLocale } from '@/lib/i18n-helpers';
import { formatAmount } from '@/utils/currencyFormatter';

type PaymentMethod = 'mobile_money' | 'card' | 'bank_transfer';

export default function DirectPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { directPayment } = useT();
  const locale = useLocale();

  const conversationId = searchParams.get('conversationId');
  const requiredAmount = parseFloat(searchParams.get('required') || '0');
  const currentBalance = parseFloat(searchParams.get('balance') || '0');
  const currency = searchParams.get('currency') || 'XOF';

  const shortfall = requiredAmount - currentBalance;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mobile_money');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Validate parameters
    if (!conversationId || requiredAmount <= 0) {
      alert(directPayment('errors.invalidParameters'));
      router.back();
    }
  }, [conversationId, requiredAmount, router, directPayment]);

  const paymentMethods = [
    {
      id: 'mobile_money' as PaymentMethod,
      name: directPayment('selectMethod.mobileMoney.name'),
      description: directPayment('selectMethod.mobileMoney.description'),
      icon: Smartphone,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      id: 'card' as PaymentMethod,
      name: directPayment('selectMethod.card.name'),
      description: directPayment('selectMethod.card.description'),
      icon: CreditCard,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      id: 'bank_transfer' as PaymentMethod,
      name: directPayment('selectMethod.bankTransfer.name'),
      description: directPayment('selectMethod.bankTransfer.description'),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const handlePayment = async () => {
    setError('');
    setIsProcessing(true);

    try {
      // TODO: Replace with actual payment gateway integration
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to payment summary page to complete the transaction
      router.push(`/payment-summary/${conversationId}?directPaymentCompleted=true&method=${selectedMethod}&amount=${shortfall}`);
    } catch (err: any) {
      setError(err.message || directPayment('errors.paymentFailed'));
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatAmount(amount);
  };

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Header */}
      <div className="bg-transparent sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-300 text-gray-700 transition-all hover:scale-105 hover:border-gray-400"
              disabled={isProcessing}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 mx-4 flex justify-center">
              <div className="bg-white px-6 py-2 rounded-full border border-gray-300">
                <h1 className="text-base font-semibold text-gray-900">{directPayment('title')}</h1>
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Payment Breakdown Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{directPayment('paymentBreakdown.title')}</h2>
                  <p className="text-white/90 text-sm">{directPayment('paymentBreakdown.subtitle')}</p>
                </div>
              </div>
            </div>

            {/* Breakdown Details */}
            <div className="p-6 space-y-5">
              {/* Required Amount */}
              <div className="flex items-center justify-between pb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{directPayment('paymentBreakdown.totalRequired')}</p>
                  <p className="text-sm text-gray-500">{directPayment('paymentBreakdown.totalRequiredDesc')}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(requiredAmount)} FCFA</p>
                </div>
              </div>

              <div className="border-t border-gray-200"></div>

              {/* Current Balance */}
              <div className="flex items-center justify-between pb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{directPayment('paymentBreakdown.yourBalance')}</p>
                  <p className="text-sm text-gray-500">{directPayment('paymentBreakdown.yourBalanceDesc')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xg font-bold text-blue-600">-{formatCurrency(currentBalance)} FCFA</p>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300"></div>

              {/* Shortfall - Amount to Pay */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-orange-900 mb-1">{directPayment('paymentBreakdown.amountToPay')}</p>
                    <p className="text-xs text-orange-700">{directPayment('paymentBreakdown.amountToPayDesc')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">{formatCurrency(shortfall)} FCFA</p>
                  </div>
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 flex-1">
                  <p className="font-semibold mb-1">{directPayment('howItWorks.title')}</p>
                  <ul className="space-y-1 text-blue-700 list-disc list-inside">
                    <li>{directPayment('howItWorks.step1').replace('{balance}', formatCurrency(currentBalance) + ' FCFA')}</li>
                    <li>{directPayment('howItWorks.step2').replace('{shortfall}', formatCurrency(shortfall) + ' FCFA')}</li>
                    <li>{directPayment('howItWorks.step3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{directPayment('selectMethod.title')}</h3>
            
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    onClick={() => !isProcessing && setSelectedMethod(method.id)}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                      selectedMethod === method.id
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Icon */}
                      <div className={`bg-gradient-to-br ${method.color} p-3 rounded-xl text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-xs text-gray-500">{method.description}</p>
                      </div>

                      {/* Radio indicator */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedMethod === method.id
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedMethod === method.id && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800 flex-1">
              <p className="font-semibold mb-1">{directPayment('notices.gatewayPending.title')}</p>
              <p className="text-yellow-700">
                {directPayment('notices.gatewayPending.message')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 sticky bottom-0 bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
            <button
              onClick={() => router.back()}
              disabled={isProcessing}
              className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {directPayment('buttons.cancel')}
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium text-sm transition-all hover:shadow-lg shadow-orange-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{directPayment('buttons.processing')}</span>
                </>
              ) : (
                <>
                  <span>{directPayment('buttons.pay').replace('{amount}', formatCurrency(shortfall) + ' FCFA')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
