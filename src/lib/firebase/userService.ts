import { db } from './auth';
import { collection, getDocs } from 'firebase/firestore';

export async function getEmployees() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
    .filter(u => u.role === 'employee'); 
}
