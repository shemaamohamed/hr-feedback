import { db } from './auth';
import { collection, getDocs } from 'firebase/firestore';
import {  onSnapshot, query, where } from 'firebase/firestore';

export async function getEmployees() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
    .filter(u => u.role === 'employee'); 
}
export function subscribeEmployees(callback: (employees: any[]) => void) {
  const q = query(collection(db, 'users'), where('role', '==', 'employee'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const employees = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));

    callback(employees);
  });

  return unsubscribe;
}
