import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "./auth";
import { getEmployees } from "./userService";

export interface Feedback {
  id?: string;
  employeeId: string;
  employeeName: string;
  notes: string;
  score: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Conversation {
  id?: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Timestamp;
  lastMessageSenderId: string;
}

export const feedbackService = {
  async submitFeedback(
    feedback: Omit<Feedback, "id" | "createdAt" | "updatedAt">
  ) {
    const docRef = await addDoc(collection(db, "feedback"), {
      ...feedback,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async updateFeedback(id: string, data: Partial<Feedback>) {
    await updateDoc(doc(db, "feedback", id), {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteFeedback(feedbackId: string) {
    await deleteDoc(doc(db, "feedback", feedbackId));
  },

  subscribeFeedback(callback: (feedback: (Feedback & { id: string })[]) => void) {
    const q = query(collection(db, "feedback"), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const feedbackList = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Feedback),
      }));
      callback(feedbackList);
    });
  },

  // 🔹 جلب الموظفين + آخر محادثة + feedback
  async getEmployeesWithFeedbackAndConversations(hrId: string) {
    const employeeMap = new Map<string, any>();

    // الموظفين
    const employees = await getEmployees();
    employees.forEach((emp) => {
      employeeMap.set(emp.id, {
        id: emp.id,
        name: emp.name,
        lastMessage: "No message yet",
        lastMessageTime: null,
      });
    });

    // المحادثات
    const convSnapshot = await getDocs(
      query(collection(db, "conversations"), where("participants", "array-contains", hrId))
    );
    convSnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Conversation;
      const employeeId = data.participants.find((p) => p !== hrId);
      if (!employeeId) return;

      const prev = employeeMap.get(employeeId) || {};
      employeeMap.set(employeeId, {
        ...prev,
        lastMessage: data.lastMessage || "No message yet",
        lastMessageTime: data.lastMessageTime?.toDate?.() || null,
      });
    });

    // feedback
    const feedbackSnapshot = await getDocs(collection(db, "feedback"));
    feedbackSnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Feedback;
      if (data.employeeId && employeeMap.has(data.employeeId)) {
        const prev = employeeMap.get(data.employeeId);
        employeeMap.set(data.employeeId, {
          ...prev,
        });
      }
    });

    return Array.from(employeeMap.values()).sort((a, b) => {
      if (!a.lastMessageTime && !b.lastMessageTime) return 0;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
    });
  },

  // 🔹 subscribe لحظي على الموظفين + feedback + المحادثات
  subscribeEmployeesWithFeedbackAndConversations(
    hrId: string,
    callback: (employees: {
      id: string;
      name: string;
      lastMessage: string;
      lastMessageTime: Date | null;
    }[]) => void
  ) {
    const employeeMap = new Map<string, any>();

    const emitEmployees = () => {
      const employees = Array.from(employeeMap.values()).sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      });
      callback(employees);
    };

    // الموظفين
    const unsubEmployees = onSnapshot(
      query(collection(db, "users"), where("role", "==", "employee")),
      (snapshot) => {
        const currentIds = new Set<string>();

        snapshot.docs.forEach((docSnap) => {
          const emp = { id: docSnap.id, ...(docSnap.data() as any) };
          currentIds.add(emp.id);
          employeeMap.set(emp.id, {
            id: emp.id,
            name: emp.name,
            lastMessage: employeeMap.get(emp.id)?.lastMessage || "No message yet",
            lastMessageTime: employeeMap.get(emp.id)?.lastMessageTime || null,
          });
        });

        for (const id of employeeMap.keys()) {
          if (!currentIds.has(id)) employeeMap.delete(id);
        }

        emitEmployees();
      }
    );

    // feedback
    const unsubFeedback = onSnapshot(
      query(collection(db, "feedback"), orderBy("updatedAt", "desc")),
      (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as Feedback;
          if (data.employeeId) {
            const prev = employeeMap.get(data.employeeId) || {};
            employeeMap.set(data.employeeId, { ...prev });
          }
        });
        emitEmployees();
      }
    );

    // المحادثات
    const unsubConv = onSnapshot(
      query(collection(db, "conversations"), where("participants", "array-contains", hrId)),
      (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as Conversation;
          const employeeId = data.participants.find((p) => p !== hrId);
          if (!employeeId) return;

          const prev = employeeMap.get(employeeId) || {};
          employeeMap.set(employeeId, {
            ...prev,
            lastMessage: data.lastMessage || "No message yet",
            lastMessageTime: data.lastMessageTime?.toDate?.() || null,
          });
        });
        emitEmployees();
      }
    );

    return () => {
      unsubEmployees();
      unsubFeedback();
      unsubConv();
    };
  },
};
