import type { Timestamp } from 'firebase/firestore';

export type Feedback = {
  id?: string;
  employeeId?: string;
  employeeName?: string;
  notes?: string;
  score: number;
  updatedAt?: Timestamp | Date | { seconds?: number } | null;
};
