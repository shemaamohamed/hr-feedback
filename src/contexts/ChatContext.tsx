"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { chatService } from "@/lib/firebase/chat";
import { feedbackService } from "@/lib/firebase/feedback";
import type { Conversation, ChatMessage } from "@/lib/firebase/chat";

interface EmployeeItem {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: Date | null;
  conversationId: string | null;
  hasConversation: boolean;
}

interface ChatContextType {
  conversations: (Conversation & { id: string })[];
  mergedList: EmployeeItem[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  messages: (ChatMessage & { id: string })[];
  messageText: string;
  setMessageText: (t: string) => void;
  sendMessage: () => Promise<void>;
  replyTo: string | { senderName: string; message: string; messageId?: string } | null;
  setReplyTo: (v: string | { senderName: string; message: string; messageId?: string } | null) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  openChatWith: (employeeId: string, employeeName: string) => Promise<void>;
  isUploading: boolean;
  showChat: boolean;
  setShowChat: (v: boolean) => void;
  chatPartnerName: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<(Conversation & { id: string })[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyState] = useState<string | { senderName: string; message: string; messageId?: string } | null>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [mergedList, setMergedList] = useState<EmployeeItem[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Subscribe to employees + conversations
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = feedbackService.subscribeEmployeesWithFeedbackAndConversations(user.uid, setEmployees);
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

  // Merge employees + conversations
  useEffect(() => {
    if (!employees.length) return setMergedList([]);

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

  const openChatWith = useCallback(async (employeeId: string, employeeName: string) => {
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
  }, [conversations, user?.uid, user?.email]);

  const sendMessage = useCallback(async () => {
    if (!activeConversationId || !user?.uid) return;
    if (!messageText.trim() && !file) return;

    setIsUploading(true);
    let fileUrl: string | null = null;

    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!data.fileName) throw new Error("Upload failed");
        fileUrl = data.fileName;
      } catch (err) {
        console.error("Upload failed:", err);
        setIsUploading(false);
        return;
      }
    }

    try {
      // normalize reply payload: chatService expects an object with messageId
      let replyPayload: { senderName: string; message: string; messageId: string } | null = null;
      if (replyTo) {
        if (typeof replyTo === "string") {
          const found = messages.find((m) => m.id === replyTo);
          if (found) replyPayload = { senderName: found.senderName, message: found.message, messageId: found.id };
        } else {
          replyPayload = {
            senderName: replyTo.senderName,
            message: replyTo.message,
            messageId: replyTo.messageId || "",
          };
        }
      }
      console.log(messageText)

      await chatService.sendMessage(activeConversationId, {
        senderId: user.uid,
        senderName: user.name || user.uid,
        message: messageText,
        fileUrl: fileUrl || undefined,
        isRead: false,
        replyTo: replyPayload,
      });
    } catch (err) {
      console.error("Send message failed:", err);
    }

    setMessageText("");
    setReplyState(null);
    setFile(null);
    setIsUploading(false);
  }, [activeConversationId, user?.uid, user?.name, messageText, file, replyTo, messages]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const chatPartnerName =
    activeConversation && activeConversation.participantNames
      ? Object.values(activeConversation.participantNames).find(
          (n) => n !== (user?.email || user?.uid)
        ) || ""
      : "";

  const value: ChatContextType = {
    conversations,
    mergedList,
    activeConversationId,
    setActiveConversationId,
    messages,
    messageText,
    setMessageText,
    sendMessage,
    replyTo,
  setReplyTo: (v: string | { senderName: string; message: string; messageId?: string } | null) => setReplyState(v),
    file,
    setFile,
    openChatWith,
    isUploading,
    showChat,
    setShowChat,
    chatPartnerName,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;
