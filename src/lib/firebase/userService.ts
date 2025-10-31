import { db } from './auth';
import { collection, getDocs } from 'firebase/firestore';
import {  onSnapshot, query, where } from 'firebase/firestore';

export async function getEmployees() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs
    .map((doc) => {
      const raw = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        name: typeof raw.name === 'string' ? raw.name : '',
        role: typeof raw.role === 'string' ? raw.role : undefined,
      };
    })
    .filter((u) => u.role === 'employee');
}

export function subscribeEmployees(callback: (employees: { id: string; name: string; role?: string }[]) => void) {
  const q = query(collection(db, 'users'), where('role', '==', 'employee'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const employees = snapshot.docs.map((doc) => {
      const raw = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        name: typeof raw.name === 'string' ? raw.name : '',
        role: typeof raw.role === 'string' ? raw.role : undefined,
      };
    });

    callback(employees);
  });

  return unsubscribe;
}
