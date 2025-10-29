"use client";
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sender from "./Sender";
import ReplyPreview from "./ReplyPreview";

export default function ChatWindow({
  messages,
  user,
  messageText,
  setMessageText,
  onSendMessage,
  replyTo,
  setReplyTo,
  file,
  setFile,
}: any) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="flex flex-col w-full h-full bg-gray-50 dark:bg-gray-950">
      {/* الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg: any) => (
          <Sender key={msg.id} msg={msg} user={user} setReplyTo={setReplyTo} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* الرد على رسالة */}
      {replyTo && <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />}

      {/* الإدخال */}
      <div className="p-3 border-t flex items-center gap-2 bg-white dark:bg-gray-900">
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="اكتب رسالتك..."
          className="flex-1"
        />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button onClick={onSendMessage}>إرسال</Button>
      </div>
    </div>
  );
}
