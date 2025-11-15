import { useRouter } from 'next/navigation';
import { X, Package, Plane } from 'lucide-react';
import { useT } from '@/lib/i18n-helpers';

interface PostTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostTypeSelectionModal({ isOpen, onClose }: PostTypeSelectionModalProps) {
  const router = useRouter();
  const { postTypeModal: t } = useT();

  if (!isOpen) return null;

  const handleDeliveryRequest = () => {
    onClose();
    router.push('/deliveries/new-request');
  };

  const handleTravelOffer = () => {
    onClose();
    router.push('/deliveries/new-offer');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-r from-orange-500 to-blue-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{t('title')}</h2>
              <p className="text-white/80 text-sm">{t('subtitle')}</p>
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
        <div className="p-6 space-y-4">
          {/* Delivery Request Option */}
          <button
            onClick={handleDeliveryRequest}
            className="w-full p-5 rounded-xl border-2 border-orange-200 hover:border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg text-gray-800 mb-1">{t('requestTitle')}</h3>
                <p className="text-sm text-gray-600">
                  {t('requestSubtitle')}
                </p>
              </div>
            </div>
          </button>

          {/* Travel Offer Option */}
          <button
            onClick={handleTravelOffer}
            className="w-full p-5 rounded-xl border-2 border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plane className="w-7 h-7 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg text-gray-800 mb-1">{t('offerTitle')}</h3>
                <p className="text-sm text-gray-600">
                  {t('offerSubtitle')}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
