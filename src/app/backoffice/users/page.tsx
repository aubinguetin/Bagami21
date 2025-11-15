'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  FiSearch, 
  FiFilter, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar,
  FiShield,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  countryCode: string | null;
  role: string;
  isActive: boolean;
  emailVerified: Date | null;
  phoneVerified: Date | null;
  createdAt: Date;
  country: string | null;
  gender: string | null;
  idVerificationStatus: 'not_verified' | 'pending' | 'verified' | 'rejected';
  _count: {
    sentDeliveries: number;
    receivedDeliveries: number;
    transactions: number;
  };
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  admins: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVerification, setFilterVerification] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, searchTerm, filterRole, filterStatus, filterVerification, filterDateFrom, filterDateTo, sortField, sortOrder]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortField,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterVerification !== 'all' && { verification: filterVerification }),
        ...(filterDateFrom && { dateFrom: filterDateFrom }),
        ...(filterDateTo && { dateTo: filterDateTo }),
      });

      const response = await fetch(`/api/backoffice/users?${params}`);
      const data = await response.json();
      
      if (data.users) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/backoffice/users/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    if (!confirm(`Are you sure you want to ${suspend ? 'suspend' : 'activate'} this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/backoffice/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !suspend }),
      });

      if (response.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleExportUsers = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        limit: '10000',
        sortField,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterVerification !== 'all' && { verification: filterVerification }),
        ...(filterDateFrom && { dateFrom: filterDateFrom }),
        ...(filterDateTo && { dateTo: filterDateTo }),
      });

      const response = await fetch(`/api/backoffice/users?${params}`);
      const data = await response.json();
      
      if (data.users) {
        // Prepare data for Excel
        const excelData = data.users.map((user: User) => ({
          'User ID': user.id,
          'Name': user.name || 'N/A',
          'Email': user.email || 'N/A',
          'Email Verified': user.emailVerified ? 'Yes' : 'No',
          'Phone': user.phone ? `${user.countryCode || ''}${user.phone}` : 'N/A',
          'Phone Verified': user.phoneVerified ? 'Yes' : 'No',
          'Country': user.country || 'N/A',
          'Gender': user.gender || 'N/A',
          'Role': user.role,
          'Account Status': user.isActive ? 'Active' : 'Suspended',
          'ID Verification': user.idVerificationStatus === 'verified' ? 'Verified' 
            : user.idVerificationStatus === 'pending' ? 'Pending'
            : user.idVerificationStatus === 'rejected' ? 'Rejected'
            : 'Not Verified',
          'Deliveries Sent': user._count.sentDeliveries,
          'Deliveries Received': user._count.receivedDeliveries,
          'Transactions': user._count.transactions,
          'Joined Date': new Date(user.createdAt).toLocaleDateString(),
        }));

        // Create worksheet and workbook
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Auto-size columns
        const colWidths = [
          { wch: 30 }, // User ID
          { wch: 20 }, // Name
          { wch: 25 }, // Email
          { wch: 15 }, // Email Verified
          { wch: 20 }, // Phone
          { wch: 15 }, // Phone Verified
          { wch: 15 }, // Country
          { wch: 10 }, // Gender
          { wch: 12 }, // Role
          { wch: 15 }, // Account Status
          { wch: 15 }, // ID Verification
          { wch: 15 }, // Deliveries Sent
          { wch: 18 }, // Deliveries Received
          { wch: 15 }, // Transactions
          { wch: 15 }, // Joined Date
        ];
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');

        // Generate filename with current date and filters
        let filename = `users_${new Date().toISOString().split('T')[0]}`;
        if (filterRole !== 'all') filename += `_${filterRole}`;
        if (filterStatus !== 'all') filename += `_${filterStatus}`;
        if (filterVerification !== 'all') filename += `_${filterVerification}`;
        if (filterDateFrom || filterDateTo) filename += '_date_filtered';
        filename += '.xlsx';

        // Download file
        XLSX.writeFile(wb, filename);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Failed to export users. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc order
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">Manage and monitor user accounts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportUsers}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </button>
          <button
            onClick={() => fetchUsers()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUser className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiUser className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Suspended</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.suspended}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FiUser className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.admins}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiShield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              <FiFilter className="w-4 h-4" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              {showFilters ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
            </button>
            
            {/* Active filters count */}
            {(filterRole !== 'all' || filterStatus !== 'all' || filterVerification !== 'all' || filterDateFrom || filterDateTo) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {[filterRole !== 'all', filterStatus !== 'all', filterVerification !== 'all', filterDateFrom, filterDateTo].filter(Boolean).length} active filter(s)
                </span>
                <button
                  onClick={() => {
                    setFilterRole('all');
                    setFilterStatus('all');
                    setFilterVerification('all');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4" />
                      Role
                    </div>
                  </label>
                  <select
                    value={filterRole}
                    onChange={(e) => {
                      setFilterRole(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FiShield className="w-4 h-4" />
                      Account Status
                    </div>
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* ID Verification Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FiShield className="w-4 h-4" />
                      ID Verification
                    </div>
                  </label>
                  <select
                    value={filterVerification}
                    onChange={(e) => {
                      setFilterVerification(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">All Verification Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending Review</option>
                    <option value="rejected">Rejected</option>
                    <option value="not_verified">Not Verified</option>
                  </select>
                </div>
              </div>

              {/* Date Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      Joined From
                    </div>
                  </label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      setFilterDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      Joined To
                    </div>
                  </label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => {
                      setFilterDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-slate-600">Loading users...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <FiUser className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No users found</h3>
            <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        User
                        {sortField === 'name' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('role')}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        Role
                        {sortField === 'role' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('isActive')}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        Status
                        {sortField === 'isActive' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('idVerificationStatus')}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        ID Verification
                        {sortField === 'idVerificationStatus' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                      >
                        Joined
                        {sortField === 'createdAt' && (
                          sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      onClick={() => router.push(`/backoffice/users/${user.id}`)}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {user.name || 'Unnamed User'}
                            </div>
                            <div className="text-sm text-slate-500">ID: {user.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-900">
                              <FiMail className="w-4 h-4 text-slate-400" />
                              {user.email}
                              {user.emailVerified && (
                                <span className="text-green-600 text-xs">✓</span>
                              )}
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-900">
                              <FiPhone className="w-4 h-4 text-slate-400" />
                              {user.countryCode}{user.phone}
                              {user.phoneVerified && (
                                <span className="text-green-600 text-xs">✓</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' || user.role === 'superadmin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.idVerificationStatus === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : user.idVerificationStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : user.idVerificationStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {user.idVerificationStatus === 'verified'
                            ? 'Verified'
                            : user.idVerificationStatus === 'pending'
                            ? 'Pending'
                            : user.idVerificationStatus === 'rejected'
                            ? 'Rejected'
                            : 'Not Verified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div className="space-y-1">
                          <div>{user._count.sentDeliveries} deliveries</div>
                          <div>{user._count.transactions} transactions</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
