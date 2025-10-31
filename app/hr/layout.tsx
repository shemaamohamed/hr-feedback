'use client';

import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // 🔹 حالة فتح/غلق السايدبار
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="flex bg-muted/30 min-h-screen">
      {/* مرر الحالة و الدالة للسايدبار */}
      <Sidebar
        userEmail={user?.email ?? undefined}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* هنا العرض يتغير بناءً على حالة collapse */}
      <div
        className={cn(
          'flex-1 transition-all duration-300',
          collapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
        <header className="sticky top-0 z-30 flex items-center justify-center h-16 border-b bg-background text-md font-bold text-primary">
          HR Feedback Admin Panel
        </header>

        <main className="p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-screen">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
