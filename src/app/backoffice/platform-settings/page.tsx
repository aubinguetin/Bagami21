'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiSettings,
  FiSave,
  FiRefreshCw,
  FiPercent,
  FiDollarSign,
  FiInfo,
  FiAlertCircle,
} from 'react-icons/fi';

export default function PlatformSettingsPage() {
  const router = useRouter();
  const [commissionRate, setCommissionRate] = useState<string>('17.5');
  const [originalRate, setOriginalRate] = useState<string>('17.5');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/backoffice/platform-settings', {
        cache: 'no-store', // Disable caching
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      
      console.log('Fetched settings:', data);
      
      if (response.ok) {
        const rate = data.settings?.commission_rate?.value || '0.175';
        console.log('Commission rate from DB:', rate);
        const ratePercent = (parseFloat(rate) * 100).toString();
        console.log('Commission rate as percentage:', ratePercent);
        setCommissionRate(ratePercent);
        setOriginalRate(ratePercent);
      } else {
        setError(data.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    // Validate rate
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Commission rate must be between 0 and 100');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/backoffice/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'commission_rate',
          value: (rate / 100).toString(), // Convert percentage to decimal
          description: 'Platform commission rate applied to transactions'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Commission rate updated successfully!');
        setOriginalRate(commissionRate);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = commissionRate !== originalRate;

  // Calculate example amounts
  const exampleAmount = 100000;
  const rate = parseFloat(commissionRate) || 0;
  const feeAmount = Math.floor(exampleAmount * (rate / 100));
  const netAmount = exampleAmount - feeAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-slate-600 mt-1">Configure platform commission rates and fees</p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <FiSettings className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-green-900">Success</h3>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* Commission Rate Setting */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FiPercent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Commission Rate</h2>
              <p className="text-blue-100 text-sm">Platform fee applied to all transactions</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">How Commission Works</p>
              <p>
                The commission rate is the percentage of each transaction that the platform takes as a fee. 
                This fee is deducted from the amount the service provider (traveler) receives. 
                Any changes to this rate will apply immediately to all new transactions.
              </p>
            </div>
          </div>

          {/* Rate Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Commission Rate (%)
            </label>
            <div className="relative max-w-md">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                disabled={isLoading || isSaving}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="17.5"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                %
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Enter a value between 0 and 100. Decimal values are supported (e.g., 17.5).
            </p>
          </div>

          {/* Example Calculation */}
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="w-4 h-4" />
              Example Calculation
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Transaction Amount (Paid by sender):</span>
                <span className="text-sm font-semibold text-slate-900">
                  {exampleAmount.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Platform Fee ({rate.toFixed(1)}%):</span>
                <span className="text-sm font-semibold text-orange-600">
                  - {feeAmount.toLocaleString()} FCFA
                </span>
              </div>
              <div className="pt-3 border-t border-slate-300 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Received by Service Provider:</span>
                <span className="text-lg font-bold text-green-600">
                  {netAmount.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Warning for Changes */}
          {hasChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">Unsaved Changes</p>
                <p>
                  You have unsaved changes. Click "Save Changes" to apply the new commission rate. 
                  This will affect all new transactions immediately after saving.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={!hasChanges || isLoading || isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={() => setCommissionRate(originalRate)}
              disabled={!hasChanges || isLoading || isSaving}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Current Settings Display */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Current Commission Rate</p>
            <p className="text-2xl font-bold text-blue-600">{originalRate}%</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Decimal Value</p>
            <p className="text-2xl font-bold text-slate-900">
              {(parseFloat(originalRate) / 100).toFixed(3)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
