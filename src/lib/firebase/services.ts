import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from './auth';

export interface Feedback {
  id?: string;
  employeeId: string;
  employeeName: string;
  notes: string;
  score: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Timestamp;
  isRead: boolean;
  isDeleted?: boolean;
  replyTo?: string; // 🆕 ID of the message being replied to
}


export interface Conversation {
  id?: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Timestamp;
  lastMessageSenderId: string;
}


export interface Notification {
  id?: string;
  userId: string;
  type: 'feedback' | 'message' | 'task';
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  relatedId?: string;
}

export const feedbackService = {
  async submitFeedback(feedback: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'feedback'), {
        ...feedback,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  async updateFeedback(id: string, data: Partial<Feedback>) {
  const docRef = doc(db, 'feedback', id);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}
,

   async deleteFeedback(feedbackId: string) {
    try {
      await deleteDoc(doc(db, 'feedback', feedbackId));
      console.log(`Feedback ${feedbackId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  },

  subscribeFeedback(callback: (feedback: (Feedback & { id: string })[]) => void) {
    try {
      const q = query(collection(db, 'feedback'), orderBy('updatedAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
      const feedbackList = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as unknown as Feedback) })) as (Feedback & { id: string })[];
        callback(feedbackList);
      });
    } catch (error) {
      console.error('Error subscribing to feedback:', error);
      throw error;
    }
  },

};

export const chatService = {
 async sendMessage(
  conversationId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp' | 'conversationId'>
) {
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...message,
      conversationId,
      timestamp: Timestamp.now(),
      replyTo: message.replyTo || null, // ✅ أضف هذا السطر
    });

    // تحديث آخر رسالة في المحادثة
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: message.message,
        lastMessageTime: Timestamp.now(),
        lastMessageSenderId: message.senderId,
      });
    } catch (err) {
      console.error('Failed to update conversation lastMessage:', err);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
},

 async deleteMessage(messageId: string, conversationId: string, currentUserId: string) {
  try {
    const messageRef = doc(db, "messages", messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) throw new Error("Message not found");

    const messageData = messageSnap.data() as ChatMessage;

    if (messageData.senderId !== currentUserId) {
      throw new Error("Unauthorized: You can only delete your own messages");
    }

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
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
},




  async createConversation(participants: string[], participantNames: { [key: string]: string }) {
    try {
      const docRef = await addDoc(collection(db, 'conversations'), {
        participants,
        participantNames,
        lastMessage: '',
        lastMessageTime: Timestamp.now(),
        lastMessageSenderId: '',
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  subscribeToConversation(conversationId: string, callback: (messages: (ChatMessage & { id: string })[]) => void) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );
      return onSnapshot(q, (snapshot) => {
  const messages = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as unknown as ChatMessage) })) as (ChatMessage & { id: string })[];
        callback(messages);
      });
    } catch (error) {
      console.error('Error subscribing to conversation:', error);
      throw error;
    }
  },

  subscribeToConversations(userId: string, callback: (conversations: (Conversation & { id: string })[]) => void) {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
  const conversations = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as unknown as Conversation) })) as (Conversation & { id: string })[];
        callback(conversations);
      });
    } catch (error) {
      console.error('Error subscribing to conversations:', error);
      throw error;
    }
  },
};



export const notificationService = {
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: string) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  subscribeNotifications(userId: string, callback: (notifications: (Notification & { id: string })[]) => void) {
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
  const notifications = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as unknown as Notification) })) as (Notification & { id: string })[];
        callback(notifications);
      });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  },
};
