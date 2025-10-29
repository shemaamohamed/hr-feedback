import {
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
} from "firebase/firestore";
import { db } from "./auth";

export interface Notification {
  id?: string;
  userId: string;
  type: "feedback" | "message" | "task";
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  relatedId?: string;
}

export const notificationService = {
  async createNotification(notification: Omit<Notification, "id" | "createdAt">) {
    const docRef = await addDoc(collection(db, "notifications"), {
      ...notification,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async markAsRead(notificationId: string) {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
  },

  subscribeNotifications(
    userId: string,
    callback: (notifications: (Notification & { id: string })[]) => void
  ) {
    return onSnapshot(
      query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc")),
      (snapshot) => {
        const notifications = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Notification),
        }));
        callback(notifications);
      }
    );
  },
};
