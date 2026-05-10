import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OperationType } from '../types';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function convertTimestamps(obj: any): any {
  if (!obj) return obj;
  if (obj instanceof Timestamp) return obj.toMillis();
  if (Array.isArray(obj)) return obj.map(convertTimestamps);
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = convertTimestamps(obj[key]);
    }
    return newObj;
  }
  return obj;
}

export const firestoreService = {
  async getDocument<T>(path: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, path, id);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      return docSnap.exists() ? (convertTimestamps(data) as T) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${path}/${id}`);
      return null;
    }
  },

  async setDocument<T extends object>(path: string, id: string, data: T) {
    try {
      const docRef = doc(db, path, id);
      await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${id}`);
    }
  },

  async addDocument<T extends object>(collectionName: string, data: T) {
    try {
      const docRef = doc(collection(db, collectionName));
      await setDoc(docRef, { ...data, id: docRef.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionName);
    }
  },

  async listDocuments<T>(collectionName: string): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as T));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      return [];
    }
  },

  getCollectionListener<T>(
    collectionName: string, 
    conditions: { field: string; operator: any; value: any }[],
    callback: (data: T[]) => void
  ) {
    const q = query(
      collection(db, collectionName),
      ...conditions.map(c => where(c.field, c.operator, c.value))
    );

    return onSnapshot(q, 
      (snapshot) => {
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as T));
        // Sort in memory to avoid dropping docs without createdAt
        data = data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        callback(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      }
    );
  },

  async resetUserData(userId: string) {
    if (!userId) return;
    try {
      const collectionsToClear = ['invoices', 'customers', 'expenses', 'products', 'settings'];
      for (const collName of collectionsToClear) {
        const q = query(collection(db, collName), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      }
      return true;
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, 'reset-user-data');
       return false;
    }
  }
};
