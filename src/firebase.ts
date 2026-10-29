import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
  runTransaction
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);

export const PRIMARY_ADMIN_EMAIL = 'mhaq1980@gmail.com';
export const ADMIN_EMAIL = PRIMARY_ADMIN_EMAIL; // Alias untuk keserasian sedia ada
export const SENSAVOUR_URL = 'https://borneosensorywheel.netlify.app';
export const MIN_EXPLORE_SECONDS = 60; // 1 minit (mesti selaras dengan firestore.rules)

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
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

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
    }
  }
}

/**
 * Menjana nombor giliran automatik (running number) secara atomik dalam Firestore.
 * Contoh output: S001, S002, S003...
 */
export async function getNextParticipantCode(): Promise<string> {
  const counterRef = doc(db, 'counters', 'participants');
  try {
    const nextNum = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      let count = 1;
      if (snap.exists()) {
        const data = snap.data();
        const currentCount = typeof data?.count === 'number' ? data.count : 0;
        count = currentCount + 1;
        transaction.update(counterRef, { count });
      } else {
        transaction.set(counterRef, { count });
      }
      return count;
    });
    return `S${String(nextNum).padStart(3, '0')}`;
  } catch (err) {
    console.error('Error generating running participant code:', err);
    // Fallback jika kaunter gagal diakses: nombor masa rawak
    const fallback = Math.floor(100 + Math.random() * 899);
    return `S${fallback}`;
  }
}

/**
 * Mendapatkan nilai kaunter giliran semasa dari Firestore
 */
export async function getCurrentCounter(): Promise<number> {
  const counterRef = doc(db, 'counters', 'participants');
  try {
    const snap = await getDoc(counterRef);
    if (snap.exists()) {
      return snap.data()?.count || 0;
    }
  } catch (err) {
    console.warn('Could not read counter:', err);
  }
  return 0;
}

/**
 * Mengemaskini atau menetapkan semula kaunter (untuk kegunaan penyelidik/admin)
 */
export async function updateCounter(newCount: number): Promise<void> {
  const counterRef = doc(db, 'counters', 'participants');
  await setDoc(counterRef, { count: newCount }, { merge: true });
}

/**
 * Memadam rekod peserta tertentu dari Firestore
 */
export async function deleteParticipantRecord(uid: string): Promise<void> {
  const ref = doc(db, 'participants', uid);
  await deleteDoc(ref);
}

/**
 * Memadam pelbagai rekod peserta (untuk pembersihan data ujian)
 */
export async function deleteMultipleParticipants(uids: string[]): Promise<void> {
  for (const uid of uids) {
    const ref = doc(db, 'participants', uid);
    await deleteDoc(ref);
  }
}

/**
 * Mendapatkan senarai semua email penyelidik yang diberi kebenaran
 */
export async function fetchAdminEmails(): Promise<string[]> {
  try {
    const adminsCol = collection(db, 'admins');
    const snap = await getDocs(adminsCol);
    const emails = new Set<string>([PRIMARY_ADMIN_EMAIL.toLowerCase().trim()]);
    snap.forEach(docSnap => {
      const email = docSnap.id || docSnap.data()?.email;
      if (email) emails.add(email.toLowerCase().trim());
    });
    return Array.from(emails);
  } catch (err) {
    console.warn('Could not fetch admins collection (might be empty or rules restricted):', err);
    return [PRIMARY_ADMIN_EMAIL.toLowerCase().trim()];
  }
}

/**
 * Mendaftarkan email penyelidik baharu ke dalam Firestore
 */
export async function addAdminEmail(email: string, addedByEmail: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const ref = doc(db, 'admins', cleanEmail);
  await setDoc(ref, {
    email: cleanEmail,
    addedAt: new Date().toISOString(),
    addedBy: addedByEmail
  });
}

/**
 * Mengeluarkan email penyelidik daripada senarai pentadbir
 */
export async function removeAdminEmail(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const ref = doc(db, 'admins', cleanEmail);
  await deleteDoc(ref);
}

export interface AdminRequestRecord {
  email: string;
  displayName?: string;
  photoURL?: string;
  requestedAt: string;
}

/**
 * Menghantar rekod permohonan akses penyelidik secara automatik apabila akaun Google log masuk
 */
export async function submitAdminRequest(
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const ref = doc(db, 'admin_requests', cleanEmail);
  await setDoc(ref, {
    email: cleanEmail,
    displayName: displayName || cleanEmail.split('@')[0],
    photoURL: photoURL || '',
    requestedAt: new Date().toISOString()
  });
}

/**
 * Mendapatkan senarai semua permohonan akses penyelidik yang belum diluluskan
 */
export async function fetchAdminRequests(): Promise<AdminRequestRecord[]> {
  try {
    const col = collection(db, 'admin_requests');
    const snap = await getDocs(col);
    const list: AdminRequestRecord[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        email: docSnap.id || data.email,
        displayName: data.displayName || '',
        photoURL: data.photoURL || '',
        requestedAt: data.requestedAt || ''
      });
    });
    return list;
  } catch (err) {
    console.warn('Could not fetch admin requests:', err);
    return [];
  }
}

/**
 * Meluluskan permohonan: tambah terus ke koleksi admins dan padam dari senarai menunggu
 */
export async function approveAdminRequest(email: string, approvedByEmail: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  await addAdminEmail(cleanEmail, approvedByEmail);
  try {
    await deleteDoc(doc(db, 'admin_requests', cleanEmail));
  } catch (e) {
    console.warn('Could not delete admin request doc after approving:', e);
  }
}

/**
 * Menolak permohonan akses penyelidik
 */
export async function rejectAdminRequest(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  await deleteDoc(doc(db, 'admin_requests', cleanEmail));
}

