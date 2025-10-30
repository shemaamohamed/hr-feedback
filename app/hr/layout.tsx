'use client';

import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="flex bg-muted/30">
      <Sidebar userEmail={user?.email} onLogout={handleLogout} />

      <div className="flex-1 ml-20 lg:ml-64 transition-all duration-300">
        <header className="sticky top-0 z-30 flex items-center justify-center h-16 border-b bg-background text-md font-bold text-primary ">
          HR Feedback Admin Panel
        </header>

        <main className="p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-screen">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
