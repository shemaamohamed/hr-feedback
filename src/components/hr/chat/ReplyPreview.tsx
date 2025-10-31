"use client";
import React from "react";
import { X } from "lucide-react";

interface Props {
  replyTo: { message: string };
  onCancel: () => void;
}

export default function ReplyPreview({ replyTo, onCancel }: Props) {
  return (
    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-3 py-2 border-t">
      <div className="text-sm truncate">
        <span className="font-medium text-gray-700 dark:text-gray-200">ردًا على: </span>
        {replyTo.message}
      </div>
      <button onClick={onCancel} className="text-gray-500 hover:text-red-500">
        <X size={18} />
      </button>
    </div>
  );
}
