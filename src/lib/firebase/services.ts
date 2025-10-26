import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
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
}

export interface Conversation {
  id?: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Timestamp;
  lastMessageSenderId: string;
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  status: 'pending' | 'in-progress' | 'done';
  deadline: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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

  async updateFeedbackStatus(feedbackId: string) {
    try {
      await updateDoc(doc(db, 'feedback', feedbackId), {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  },

  subscribeFeedback(callback: (feedback: (Feedback & { id: string })[]) => void) {
    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
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
  async sendMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'conversationId'>) {
    try {
      // Add message document
      const docRef = await addDoc(collection(db, 'messages'), {
        ...message,
        conversationId,
        timestamp: Timestamp.now(),
      });

      // Also update parent conversation's last message atomically
      try {
        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessage: message.message,
          lastMessageTime: Timestamp.now(),
          lastMessageSenderId: message.senderId,
        });
      } catch (err) {
        // Non-fatal: log but don't block message send
        console.error('Failed to update conversation lastMessage:', err);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
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

export const taskService = {
  async assignTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...task,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  },

  async updateTaskStatus(taskId: string, status: Task['status']) {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  subscribeTasks(employeeId: string, callback: (tasks: (Task & { id: string })[]) => void) {
    try {
      const q = query(collection(db, 'tasks'), where('assignedTo', '==', employeeId), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
  const tasks = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as unknown as Task) })) as (Task & { id: string })[];
        callback(tasks);
      });
    } catch (error) {
      console.error('Error subscribing to tasks:', error);
      throw error;
    }
  },

  subscribeAllTasks(callback: (tasks: (Task & { id: string })[]) => void) {
    try {
      const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
  const tasks = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as unknown as Task) })) as (Task & { id: string })[];
        callback(tasks);
      });
    } catch (error) {
      console.error('Error subscribing to all tasks:', error);
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
