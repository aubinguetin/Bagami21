'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  FiHome,
  FiUsers,
  FiPackage,
  FiDollarSign,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiCreditCard,
  FiPlusCircle,
  FiBell,
  FiMove,
  FiRotateCcw,
  FiUserCheck,
  FiMail,
} from 'react-icons/fi';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string; // Add unique ID for each item
}

const defaultNavigation: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', href: '/backoffice/dashboard', icon: FiHome },
  { id: 'users', name: 'Users', href: '/backoffice/users', icon: FiUsers },
  { id: 'deliveries', name: 'Deliveries', href: '/backoffice/deliveries', icon: FiPackage },
  { id: 'transactions', name: 'Transactions', href: '/backoffice/transactions', icon: FiDollarSign },
  { id: 'notifications', name: 'Notifications', href: '/backoffice/notifications', icon: FiBell },
  { id: 'contact-messages', name: 'Contact Messages', href: '/backoffice/contact-messages', icon: FiMail },
  { id: 'platform-settings', name: 'Platform Settings', href: '/backoffice/platform-settings', icon: FiSettings },
  { id: 'withdrawals', name: 'Withdrawals', href: '/backoffice/withdrawals', icon: FiCreditCard },
  { id: 'topup', name: 'Top up', href: '/backoffice/topup', icon: FiPlusCircle },
  { id: 'terms-policy', name: 'Terms & Policy', href: '/backoffice/terms-policy', icon: FiFileText },
  { id: 'subadmins', name: 'Subadmins', href: '/backoffice/subadmins', icon: FiUserCheck },
  { id: 'audit', name: 'Audit Logs', href: '/backoffice/audit', icon: FiShield },
];

const STORAGE_KEY = 'backoffice-nav-order';

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navigation, setNavigation] = useState<NavItem[]>(defaultNavigation);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<NavItem | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [subadmin, setSubadmin] = useState<any>(null);
  const [allowedNavigation, setAllowedNavigation] = useState<NavItem[]>(defaultNavigation);
  const [isHydrated, setIsHydrated] = useState(false);

    // Load navigation order from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !subadmin) {
      const savedOrder = localStorage.getItem('navigationOrder');
      if (savedOrder) {
        try {
          setNavigation(JSON.parse(savedOrder));
        } catch (error) {
          console.error('Failed to parse navigation order:', error);
        }
      }
    }
  }, [subadmin]);

  // Save navigation order to localStorage
  const saveNavigationOrder = (newOrder: NavItem[]) => {
    const orderIds = newOrder.map(item => item.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderIds));
  };

  // Reset to default order
  const resetNavigationOrder = () => {
    setNavigation(defaultNavigation);
    localStorage.removeItem(STORAGE_KEY);
    setIsReorderMode(false);
  };

  // Drag and drop handlers
  const handleDragStart = (item: NavItem) => {
    setIsDragging(true);
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, targetItem: NavItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const draggedIndex = navigation.findIndex(item => item.id === draggedItem.id);
    const targetIndex = navigation.findIndex(item => item.id === targetItem.id);

    const newNavigation = [...navigation];
    newNavigation.splice(draggedIndex, 1);
    newNavigation.splice(targetIndex, 0, draggedItem);

    setNavigation(newNavigation);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
    if (navigation !== defaultNavigation) {
      saveNavigationOrder(navigation);
    }
  };

  // Check if this is the login page
  const isLoginPage = pathname === '/backoffice/login';

  // Check for subadmin session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const subadminData = localStorage.getItem('subadmin');
      if (subadminData) {
        try {
          const parsed = JSON.parse(subadminData);
          setSubadmin(parsed);
          
          // Filter navigation based on permissions
          // Note: Exclude 'subadmins' section - only full admins can manage subadmins
          const filtered = defaultNavigation.filter(item => {
            return item.id !== 'subadmins' && parsed.permissions.includes(item.id);
          });
          setAllowedNavigation(filtered);
        } catch (error) {
          console.error('Failed to parse subadmin data:', error);
          localStorage.removeItem('subadmin');
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Check if user is authorized
  useEffect(() => {
    // Skip verification for login page
    if (isLoginPage) {
      setIsHydrated(true);
      return;
    }

    async function checkAuth() {
      // Wait for hydration to complete
      if (!isHydrated) return;

      // If subadmin is logged in, mark as authorized
      if (subadmin) {
        setIsAdmin(true);
        return;
      }

      // Otherwise check NextAuth session for admin
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        router.push('/backoffice/login');
        return;
      }

      try {
        const response = await fetch('/api/backoffice/verify-admin');
        const data = await response.json();

        if (!data.isAdmin) {
          router.push('/');
          return;
        }

        setIsAdmin(true);
        
        // For admins (NextAuth), set allowed navigation to all items
        setAllowedNavigation(navigation);
      } catch (error) {
        console.error('Error verifying admin:', error);
        router.push('/backoffice/login');
      }
    }

    checkAuth();
  }, [status, router, isLoginPage, subadmin, navigation, isHydrated]);

  const handleLogout = async () => {
    // Clear subadmin data if exists
    localStorage.removeItem('subadmin');
    setSubadmin(null);
    
    // Sign out from NextAuth
    await signOut({ callbackUrl: '/backoffice/login' });
  };

  // Render login page without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading state while verifying or hydrating
  if (!isHydrated || isAdmin === null || status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiShield className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-slate-900">Backoffice</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-800`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiShield className="w-6 h-6 text-white" />
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <h1 className="text-white font-bold text-lg">Backoffice</h1>
                  <p className="text-slate-400 text-xs">Admin Portal</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {/* Reorder Mode Toggle - Only show for full admins, not subadmins */}
            {!subadmin && (
              <div className="px-3 pb-3 mb-2 border-b border-slate-800">
                {isSidebarOpen ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsReorderMode(!isReorderMode)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                        isReorderMode
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <FiMove className="w-4 h-4" />
                      {isReorderMode ? 'Done Reordering' : 'Reorder Menu'}
                    </button>
                    {isReorderMode && (
                      <button
                        onClick={resetNavigationOrder}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-sm"
                      >
                        <FiRotateCcw className="w-4 h-4" />
                        Reset to Default
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsReorderMode(!isReorderMode)}
                    className={`w-full flex items-center justify-center p-2 rounded-lg transition ${
                      isReorderMode
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title={isReorderMode ? 'Done Reordering' : 'Reorder Menu'}
                  >
                    <FiMove className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Navigation Items - Use filtered list for subadmins */}
            {(subadmin ? allowedNavigation : navigation).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <div
                  key={item.id}
                  draggable={isReorderMode}
                  onDragStart={() => isReorderMode && handleDragStart(item)}
                  onDragOver={(e) => isReorderMode && handleDragOver(e, item)}
                  onDragEnd={handleDragEnd}
                  className={`${
                    isReorderMode ? 'cursor-move' : ''
                  } ${
                    isDragging && draggedItem?.id === item.id ? 'opacity-50' : ''
                  }`}
                >
                  {isReorderMode ? (
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition border-2 border-dashed ${
                        isDragging && draggedItem?.id === item.id
                          ? 'border-orange-500 bg-slate-800'
                          : 'border-slate-700 bg-slate-800/50'
                      } text-slate-300`}
                    >
                      <FiMove className="w-4 h-4 text-slate-500" />
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {isSidebarOpen && <span className="font-medium">{item.name}</span>}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {isSidebarOpen && <span className="font-medium">{item.name}</span>}
                    </Link>
                  )}
                </div>
              );
            })}
            
            {isReorderMode && isSidebarOpen && (
              <div className="pt-3 mt-3 border-t border-slate-800">
                <p className="text-xs text-slate-500 px-3 italic">
                  💡 Drag and drop items to reorder
                </p>
              </div>
            )}
          </nav>

          {/* User info & Logout */}
          <div className="p-4 border-t border-slate-800">
            {isSidebarOpen && (
              <div className="mb-3 px-3">
                <p className="text-xs text-slate-400">Logged in as</p>
                <p className="text-sm text-white font-medium truncate">
                  {session?.user?.email}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition"
            >
              <FiLogOut className="w-5 h-5" />
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div
        className={`transition-all ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        } pt-16 lg:pt-0`}
      >
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
