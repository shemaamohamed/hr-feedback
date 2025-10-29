export interface Employee {
  id: string;
  name: string;
}

export interface MergedItem {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: Date | null;
  conversationId: string | null;
  hasConversation: boolean;
}
