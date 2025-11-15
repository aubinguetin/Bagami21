import { useRouter } from 'next/navigation';
import { X, Wallet, AlertCircle } from 'lucide-react';
import { useT } from '@/lib/i18n-helpers';
import { formatAmount } from '@/utils/currencyFormatter';

interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount: number;
  currentBalance: number;
  currency: string;
  onPayDirectly?: () => void;
}

export function InsufficientBalanceModal({
  isOpen,
  onClose,
  requiredAmount,
  currentBalance,
  currency,
  onPayDirectly
}: InsufficientBalanceModalProps) {
  const router = useRouter();
  const { insufficientBalance } = useT();

  if (!isOpen) return null;

  const shortfall = requiredAmount - currentBalance;

  const handleGoToWallet = () => {
    onClose();
    router.push('/wallet');
  };

  const handlePayDirectly = () => {
    onClose();
    if (onPayDirectly) {
      onPayDirectly();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{insufficientBalance('title')}</h2>
                <p className="text-white/90 text-sm">{insufficientBalance('subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Balance Info */}
          <div className="bg-red-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{insufficientBalance('requiredAmount')}</span>
              <span className="text-lg font-bold text-gray-900">
                {formatAmount(requiredAmount)} {currency}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{insufficientBalance('currentBalance')}</span>
              <span className="text-lg font-semibold text-red-600">
                {formatAmount(currentBalance)} {currency}
              </span>
            </div>
            <div className="border-t border-red-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{insufficientBalance('shortfall')}</span>
                <span className="text-xl font-bold text-red-600">
                  -{formatAmount(shortfall)} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <Wallet className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">{insufficientBalance('howItWorks.title')}</p>
                <ul className="text-blue-700 text-xs leading-relaxed space-y-1 list-disc list-inside">
                  <li>{insufficientBalance('howItWorks.step1').replace('{balance}', formatAmount(currentBalance)).replace('{currency}', currency)}</li>
                  <li>{insufficientBalance('howItWorks.step2').replace('{shortfall}', formatAmount(shortfall)).replace('{currency}', currency)}</li>
                  <li>{insufficientBalance('howItWorks.step3')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handlePayDirectly}
              className="px-4 py-3 border-2 border-orange-500 text-orange-600 rounded-xl hover:bg-orange-50 transition-all font-medium flex items-center justify-center space-x-2"
            >
              <span>{insufficientBalance('buttons.payDirectly')}</span>
            </button>
            <button
              onClick={handleGoToWallet}
              className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium transition-all hover:shadow-lg shadow-orange-200 flex items-center justify-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>{insufficientBalance('buttons.goToWallet')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
