import {
  collection,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./auth";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp?: any;
  isRead: boolean;
  replyTo?: { senderName: string; message: string; messageId: string } | null;
}


export interface Conversation {
  id?: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Timestamp;
  lastMessageSenderId: string;
}

export const chatService = {
  async sendMessage(
    conversationId: string,
    message: Omit<ChatMessage, "id" | "timestamp" | "conversationId">
  ) {
    const docRef = await addDoc(collection(db, "messages"), {
      ...message,
      conversationId,
      timestamp: Timestamp.now(),
      replyTo: message.replyTo || null,
    });

    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessage: message.message,
      lastMessageTime: Timestamp.now(),
      lastMessageSenderId: message.senderId,
    });

    return docRef.id;
  },

  async deleteMessage(messageId: string, conversationId: string, currentUserId: string) {
    const messageRef = doc(db, "messages", messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) throw new Error("Message not found");

    const messageData = messageSnap.data() as ChatMessage;
    if (messageData.senderId !== currentUserId)
      throw new Error("Unauthorized: You can only delete your own messages");

    await updateDoc(messageRef, {
      message: "🗑️ Deleted",
      isDeleted: true,
      editedAt: Timestamp.now(),
    });

    const convoRef = doc(db, "conversations", conversationId);
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty && snapshot.docs[0].id === messageId) {
      await updateDoc(convoRef, {
        lastMessage: "🗑️ Deleted",
        lastMessageTime: Timestamp.now(),
      });
    }
  },

  async createConversation(
    participants: string[],
    participantNames: { [key: string]: string }
  ) {
    const docRef = await addDoc(collection(db, "conversations"), {
      participants,
      participantNames,
      lastMessage: "",
      lastMessageTime: Timestamp.now(),
      lastMessageSenderId: "",
    });
    return docRef.id;
  },

  subscribeToConversation(
    conversationId: string,
    callback: (messages: (ChatMessage & { id: string })[]) => void
  ) {
    return onSnapshot(
      query(collection(db, "messages"), where("conversationId", "==", conversationId), orderBy("timestamp", "asc")),
      (snapshot) => {
        const messages = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as ChatMessage) }));
        callback(messages);
      }
    );
  },

  subscribeToConversations(
    userId: string,
    callback: (conversations: (Conversation & { id: string })[]) => void
  ) {
    return onSnapshot(
      query(collection(db, "conversations"), where("participants", "array-contains", userId), orderBy("lastMessageTime", "desc")),
      (snapshot) => {
        const conversations = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Conversation) }));
        callback(conversations);
      }
    );
  },
};
