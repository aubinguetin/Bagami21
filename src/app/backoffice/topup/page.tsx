'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FiPlusCircle, 
  FiUsers, 
  FiDollarSign, 
  FiCheckCircle,
  FiX,
  FiSearch,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  wallet?: {
    balance: number;
    currency: string;
  };
}

export default function TopUpPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState('');

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/backoffice/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
          setFilteredUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.name?.toLowerCase().includes(query) || 
      user.email?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (selectedUsers.size === 0) {
      setError('Please select at least one user');
      return;
    }

    const topUpAmount = parseFloat(amount);
    if (!topUpAmount || topUpAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (topUpAmount > 10000000) {
      setError('Amount cannot exceed 10,000,000 FCFA');
      return;
    }

    if (!reason.trim()) {
      setError('Please enter a reason for this top-up');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/backoffice/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          amount: topUpAmount,
          reason: reason.trim(),
          adminId: session?.user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process top-up');
      }

      const result = await response.json();

      // Show success message
      setShowSuccessMessage(true);
      
      // Reset form
      setSelectedUsers(new Set());
      setAmount('');
      setReason('');
      
      // Refresh users to show updated balances
      const usersResponse = await fetch('/api/backoffice/users');
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

    } catch (err: any) {
      setError(err.message || 'Failed to process top-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl">
              <FiPlusCircle className="w-8 h-8 text-white" />
            </div>
            Wallet Top-up
          </h1>
          <p className="text-slate-600 mt-2">
            Add funds to user wallets
          </p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">Top-up Successful!</h3>
            <p className="text-sm text-green-700 mt-1">
              Successfully topped up {selectedUsers.size} user wallet{selectedUsers.size > 1 ? 's' : ''} with {formatCurrency(parseFloat(amount) || 0)}
            </p>
          </div>
          <button onClick={() => setShowSuccessMessage(false)} className="text-green-600 hover:text-green-800">
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Top-up Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="w-5 h-5 text-green-600" />
              Top-up Details
            </h2>

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (FCFA)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  min="1"
                  max="10000000"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Maximum: 10,000,000 FCFA per transaction
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for top-up"
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Selected Users Count */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">Selected Users</span>
                  <span className="text-2xl font-bold text-green-600">{selectedUsers.size}</span>
                </div>
                {selectedUsers.size > 0 && amount && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-xs text-green-700">
                      Total: <span className="font-bold">{formatCurrency(parseFloat(amount) * selectedUsers.size)}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedUsers.size === 0 || !amount || !reason}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-5 h-5" />
                    Confirm Top-up
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Users List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Search & Select All */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Select All */}
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FiCheck className="w-4 h-4" />
                  {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <FiUsers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">
                    {searchQuery ? 'No users found matching your search' : 'No users available'}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUsers.has(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected 
                            ? 'bg-green-600 border-green-600' 
                            : 'border-slate-300'
                        }`}>
                          {isSelected && <FiCheck className="w-3.5 h-3.5 text-white" />}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{user.name}</h3>
                          <p className="text-sm text-slate-500 truncate">{user.email}</p>
                        </div>

                        {/* Wallet Balance */}
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-600">Current Balance</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(user.wallet?.balance || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
