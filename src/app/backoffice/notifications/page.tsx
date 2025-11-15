'use client';

import { useState, useEffect } from 'react';
import { 
  FiBell, 
  FiSend, 
  FiUsers, 
  FiX,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  idVerificationStatus: 'pending' | 'approved' | 'rejected' | null;
  transactionCount: number;
  lastActivityAt: string | null;
}

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch users when user selection is shown
  useEffect(() => {
    if (showUserSelection && users.length === 0) {
      fetchUsers();
    }
  }, [showUserSelection]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.includes(searchQuery)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    // Verification filter
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.idVerificationStatus === verificationFilter
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, statusFilter, verificationFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backoffice/users/list');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filteredUsers.map(u => u.id);
    setSelectedUsers(allFilteredIds);
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const handleSendNotification = async () => {
    // Validation
    if (!title.trim()) {
      setErrorMessage('Please enter a notification title');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Please enter a notification message');
      return;
    }
    if (!sendToAll && selectedUsers.length === 0) {
      setErrorMessage('Please select at least one user or choose "Send to all users"');
      return;
    }

    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/backoffice/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          link: link.trim() || null,
          sendToAll,
          userIds: sendToAll ? null : selectedUsers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Notification sent successfully to ${data.count} user${data.count !== 1 ? 's' : ''}!`);
        // Reset form
        setTitle('');
        setMessage('');
        setLink('');
        setSendToAll(true);
        setSelectedUsers([]);
        setShowUserSelection(false);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setErrorMessage('An error occurred while sending the notification');
    } finally {
      setIsSending(false);
    }
  };

  const getVerificationBadge = (status: string | null) => {
    if (!status || status === 'pending') {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    }
    if (status === 'approved') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Verified</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
  };

  const getActivityStatus = (lastActivityAt: string | null) => {
    if (!lastActivityAt) return 'Never';
    
    const now = new Date();
    const lastActivity = new Date(lastActivityAt);
    const diffInHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return new Date(lastActivityAt).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiBell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Send Notification</h1>
            <p className="text-sm text-slate-600">Send notifications to users</p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{errorMessage}</p>
          <button onClick={() => setErrorMessage('')} className="ml-auto">
            <FiX className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}

      {/* Notification Form */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notification Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
          <p className="text-xs text-slate-500 mt-1">{title.length}/100 characters</p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message"
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={500}
          />
          <p className="text-xs text-slate-500 mt-1">{message.length}/500 characters</p>
        </div>

        {/* Link (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Link (Optional)
          </label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="e.g., /deliveries, /wallet, https://example.com"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-1">Users will be redirected here when clicking the notification</p>
        </div>

        {/* Recipient Selection */}
        <div className="border-t border-slate-200 pt-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Recipients <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-3">
            {/* Send to All */}
            <label className="flex items-center gap-3 p-4 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition">
              <input
                type="radio"
                checked={sendToAll}
                onChange={() => {
                  setSendToAll(true);
                  setShowUserSelection(false);
                }}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900">Send to all users</div>
                <div className="text-sm text-slate-600">Notification will be sent to all registered users</div>
              </div>
            </label>

            {/* Send to Specific Users */}
            <label className="flex items-center gap-3 p-4 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition">
              <input
                type="radio"
                checked={!sendToAll}
                onChange={() => {
                  setSendToAll(false);
                  setShowUserSelection(true);
                }}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900">Send to specific users</div>
                <div className="text-sm text-slate-600">Select individual users to receive the notification</div>
              </div>
              {!sendToAll && selectedUsers.length > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {selectedUsers.length} selected
                </span>
              )}
            </label>
          </div>
        </div>

        {/* User Selection Panel */}
        {showUserSelection && (
          <div className="border border-slate-300 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FiUsers className="w-5 h-5" />
                Select Users
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllFiltered}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  Select All ({filteredUsers.length})
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {/* Verification Filter */}
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Verification Status</option>
                <option value="approved">Verified Only</option>
                <option value="pending">Pending Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>

            {/* User List */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-slate-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-600">
                  No users found matching your filters
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={(e) => e.target.checked ? selectAllFiltered() : clearSelection()}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">ID Verification</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Activity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Joined</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Transactions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredUsers.map((user) => (
                        <tr 
                          key={user.id}
                          className={`hover:bg-slate-50 cursor-pointer ${
                            selectedUsers.includes(user.id) ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => toggleUserSelection(user.id)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              className="w-4 h-4 text-blue-600 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {user.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            <div>{user.email || 'N/A'}</div>
                            <div className="text-xs text-slate-500">{user.phone || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-3">
                            {user.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                <FiCheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                <FiXCircle className="w-3 h-3" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {getVerificationBadge(user.idVerificationStatus)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {getActivityStatus(user.lastActivityAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {user.transactionCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="border-t border-slate-200 pt-6 flex justify-end">
          <button
            onClick={handleSendNotification}
            disabled={isSending}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            <FiSend className="w-5 h-5" />
            {isSending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </div>
    </div>
  );
}
