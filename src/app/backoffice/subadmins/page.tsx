'use client';

import { useEffect, useState } from 'react';
import {
  FiUserCheck,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiShield,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiX,
  FiCheck,
  FiLock,
} from 'react-icons/fi';

interface Subadmin {
  id: string;
  email: string;
  name: string | null;
  roleTitle: string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

// Available permissions based on sidebar sections
const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'View dashboard and analytics' },
  { id: 'users', name: 'Users', description: 'Manage users and verify IDs' },
  { id: 'deliveries', name: 'Deliveries', description: 'View and manage deliveries' },
  { id: 'transactions', name: 'Transactions', description: 'View transaction history' },
  { id: 'notifications', name: 'Notifications', description: 'Send notifications to users' },
  { id: 'platform-settings', name: 'Platform Settings', description: 'Modify platform fee and settings' },
  { id: 'withdrawals', name: 'Withdrawals', description: 'Approve/reject withdrawal requests' },
  { id: 'topup', name: 'Top up', description: 'Add funds to user wallets' },
  { id: 'terms-policy', name: 'Terms & Policy', description: 'Edit terms and policies' },
  { id: 'audit', name: 'Audit Logs', description: 'View audit logs and admin actions' },
];

export default function SubadminsPage() {
  const [subadmins, setSubadmins] = useState<Subadmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubadmin, setSelectedSubadmin] = useState<Subadmin | null>(null);
  const [expandedSubadmin, setExpandedSubadmin] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    roleTitle: 'Subadmin',
    permissions: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchSubadmins();
  }, []);

  const fetchSubadmins = async () => {
    try {
      const response = await fetch('/api/backoffice/subadmins');
      if (response.ok) {
        const data = await response.json();
        setSubadmins(data.subadmins || []);
      }
    } catch (error) {
      console.error('Error fetching subadmins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    console.log('Creating subadmin with data:', formData);

    try {
      const response = await fetch('/api/backoffice/subadmins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subadmin');
      }

      setSubadmins([data.subadmin, ...subadmins]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating subadmin:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to create subadmin');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateSubadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubadmin) return;

    setFormError('');
    setFormLoading(true);

    try {
      const response = await fetch(`/api/backoffice/subadmins/${selectedSubadmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subadmin');
      }

      setSubadmins(subadmins.map(sa => sa.id === selectedSubadmin.id ? data.subadmin : sa));
      setShowEditModal(false);
      setSelectedSubadmin(null);
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to update subadmin');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (subadmin: Subadmin) => {
    try {
      const response = await fetch(`/api/backoffice/subadmins/${subadmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !subadmin.isActive }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubadmins(subadmins.map(sa => sa.id === subadmin.id ? data.subadmin : sa));
      }
    } catch (error) {
      console.error('Error toggling subadmin status:', error);
    }
  };

  const handleDeleteSubadmin = async () => {
    if (!selectedSubadmin) return;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/backoffice/subadmins/${selectedSubadmin.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSubadmins(subadmins.filter(sa => sa.id !== selectedSubadmin.id));
        setShowDeleteModal(false);
        setSelectedSubadmin(null);
      }
    } catch (error) {
      console.error('Error deleting subadmin:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (subadmin: Subadmin) => {
    setSelectedSubadmin(subadmin);
    setFormData({
      email: subadmin.email,
      password: '', // Don't pre-fill password
      name: subadmin.name || '',
      roleTitle: subadmin.roleTitle,
      permissions: subadmin.permissions,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (subadmin: Subadmin) => {
    setSelectedSubadmin(subadmin);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      roleTitle: 'Subadmin',
      permissions: [],
    });
    setShowPassword(false);
    setFormError('');
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const selectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: AVAILABLE_PERMISSIONS.map(p => p.id)
    }));
  };

  const clearAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: [] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiUserCheck className="text-orange-500" />
              Subadmin Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage subadmin accounts and their access permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <FiPlus />
            Create Subadmin
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Subadmins</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{subadmins.length}</p>
            </div>
            <FiUserCheck className="text-3xl text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {subadmins.filter(sa => sa.isActive).length}
              </p>
            </div>
            <FiCheck className="text-3xl text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {subadmins.filter(sa => !sa.isActive).length}
              </p>
            </div>
            <FiLock className="text-3xl text-red-500" />
          </div>
        </div>
      </div>

      {/* Subadmins List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {subadmins.length === 0 ? (
          <div className="text-center py-12">
            <FiUserCheck className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-600">No subadmins created yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-orange-500 hover:text-orange-600 font-medium"
            >
              Create your first subadmin
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subadmin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subadmins.map((subadmin) => (
                  <>
                    <tr key={subadmin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subadmin.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{subadmin.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {subadmin.roleTitle}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setExpandedSubadmin(
                            expandedSubadmin === subadmin.id ? null : subadmin.id
                          )}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          {subadmin.permissions.length} permissions
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(subadmin)}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            subadmin.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subadmin.isActive ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subadmin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(subadmin)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => openDeleteModal(subadmin)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                    {expandedSubadmin === subadmin.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Access Permissions:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {subadmin.permissions.map(permId => {
                                const perm = AVAILABLE_PERMISSIONS.find(p => p.id === permId);
                                return perm ? (
                                  <div
                                    key={permId}
                                    className="flex items-center gap-2 text-sm text-gray-600"
                                  >
                                    <FiShield className="text-green-500" />
                                    {perm.name}
                                  </div>
                                ) : null;
                              })}
                            </div>
                            {subadmin.permissions.length === 0 && (
                              <p className="text-sm text-gray-500 italic">
                                No permissions assigned
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Subadmin Modal */}
      {showCreateModal && (
        <SubadminModal
          title="Create Subadmin"
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          formError={formError}
          formLoading={formLoading}
          onSubmit={handleCreateSubadmin}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          togglePermission={togglePermission}
          selectAllPermissions={selectAllPermissions}
          clearAllPermissions={clearAllPermissions}
          isEdit={false}
        />
      )}

      {/* Edit Subadmin Modal */}
      {showEditModal && (
        <SubadminModal
          title="Edit Subadmin"
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          formError={formError}
          formLoading={formLoading}
          onSubmit={handleUpdateSubadmin}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSubadmin(null);
            resetForm();
          }}
          togglePermission={togglePermission}
          selectAllPermissions={selectAllPermissions}
          clearAllPermissions={clearAllPermissions}
          isEdit={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSubadmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiAlertCircle className="text-3xl text-red-500" />
              <h2 className="text-xl font-bold text-gray-900">Delete Subadmin</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedSubadmin.email}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSubadmin(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubadmin}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                disabled={formLoading}
              >
                {formLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subadmin Form Modal Component
interface SubadminModalProps {
  title: string;
  formData: {
    email: string;
    password: string;
    name: string;
    roleTitle: string;
    permissions: string[];
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  formError: string;
  formLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  togglePermission: (permissionId: string) => void;
  selectAllPermissions: () => void;
  clearAllPermissions: () => void;
  isEdit: boolean;
}

function SubadminModal({
  title,
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  formError,
  formLoading,
  onSubmit,
  onClose,
  togglePermission,
  selectAllPermissions,
  clearAllPermissions,
  isEdit,
}: SubadminModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="text-2xl" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!isEdit}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={isEdit ? 'Leave blank to keep current' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Title
              </label>
              <input
                type="text"
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Access Permissions <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAllPermissions}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission.id)}
                    onChange={() => togglePermission(permission.id)}
                    className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{permission.name}</p>
                    <p className="text-xs text-gray-500">{permission.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <FiAlertCircle />
              <span className="text-sm">{formError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              disabled={formLoading || formData.permissions.length === 0}
            >
              {formLoading ? 'Saving...' : isEdit ? 'Update Subadmin' : 'Create Subadmin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
