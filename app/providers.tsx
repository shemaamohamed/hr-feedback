'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { FeedbackProvider } from '@/contexts/FeedbackContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
    </AuthProvider>
  );
}
