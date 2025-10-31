"use client";
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sender from "./sender";
import {
  Send,
  ArrowLeft,
  Paperclip,
  X,
} from "lucide-react";

export default function ChatWindow({
  messages,
  user,
  messageText,
  setMessageText,
  sendMessage,
  replyTo,
  setReplyTo,
  file,
  setFile,
  showChat,
  chatPartnerName,
  setShowChat,
  activeConversationId,
  isUploading

}: any) {
    const chatEndRef = useRef<HTMLDivElement>(null);
useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleReply = (message: { senderName: string; message: string; messageId: string }) => {
    setReplyTo(message);
  };


  return (
    <div
        className={`bg-white rounded-2xl shadow-md flex flex-col  transition-all duration-300 h-[600px] ${
          showChat ? "flex col-span-2" : "hidden md:flex col-span-2"
        }`}
      >
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-lg text-muted-foreground truncate">
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
                  fileUrl={m?.fileUrl}
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
  disabled={isUploading} // يمنع الضغط أثناء التحميل
  className="rounded-full px-3 py-2 bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
>
  {isUploading ? (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  ) : (
    <Send className="w-5 h-5 text-white" />
  )}
</Button>

            </div>
          </div>
        )}
      </div>
  );
}
