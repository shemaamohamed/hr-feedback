"use client"
import React, { useEffect, useState} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  chatService,
  Conversation,
  ChatMessage,
} from "@/lib/firebase/chat";
import { feedbackService } from "@/lib/firebase/feedback";

import EmployeeList from "@/components/hr/chat/EmployeeList"; 
import {
  Users,

} from "lucide-react";
import ChatWindow from "@/components/hr/chat/ChatWindow";

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
const [isUploading, setIsUploading] = useState(false);

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

  

const sendMessage = async () => {
  if (!activeConversationId || !user?.uid) return;
  if (!messageText.trim() && !file) return;

  setIsUploading(true);
  let fileUrl: string | null = null;

  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

    const resourceType = /\.(pdf|doc|docx|xls|xlsx|txt)$/i.test(file.name) ? "raw" : "image";

    const url = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    try {
      const res = await fetch(url, { method: "POST", body: formData });
      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload failed, no URL returned");
      fileUrl = data.secure_url;
    } catch (err) {
      console.error("Upload failed:", err);
      setIsUploading(false);
      return;
    }
  }

  try {
    await chatService.sendMessage(activeConversationId, {
      senderId: user.uid,
      senderName: user.name || user.uid,
      message: messageText.trim(),
      fileUrl: fileUrl || null,
      isRead: false,
      replyTo,
    });
  } catch (err) {
    console.error("Send message failed:", err);
  }

  setMessageText("");
  setReplyTo(null);
  setFile(null);
  setIsUploading(false);
};




  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const chatPartnerName =
    activeConversation && activeConversation.participantNames
      ? Object.values(activeConversation.participantNames).find(
          (n) => n !== (user?.email || user?.uid)
        )
      : "";

 

  return (
    <div className="h-[600px] bg-gray-50 flex flex-col md:grid md:grid-cols-3 gap-4 p-4">
      {/* 🔹 Employee List */}
      <div
        className={`bg-white h-[600] flex flex-col transition-all duration-300 ${
          showChat ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg text-muted-foreground flex items-center gap-2">
            <Users className="w-5 h-5 " /> Employees
          </h2>
        </div>
        <EmployeeList
        mergedList={mergedList} 
        search={search}
        setSearch={setSearch}
        openChatWith={ openChatWith}
        conversations={conversations}
        activeConversationId={activeConversationId}
        />



       
      </div>
      <ChatWindow
        messages={messages}
        user={user}
        messageText={messageText}
        setMessageText={setMessageText}
        sendMessage={sendMessage}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        file={file}
        setFile={setFile}
        showChat={showChat}
        setShowChat={setShowChat}
        activeConversationId={activeConversationId}
        chatPartnerName={chatPartnerName}
        isUploading={isUploading}

      />
      
    </div>
  );
}
