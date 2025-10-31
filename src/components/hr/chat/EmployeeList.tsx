"use client";
import { Input } from "@/components/ui/input";
import React, { useMemo } from "react";

import { Search } from "lucide-react";
import type { Conversation } from "@/lib/firebase/chat";

interface MergedItem {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: Date | null;
  conversationId: string | null;
  hasConversation: boolean;
}

interface Props {
  mergedList: MergedItem[];
  search: string;
  setSearch: (v: string) => void;
  openChatWith: (id: string, name: string) => void;
  conversations: (Conversation & { id: string })[];
  activeConversationId?: string | null;
}

export default function EmployeeList({ mergedList, search, setSearch, openChatWith, conversations, activeConversationId }: Props) {
   const filteredEmployees = useMemo(
    () =>
      mergedList.filter((emp) =>
        emp?.name?.toLowerCase().includes(search.toLowerCase())
      ),
    [mergedList, search]
  );
  return (
   <div className="h-full">
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

        <div className="flex flex-col flex-1 overflow-y-auto px-2 pb-4 gap-2">
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
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white font-semibold uppercase">
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
  );
}
