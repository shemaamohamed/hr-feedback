'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { FeedbackProvider } from '@/contexts/FeedbackContext';
import { ChatProvider } from '@/contexts/ChatContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
