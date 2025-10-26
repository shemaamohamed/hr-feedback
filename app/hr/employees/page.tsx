"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  feedbackService,
  chatService,
  Feedback,
  Conversation,
  ChatMessage,
} from "@/lib/firebase/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HREmployeesPage() {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<(Feedback & { id: string })[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [conversations, setConversations] = useState<(Conversation & { id: string })[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");

  //  Subscribe to feedback (for employees)
  useEffect(() => {
    const unsub = feedbackService.subscribeFeedback(setFeedbackList);
    return () => unsub && unsub();
  }, []);

  //  Derive unique employees list from feedback
  useEffect(() => {
    const map = new Map<string, string>();
    feedbackList.forEach((fb) => {
      const id = (fb.employeeId ?? fb.employeeName ?? fb.id) as string;
      const name = fb.employeeName ?? fb.employeeId ?? "Unknown";
      if (id && !map.has(id)) map.set(id, name);
    });
    setEmployees(Array.from(map.entries()).map(([id, name]) => ({ id, name })));
  }, [feedbackList]);

  //  Subscribe to HR conversations
  useEffect(() => {
    if (!user) return;
    const unsub = chatService.subscribeToConversations(user.uid, (items) => {
      setConversations(items);
    });
    return () => unsub && unsub();
  }, [user]);

  //  Subscribe to messages of active conversation
  useEffect(() => {
    if (!activeConversationId) return;
    const unsub = chatService.subscribeToConversation(activeConversationId, setMessages);
    return () => unsub && unsub();
  }, [activeConversationId]);

  //  Scroll chat to bottom when messages change
  useEffect(() => {
    const chatBox = document.getElementById("chat-box");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, [messages]);

  //  Find existing or create new conversation
  const openChatWith = async (employeeId: string, employeeName: string) => {
    if (!user) return;

    const existing = conversations.find((c) => {
      const parts: string[] = c.participants || [];
      return parts.includes(user.uid) && parts.includes(employeeId);
    });

    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      const convId = await chatService.createConversation([user.uid, employeeId], {
        [user.uid]: user.email || user.uid,
        [employeeId]: employeeName,
      });
      setActiveConversationId(convId);
    }
  };

  //  Send message
  const sendMessage = async () => {
    if (!activeConversationId || !user || !messageText.trim()) return;
    await chatService.sendMessage(activeConversationId, {
      senderId: user.uid,
      senderName: user.name || user.uid,
      message: messageText.trim(),
      isRead: false,
    });
    setMessageText("");
  };

  //  Active conversation details
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const chatPartnerName =
    activeConversation && activeConversation.participantNames
      ? Object.values(activeConversation.participantNames).find(
          (n) => n !== (user?.email || user?.uid)
        )
      : "";

  //  Filtered employee list based on search
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [employees, search]);

  return (
    <div className="min-h-screen p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* 👥 Employee + Conversations List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-3"
              />

              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {filteredEmployees.length === 0 && (
                  <div className="text-sm text-gray-500">No employees found</div>
                )}

                {filteredEmployees.map((emp) => {
                  const conv = conversations.find((c) => c.participants.includes(emp.id));
                  const lastMessage = conv?.lastMessage || "";
                  const lastMessageSender =
                    conv?.participantNames?.[conv?.lastMessageSenderId || ""] || "";
                  const lastMessageTime = conv?.lastMessageTime?.toDate
                    ? conv.lastMessageTime.toDate().toLocaleTimeString()
                    : "";

                  return (
                    <button
                      key={emp.id}
                      onClick={() => openChatWith(emp.id, emp.name)}
                      className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded transition ${
                        activeConversationId === conv?.id
                          ? "bg-blue-100"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {/* Avatar Circle */}
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold uppercase">
                        {emp.name.charAt(0)}
                      </div>

                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-gray-800 font-medium truncate">{emp.name}</span>
                        {lastMessage ? (
                          <span className="text-xs text-gray-500 truncate max-w-[180px]">
                            <span className="font-semibold">
                              {lastMessageSender === (user?.email || user?.uid)
                                ? "You: "
                                : `${lastMessageSender}: `}
                            </span>
                            {lastMessage}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No messages yet</span>
                        )}
                        {lastMessageTime && (
                          <span className="text-[10px] text-gray-400">{lastMessageTime}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 💬 Chat Window */}
        <div className="col-span-2">
          <Card className="flex flex-col h-[70vh]">
            <CardHeader>
              <CardTitle>Chat with {chatPartnerName || "..."}</CardTitle>
            </CardHeader>

            <CardContent id="chat-box" className="flex-1 overflow-y-auto">
              {!activeConversationId ? (
                <div className="text-sm text-gray-500">
                  Select an employee or search to start chat
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`mb-3 ${
                      m.senderId === user?.uid ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block px-3 py-2 rounded ${
                        m.senderId === user?.uid
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="text-xs font-semibold">{m.senderName}</div>
                      <div className="text-sm">{m.message}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {m.timestamp?.toDate
                          ? m.timestamp.toDate().toLocaleString()
                          : ""}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {activeConversationId && (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <Button onClick={sendMessage}>Send</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
