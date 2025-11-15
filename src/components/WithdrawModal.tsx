'use client';

import { useState } from 'react';
import { X, AlertCircle, Wallet, ArrowRight, Clock, Globe } from 'lucide-react';
import { useT } from '@/lib/i18n-helpers';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onWithdraw: (amount: number, phoneNumber: string) => Promise<void>;
}

// West African country codes
const COUNTRY_CODES = [
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+223', country: 'Mali', flag: '🇲🇱' },
  { code: '+227', country: 'Niger', flag: '🇳🇪' },
  { code: '+229', country: 'Benin', flag: '🇧🇯' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+231', country: 'Liberia', flag: '🇱🇷' },
  { code: '+232', country: 'Sierra Leone', flag: '🇸🇱' },
  { code: '+224', country: 'Guinea', flag: '🇬🇳' },
  { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: '+220', country: 'Gambia', flag: '🇬🇲' },
  { code: '+238', country: 'Cape Verde', flag: '🇨🇻' },
];

export function WithdrawModal({ isOpen, onClose, currentBalance, onWithdraw }: WithdrawModalProps) {
  const t = useT();
  const [amount, setAmount] = useState('');
  const [countryCode, setCountryCode] = useState('+226');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const withdrawAmount = parseFloat(amount);

    // Validation
    if (!withdrawAmount || withdrawAmount <= 0) {
      setError(t.walletPage('withdrawModal.errors.invalidAmount'));
      return;
    }

    if (withdrawAmount < 1000) {
      setError(t.walletPage('withdrawModal.errors.minAmount'));
      return;
    }

    if (withdrawAmount > currentBalance) {
      setError(t.walletPage('withdrawModal.errors.insufficientBalance').replace('{balance}', currentBalance.toLocaleString()));
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      setError(t.walletPage('withdrawModal.errors.phoneRequired'));
      return;
    }

    // Basic phone number validation (at least 8 digits)
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (cleanPhone.length < 8) {
      setError(t.walletPage('withdrawModal.errors.invalidPhone'));
      return;
    }

    const fullPhoneNumber = `${countryCode} ${cleanPhone}`;

    setIsProcessing(true);

    try {
      await onWithdraw(withdrawAmount, fullPhoneNumber);
      // Reset form
      setAmount('');
      setPhoneNumber('');
      setCountryCode('+226');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setAmount('');
      setPhoneNumber('');
      setCountryCode('+226');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-6 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t.walletPage('withdrawModal.title')}</h2>
                <p className="text-xs text-white/80 mt-0.5">{t.walletPage('withdrawModal.subtitle')}</p>
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
            {/* Current Balance Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">{t.walletPage('withdrawModal.availableBalance')}</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {currentBalance.toLocaleString()} <span className="text-lg">FCFA</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label htmlFor="amount" className="block text-xs font-semibold text-slate-700 mb-2">
                {t.walletPage('withdrawModal.amountLabel')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isProcessing}
                  placeholder={t.walletPage('withdrawModal.amountPlaceholder')}
                  min="1000"
                  max={currentBalance}
                  step="1"
                  className="w-full pl-4 pr-16 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  FCFA
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t.walletPage('withdrawModal.minAmountInfo')}
              </p>
            </div>

            {/* Phone Number Input with Country Code */}
            <div>
              <label htmlFor="phoneNumber" className="block text-xs font-semibold text-slate-700 mb-2">
                {t.walletPage('withdrawModal.phoneLabel')}
              </label>
              <div className="flex gap-2">
                {/* Country Code Selector */}
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={isProcessing}
                  className="w-24 px-2 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                
                {/* Phone Number Input */}
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isProcessing}
                  placeholder={t.walletPage('withdrawModal.phonePlaceholder')}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {t.walletPage('withdrawModal.phoneInfo')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 font-medium">{error}</p>
              </div>
            )}

            {/* Info Message */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-900 mb-1">{t.walletPage('withdrawModal.processingTimeTitle')}</p>
                  <p className="text-xs text-orange-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.walletPage('withdrawModal.processingTimeDesc') }} />
                </div>
              </div>
              
              <div className="flex items-start gap-2 pt-2 border-t border-orange-200">
                <Globe className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-900 mb-1">{t.walletPage('withdrawModal.internationalTitle')}</p>
                  <p className="text-xs text-orange-800 leading-relaxed">
                    {t.walletPage('withdrawModal.internationalDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
            >
              {t.walletPage('withdrawModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-lg shadow-orange-200"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t.walletPage('withdrawModal.processing')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t.walletPage('withdrawModal.request')}
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
