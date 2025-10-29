"use client";
import React from "react";

export default function Sender({ msg, user, setReplyTo }: any) {
  const isMe = msg.senderId === user.uid;

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
      onClick={() => setReplyTo(msg)}
    >
      <div
        className={`p-3 rounded-2xl max-w-[75%] ${
          isMe ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-800"
        }`}
      >
        {msg.replyTo && (
          <div className="text-xs text-gray-300 italic mb-1 border-l-2 pl-2 border-gray-400">
            ردًا على: {msg.replyTo.message}
          </div>
        )}
        {msg.message}
        {msg.fileUrl && (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm underline mt-1"
          >
            عرض الملف 📎
          </a>
        )}
      </div>
    </div>
  );
}
