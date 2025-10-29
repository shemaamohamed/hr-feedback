"use client";
import React from "react";
import { Input } from "@/components/ui/input";

export default function EmployeeList({ mergedList, search, setSearch, openChatWith }: any) {
  return (
    <div className="w-full md:w-1/3 border-r bg-white dark:bg-gray-900 overflow-y-auto">
      <div className="p-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن موظف..."
          className="w-full"
        />
      </div>

      <ul>
        {mergedList.map((emp: any) => (
          <li
            key={emp.id}
            onClick={() => openChatWith(emp.id, emp.name)}
            className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 border-b"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{emp.name}</span>
              {emp.lastMessageTime && (
                <span className="text-xs text-gray-500">
                  {emp.lastMessageTime.toLocaleString("ar-EG")}
                </span>
              )}
            </div>
            {emp.lastMessage && (
              <p className="text-sm text-gray-600 truncate">{emp.lastMessage}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
