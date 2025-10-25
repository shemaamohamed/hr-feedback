'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, LayoutDashboard, Users, FileText, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-gray-200 px-6">
            <h1 className="text-xl font-bold text-primary">HR Portal</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <Link
              href="/hr"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/hr/employees"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <Users className="h-5 w-5" />
              <span>Employees</span>
            </Link>
            <Link
              href="/hr/feedback"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <FileText className="h-5 w-5" />
              <span>Feedback</span>
            </Link>
            <Link
              href="/hr/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                <p className="text-xs text-gray-500">HR Manager</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
