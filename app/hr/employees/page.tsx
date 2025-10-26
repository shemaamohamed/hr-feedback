"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { feedbackService, chatService, Feedback, Conversation, ChatMessage } from '@/lib/firebase/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function HREmployeesPage() {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<(Feedback & { id: string })[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);

  const [conversations, setConversations] = useState<(Conversation & { id: string })[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([]);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    const unsub = feedbackService.subscribeFeedback(setFeedbackList);
    return () => unsub && unsub();
  }, []);

  // derive employees from feedbackList
  useEffect(() => {
    const map = new Map<string, string>();
    feedbackList.forEach((fb) => {
      const id = (fb.employeeId ?? fb.employeeName ?? fb.id) as string;
      const name = fb.employeeName ?? fb.employeeId ?? 'Unknown';
      if (id && !map.has(id)) map.set(id, name);
    });
    const list = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    setEmployees(list);
  }, [feedbackList]);

  // subscribe to HR user's conversations so we can reuse existing ones
  useEffect(() => {
    if (!user) return;
    const unsub = chatService.subscribeToConversations(user.uid, (items) => {
      setConversations(items);
    });
    return () => unsub && unsub();
  }, [user]);

  // subscribe to messages for active conversation
  useEffect(() => {
    if (!activeConversationId) return;
    const unsub = chatService.subscribeToConversation(activeConversationId, (items) => {
      setMessages(items);
    });
    return () => unsub && unsub();
  }, [activeConversationId]);

  const openChatWith = async (employeeId: string, employeeName: string) => {
    if (!user) return;

    // try find existing conversation where participants include both
    const existing = conversations.find((c) => {
      const parts: string[] = c.participants || c.participants || [];
      return parts.includes(user.uid) && parts.includes(employeeId);
    });

    if (existing) {
      setActiveConversationId(existing.id);
      return;
    }

    // create new conversation
    const convId = await chatService.createConversation([user.uid, employeeId], {
      [user.uid]: user.email || user.uid,
      [employeeId]: employeeName,
    });
    setActiveConversationId(convId);
  };

  const sendMessage = async () => {
    if (!activeConversationId || !user) return;
    if (!messageText.trim()) return;
    try {
      await chatService.sendMessage(activeConversationId, {
        senderId: user.uid,
        senderName: user.email || user.uid,
        message: messageText.trim(),
        isRead: false,
      });
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="grid grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {employees.length === 0 && <div className="text-sm text-gray-500">No employees found</div>}
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => openChatWith(emp.id, emp.name)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                  >
                    {emp.name}
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
              {!activeConversationId && (
                <div className="text-sm text-gray-500">Select an employee to start chat</div>
              )}
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
                <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
