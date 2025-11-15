'use client';

import { useState } from 'react';
import { X, AlertCircle, Wallet, ArrowRight, CreditCard, Smartphone, DollarSign } from 'lucide-react';
import { useT } from '@/lib/i18n-helpers';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onAddMoney: (amount: number, method: string) => Promise<void>;
}

export function AddMoneyModal({ isOpen, onClose, currentBalance, onAddMoney }: AddMoneyModalProps) {
  const t = useT();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('mobile_money');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Payment methods (for display only - actual integration later)
  const PAYMENT_METHODS = [
    { 
      id: 'mobile_money', 
      name: t.walletPage('addMoneyModal.mobileMoney'), 
      icon: Smartphone, 
      description: t.walletPage('addMoneyModal.mobileMoneyDesc') 
    },
    { 
      id: 'card', 
      name: t.walletPage('addMoneyModal.cardPayment'), 
      icon: CreditCard, 
      description: t.walletPage('addMoneyModal.cardPaymentDesc') 
    },
    { 
      id: 'bank_transfer', 
      name: t.walletPage('addMoneyModal.bankTransfer'), 
      icon: DollarSign, 
      description: t.walletPage('addMoneyModal.bankTransferDesc') 
    },
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const addAmount = parseFloat(amount);

    // Validation
    if (!addAmount || addAmount <= 0) {
      setError(t.walletPage('addMoneyModal.errors.invalidAmount'));
      return;
    }

    if (addAmount < 100) {
      setError(t.walletPage('addMoneyModal.errors.minAmount'));
      return;
    }

    if (addAmount > 10000000) {
      setError(t.walletPage('addMoneyModal.errors.maxAmount'));
      return;
    }

    setIsProcessing(true);

    try {
      await onAddMoney(addAmount, selectedMethod);
      // Reset form
      setAmount('');
      setSelectedMethod('mobile_money');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add money');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setAmount('');
      setSelectedMethod('mobile_money');
      setError('');
      onClose();
    }
  };

  // Quick amount buttons
  const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 p-6 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t.walletPage('addMoneyModal.title')}</h2>
                <p className="text-xs text-white/80 mt-0.5">{t.walletPage('addMoneyModal.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="text-white/90 hover:text-white hover:bg-white/10 rounded-lg p-2 transition disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Amount Input */}
            <div>
              <label htmlFor="amount" className="block text-xs font-semibold text-slate-700 mb-2">
                {t.walletPage('addMoneyModal.amountLabel')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isProcessing}
                  placeholder={t.walletPage('addMoneyModal.amountPlaceholder')}
                  min="100"
                  max="10000000"
                  step="1"
                  className="w-full pl-4 pr-16 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  FCFA
                </span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">{t.walletPage('addMoneyModal.quickSelect')}</p>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    disabled={isProcessing}
                    className="px-3 py-2 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(quickAmount / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">{t.walletPage('addMoneyModal.paymentMethodLabel')}</p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={isProcessing}
                      className={`w-full p-3 rounded-xl border-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedMethod === method.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedMethod === method.id ? 'bg-green-500' : 'bg-slate-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            selectedMethod === method.id ? 'text-white' : 'text-slate-600'
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-semibold ${
                            selectedMethod === method.id ? 'text-green-900' : 'text-slate-900'
                          }`}>
                            {method.name}
                          </p>
                          <p className="text-xs text-slate-500">{method.description}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedMethod === method.id
                            ? 'border-green-500 bg-green-500'
                            : 'border-slate-300'
                        }`}>
                          {selectedMethod === method.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
            >
              {t.walletPage('addMoneyModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-lg shadow-green-200"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t.walletPage('addMoneyModal.processing')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t.walletPage('addMoneyModal.addMoney')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
