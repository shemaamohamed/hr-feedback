"use client"
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  chatService,
  Conversation,
  ChatMessage,
} from "@/lib/firebase/chat";
import { feedbackService } from "@/lib/firebase/feedback";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Sender from "./sender";
import {
  Search,
  Send,
  Users,
  ArrowLeft,
  Paperclip,
  Image as ImageIcon,
  X,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
}

interface MergedItem {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: Date | null;
  conversationId: string | null;
  hasConversation: boolean;
}

export default function HREmployeesPage() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<(Conversation & { id: string })[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState<null | { senderName: string; message: string; messageId: string }>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [mergedList, setMergedList] = useState<MergedItem[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 🔹 Subscribe Employees + Conversations
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = feedbackService.subscribeEmployeesWithFeedbackAndConversations(
      user.uid,
      setEmployees
    );
    return () => unsub && unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = chatService.subscribeToConversations(user.uid, setConversations);
    return () => unsub && unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!activeConversationId) return;
    const unsub = chatService.subscribeToConversation(activeConversationId, setMessages);
    return () => unsub && unsub();
  }, [activeConversationId]);

  // 🔹 Merge Employees + Conversations
  useEffect(() => {
    if (!employees.length) return;

    const convoMap = new Map<string, Conversation>();
    conversations.forEach((c) => {
      const employeeId = c.participants.find((p) => p !== user?.uid);
      if (employeeId) convoMap.set(employeeId, c);
    });

    const combined = employees.map((emp) => {
      const convo = convoMap.get(emp.id);
      return {
        id: emp.id,
        name: emp.name,
        lastMessage: convo?.lastMessage || "",
        lastMessageTime: convo?.lastMessageTime ? convo.lastMessageTime.toDate() : null,
        conversationId: convo?.id || null,
        hasConversation: !!convo,
      };
    });

    combined.sort((a, b) => {
      if (a.hasConversation && !b.hasConversation) return -1;
      if (!a.hasConversation && b.hasConversation) return 1;
      if (a.lastMessageTime && b.lastMessageTime)
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      if (a.lastMessageTime) return -1;
      if (b.lastMessageTime) return 1;
      return 0;
    });

    setMergedList(combined);
  }, [employees, conversations, user?.uid]);

  // 🔹 Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChatWith = async (employeeId: string, employeeName: string) => {
    if (!user?.uid) return;

    const existing = conversations.find(
      (c) => c.participants.includes(user.uid) && c.participants.includes(employeeId)
    );

    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      const convId = await chatService.createConversation(
        [user.uid, employeeId],
        { [user.uid]: user.email || user.uid, [employeeId]: employeeName }
      );
      setActiveConversationId(convId);
    }
    setShowChat(true);
  };

  const handleReply = (message: { senderName: string; message: string; messageId: string }) => {
    setReplyTo(message);
  };

  const sendMessage = async () => {
    if (!activeConversationId || !user?.uid) return;
    if (!messageText.trim() && !file) return;

    let fileUrl = null;
    if (file) {
      fileUrl = await chatService.uploadFile(file);
    }

    await chatService.sendMessage(activeConversationId, {
      senderId: user.uid,
      senderName: user.name || user.uid,
      message: messageText.trim(),
      fileUrl,
      isRead: false,
      replyTo,
    });

    setMessageText("");
    setReplyTo(null);
    setFile(null);
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const chatPartnerName =
    activeConversation && activeConversation.participantNames
      ? Object.values(activeConversation.participantNames).find(
          (n) => n !== (user?.email || user?.uid)
        )
      : "";

  const filteredEmployees = useMemo(
    () =>
      mergedList.filter((emp) =>
        emp?.name?.toLowerCase().includes(search.toLowerCase())
      ),
    [mergedList, search]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:grid md:grid-cols-3 gap-4 p-4">
      {/* 🔹 Employee List */}
      <div
        className={`bg-white rounded-2xl shadow-md flex flex-col transition-all duration-300 ${
          showChat ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Employees
          </h2>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {filteredEmployees.length === 0 ? (
            <div className="text-sm text-gray-500 text-center mt-4">
              No employees found
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const conv = conversations.find((c) => c.participants.includes(emp.id));
              const lastMessage = conv?.lastMessage || "";
              const lastMessageTime = conv?.lastMessageTime?.toDate
                ? conv.lastMessageTime.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <button
                  key={emp.id}
                  onClick={() => openChatWith(emp.id, emp.name)}
                  className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-xl transition-all ${
                    activeConversationId === conv?.id
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold uppercase">
                    {emp?.name?.charAt(0)}
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-gray-800 font-medium truncate">{emp.name}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[180px]">
                      {lastMessage || "No messages yet"}
                    </span>
                    {lastMessageTime && (
                      <span className="text-[10px] text-gray-400 mt-1">
                        {lastMessageTime}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 🔹 Chat Window */}
      <div
        className={`bg-white rounded-2xl shadow-md flex flex-col overflow-hidden transition-all duration-300 ${
          showChat ? "flex col-span-2" : "hidden md:flex col-span-2"
        }`}
      >
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-lg text-gray-800 truncate">
            Chat with {chatPartnerName || "..."}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setShowChat(false)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ maxHeight: "70vh" }}>
          {!activeConversationId ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select an employee to start chatting
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <Sender
                  key={m.id}
                  messageId={m.id}
                  conversationId={activeConversationId}
                  userId={user?.uid || ""}
                  senderName={m.senderName}
                  message={m.message}
                  fileUrl={m.fileUrl}
                  time={
                    m.timestamp?.toDate
                      ? m.timestamp.toDate().toLocaleString()
                      : ""
                  }
                  isSender={m.senderId === user?.uid}
                  replyTo={m.replyTo}
                  onReply={() =>
                    handleReply({
                      senderName: m.senderName,
                      message: m.message,
                      messageId: m.id,
                    })
                  }
                />
              ))}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {activeConversationId && (
          <div className="p-4 border-t bg-gray-50">
            {replyTo && (
              <div className="bg-blue-50 p-2 mb-2 rounded-lg text-sm flex justify-between items-center border-l-4 border-blue-500">
                <div>
                  <strong>{replyTo.senderName}</strong>: {replyTo.message}
                </div>
                <button
                  className="text-red-500 text-xs ml-2"
                  onClick={() => setReplyTo(null)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="cursor-pointer text-gray-500 hover:text-blue-600">
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file && (
                <span className="text-xs text-gray-600 truncate max-w-[120px]">
                  {file.name}
                </span>
              )}

              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full px-4 py-2 border-gray-300 focus:ring-2 focus:ring-blue-400"
              />
              <Button
                onClick={sendMessage}
                className="rounded-full px-3 py-2 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-5 h-5 text-white" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
