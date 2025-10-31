"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {  Dropdown} from 'antd';
import {
  chatService,

} from "@/lib/firebase/chat";
import { Reply, Trash } from "lucide-react";
import MessageContent from "./messageContent"



interface SenderProps {
  messageId: string;
  conversationId: string;
  userId: string;
  senderName: string;
  message: string;
  time: string;
  isSender: boolean;
  replyTo?: { senderName: string; message: string; messageId?: string } | string | null;
  onReply: () => void;
  messages?: { id: string; senderName: string; message: string }[];
  fileUrl?:string
}

export default function Sender({
  messageId,
  senderName,
  message,
  time,
  isSender,
  replyTo,
  onReply,
  messages,
  conversationId,
  userId,
  fileUrl


}: SenderProps) {
  const repliedMessage =
    typeof replyTo === "string"
      ? messages?.find((msg) => msg.id === replyTo)
      : replyTo;
  const deleteMessage = async () => {
    if (!conversationId || !messageId || !userId) return;
    try {
      await chatService.deleteMessage(messageId, conversationId, userId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className={`flex flex-col ${
        isSender ? "items-end" : "items-start"
      } mb-3`}
    >
        
      <div  className=" flex gap-2">
         <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold uppercase">
          {senderName.charAt(0)}
        </div>
        <div
        className={`max-w-[75%] p-3 rounded-2xl shadow-sm relative ${
          isSender
            ? "bg-blue-500 text-white rounded-tr-none"
            : "bg-gray-100 text-gray-800 rounded-tl-none"
        }`}
      >
        {repliedMessage && (
          <div
            className={`mb-2 text-sm border-l-4 pl-2 ${
              isSender ? "border-white/50" : "border-blue-400"
            }`}
          >
            <span className="block font-semibold text-xs opacity-80">
              {repliedMessage.senderName}
            </span>
            <span className="block truncate opacity-80">
              {repliedMessage.message}
            </span>
          </div>
        )}

        {/* النص الأساسي */}
        <p className="whitespace-pre-wrap break-words">
          <MessageContent
          message={message}
          fileUrl={fileUrl}
          />
        </p>

        {/* الوقت */}
        <span
          className={`text-[10px] opacity-70 block mt-1 ${
            isSender ? "text-white/80" : "text-gray-500"
          }`}
        >
          {time}
        </span>
      </div>

      {/* زر الرد */}
      <div className="mt-1 flex flex-col ">
        <Button
  variant="ghost"
  size="sm"
  onClick={onReply}
  className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 flex items-center gap-1"
>
  <Reply className="w-4 h-4" /> 
</Button>
        {isSender && (
          <Dropdown
            menu={{
              items: [
                
                {
                  key: 'delete',
                label: (
    <div className="flex items-center gap-2 text-red-600 hover:text-white">
      <Trash className="w-4 h-4" />
      <span>Delete</span>
    </div>
  ),
                  danger: true,
                  onClick: deleteMessage,
                },
              ],
            }}
            trigger={['click']}
          >
            <Button
              variant="ghost"
  size="sm"
className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 flex items-center gap-1"            >⋮</Button>
          </Dropdown>)}

      </div>

        </div>

    </div>
  );
}
