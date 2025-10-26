"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { chatService, Conversation, ChatMessage } from '@/lib/firebase/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function EmployeeChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<(Conversation & { id: string })[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = chatService.subscribeToConversations(user.uid, (items) => {
      setConversations(items);
      if (!activeConvId && items.length > 0) setActiveConvId(items[0].id);
    });
    return () => unsub && unsub();
  }, [user, activeConvId]);

  useEffect(() => {
    if (!activeConvId) return;
    const unsub = chatService.subscribeToConversation(activeConvId, (items) => {
      setMessages(items);
    });
    return () => unsub && unsub();
  }, [activeConvId]);

  const send = async () => {
    if (!activeConvId || !user || !text.trim()) return;
    try {
      await chatService.sendMessage(activeConvId, {
        senderId: user.uid,
        senderName: user.email || user.uid,
        message: text.trim(),
        isRead: false,
      });
      setText('');
    } catch (err) {
      console.error('send failed', err);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="grid grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conversations.length === 0 && <div className="text-sm text-gray-500">No conversations yet</div>}
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${activeConvId === c.id ? 'bg-gray-100' : ''}`}
                  >
                    {Object.values(c.participantNames || {}).filter((n) => n !== (user?.email || user?.uid))[0] || 'Conversation'}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2">
          <Card className="flex flex-col h-[70vh]">
            <CardHeader>
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {!activeConvId && <div className="text-sm text-gray-500">Select a conversation</div>}
              {messages.map((m) => (
                <div key={m.id} className={`mb-3 ${m.senderId === user?.uid ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-3 py-2 rounded ${m.senderId === user?.uid ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <div className="text-xs font-semibold">{m.senderName}</div>
                    <div className="text-sm">{m.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{m.timestamp?.toDate ? m.timestamp.toDate().toLocaleString() : ''}</div>
                  </div>
                </div>
              ))}
            </CardContent>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
                <Button onClick={send}>Send</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
