/* eslint-disable @typescript-eslint/no-explicit-any */

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
  // Normalize raw Firestore data into a Feedback with required fields and safe defaults.
  normalize(docId: string, data: Record<string, unknown>): Feedback & { id: string } {
    const rawScore = (data as Record<string, unknown>)['score'];
    const score = typeof rawScore === 'number' ? (rawScore as number) : Number(String(rawScore)) || 0;
    const employeeId = typeof data['employeeId'] === 'string' ? (data['employeeId'] as string) : '';
    const employeeName = typeof data['employeeName'] === 'string' ? (data['employeeName'] as string) : '';
    const notes = typeof data['notes'] === 'string' ? (data['notes'] as string) : '';
    const createdRaw = data['createdAt'];
    const updatedRaw = data['updatedAt'];
    const isTimestampLike = (v: unknown): v is { toDate: () => Date } =>
      typeof v === 'object' && v !== null && typeof (v as any).toDate === 'function';
    const createdAt = isTimestampLike(createdRaw) ? (createdRaw as any) : Timestamp.now();
    const updatedAt = isTimestampLike(updatedRaw) ? (updatedRaw as any) : Timestamp.now();

    return {
      id: docId,
      employeeId,
      employeeName,
      notes,
      score,
      createdAt,
      updatedAt,
    };
  },
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
    const payload: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
    if (data.score !== undefined) {
      const rawScore = (data as unknown as Record<string, unknown>).score;
      payload.score = typeof rawScore === 'number' ? rawScore : Number(String(rawScore)) || 0;
    }
    await updateDoc(doc(db, "feedback", id), payload);
  },

  async deleteFeedback(feedbackId: string) {
    await deleteDoc(doc(db, "feedback", feedbackId));
  },

  subscribeFeedback(callback: (feedback: (Feedback & { id: string })[]) => void) {
    const q = query(collection(db, "feedback"), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const feedbackList = snapshot.docs.map((d) => feedbackService.normalize(d.id, d.data()));
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
          const raw = docSnap.data() as Record<string, unknown>;
          const empId = String(raw.id ?? docSnap.id);
          const name = String(raw.name ?? '');
          currentIds.add(empId);
          employeeMap.set(empId, {
            id: empId,
            name,
            lastMessage: (employeeMap.get(empId) as any)?.lastMessage || "No message yet",
            lastMessageTime: (employeeMap.get(empId) as any)?.lastMessageTime || null,
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
