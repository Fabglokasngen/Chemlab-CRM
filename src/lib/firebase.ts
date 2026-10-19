import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  INITIAL_SERVICES, 
  INITIAL_CLIENTS, 
  INITIAL_PROJECTS, 
  INITIAL_INCENTIVES,
  INITIAL_SALES_EMPLOYEES
} from '../data/mockData';
import { Service, Client, Project, Incentive, SalesEmployee, UserProfile, UserRole } from '../types';

import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific Database ID from config
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth & Providers
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider };

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  return errInfo;
}

// --- USER PROFILE & AUTH FIRESTORE SERVICES ---
export async function getUserProfileDoc(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userDocRef);
    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function saveUserProfileDoc(profile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', profile.uid);
    await setDoc(userDocRef, profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
  }
}

// Firestore collection operations with local cache fallback
export async function getServicesFromDb(): Promise<Service[]> {
  try {
    const colRef = collection(db, 'services');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      await seedCollection('services', INITIAL_SERVICES);
      return INITIAL_SERVICES;
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'services');
    return INITIAL_SERVICES;
  }
}

export async function getClientsFromDb(): Promise<Client[]> {
  try {
    const colRef = collection(db, 'clients');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      await seedCollection('clients', INITIAL_CLIENTS);
      return INITIAL_CLIENTS;
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'clients');
    return INITIAL_CLIENTS;
  }
}

export async function getProjectsFromDb(): Promise<Project[]> {
  try {
    const colRef = collection(db, 'projects');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      await seedCollection('projects', INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'projects');
    return INITIAL_PROJECTS;
  }
}

export async function getIncentivesFromDb(): Promise<Incentive[]> {
  try {
    const colRef = collection(db, 'incentives');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      await seedCollection('incentives', INITIAL_INCENTIVES);
      return INITIAL_INCENTIVES;
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incentive));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'incentives');
    return INITIAL_INCENTIVES;
  }
}

export async function getSalesEmployeesFromDb(): Promise<SalesEmployee[]> {
  try {
    const colRef = collection(db, 'sales_employees');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      await seedCollection('sales_employees', INITIAL_SALES_EMPLOYEES);
      return INITIAL_SALES_EMPLOYEES;
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesEmployee));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'sales_employees');
    return INITIAL_SALES_EMPLOYEES;
  }
}

// Seeder helper
async function seedCollection(collectionName: string, initialData: any[]) {
  console.log(`Seeding ${collectionName} collection with initial dataset...`);
  try {
    const batch = writeBatch(db);
    initialData.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item);
    });
    await batch.commit();
    console.log(`Seeding ${collectionName} completed successfully.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
  }
}

// Helper to recursively remove undefined fields so Firestore doesn't throw errors
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefined(value);
    }
  }
  return cleaned as T;
}

// CRUD operations
export async function dbAddService(service: Service) {
  const currentUid = auth.currentUser?.uid;
  const currentEmail = auth.currentUser?.email;
  const data = cleanUndefined({
    ...service,
    ...(currentUid ? { userId: currentUid } : {}),
    ...(currentEmail ? { ownerEmail: currentEmail } : {})
  });
  await setDoc(doc(db, 'services', service.id), data);
}

export async function dbUpdateService(id: string, updated: Partial<Service>) {
  await updateDoc(doc(db, 'services', id), cleanUndefined(updated));
}

export async function dbDeleteService(id: string) {
  await deleteDoc(doc(db, 'services', id));
}

export async function dbAddClient(client: Client) {
  const currentUid = auth.currentUser?.uid;
  const currentEmail = auth.currentUser?.email;
  const data = cleanUndefined({
    ...client,
    ...(currentUid && !client.userId ? { userId: currentUid } : {}),
    ...(currentEmail && !client.ownerEmail ? { ownerEmail: currentEmail } : {})
  });
  await setDoc(doc(db, 'clients', client.id), data);
}

export async function dbUpdateClient(id: string, updated: Partial<Client>) {
  await updateDoc(doc(db, 'clients', id), cleanUndefined(updated));
}

export async function dbDeleteClient(id: string) {
  await deleteDoc(doc(db, 'clients', id));
}

export async function dbAddProject(project: Project) {
  const currentUid = auth.currentUser?.uid;
  const currentEmail = auth.currentUser?.email;
  const data = cleanUndefined({
    ...project,
    ...(currentUid && !project.userId ? { userId: currentUid } : {}),
    ...(currentEmail && !project.ownerEmail ? { ownerEmail: currentEmail } : {})
  });
  await setDoc(doc(db, 'projects', project.id), data);
}

export async function dbUpdateProject(id: string, updated: Partial<Project>) {
  await updateDoc(doc(db, 'projects', id), cleanUndefined(updated));
}

export async function dbDeleteProject(id: string) {
  await deleteDoc(doc(db, 'projects', id));
}

export async function dbAddIncentive(incentive: Incentive) {
  const currentUid = auth.currentUser?.uid;
  const currentEmail = auth.currentUser?.email;
  const data = cleanUndefined({
    ...incentive,
    ...(currentUid && !incentive.userId ? { userId: currentUid } : {}),
    ...(currentEmail && !incentive.ownerEmail ? { ownerEmail: currentEmail } : {})
  });
  await setDoc(doc(db, 'incentives', incentive.id), data);
}

export async function dbUpdateIncentive(id: string, updated: Partial<Incentive>) {
  await updateDoc(doc(db, 'incentives', id), cleanUndefined(updated));
}

export async function dbDeleteIncentive(id: string) {
  await deleteDoc(doc(db, 'incentives', id));
}

export async function dbAddSalesEmployee(employee: SalesEmployee) {
  await setDoc(doc(db, 'sales_employees', employee.id), cleanUndefined(employee));
}

export async function dbUpdateSalesEmployee(id: string, updated: Partial<SalesEmployee>) {
  await updateDoc(doc(db, 'sales_employees', id), cleanUndefined(updated));
}

export async function dbDeleteSalesEmployee(id: string) {
  await deleteDoc(doc(db, 'sales_employees', id));
}

// Total Reset to Standard database
export async function dbResetToStandard() {
  const batch = writeBatch(db);
  
  // Clear any existing if fetched or just overwrite
  INITIAL_SERVICES.forEach((item) => {
    batch.set(doc(db, 'services', item.id), item);
  });
  INITIAL_CLIENTS.forEach((item) => {
    batch.set(doc(db, 'clients', item.id), item);
  });
  INITIAL_PROJECTS.forEach((item) => {
    batch.set(doc(db, 'projects', item.id), item);
  });
  INITIAL_INCENTIVES.forEach((item) => {
    batch.set(doc(db, 'incentives', item.id), item);
  });
  INITIAL_SALES_EMPLOYEES.forEach((item) => {
    batch.set(doc(db, 'sales_employees', item.id), item);
  });
  await batch.commit();
}

// --- NULLIUS MASTER SALES & JOURNAL FIRESTORE OPS ---
export async function getMasterSalesFromDb(): Promise<any[]> {
  try {
    const colRef = collection(db, 'master_sales');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'master_sales');
    return [];
  }
}

export async function saveMasterSalesBatchToDb(records: any[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    // Firestore batch limit is 500
    const slice = records.slice(0, 450);
    slice.forEach(r => {
      const docRef = doc(db, 'master_sales', r.id);
      batch.set(docRef, cleanUndefined(r));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'master_sales');
  }
}

export async function dbSaveMasterSaleRecord(record: any): Promise<void> {
  try {
    await setDoc(doc(db, 'master_sales', record.id), cleanUndefined(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `master_sales/${record.id}`);
  }
}

export async function dbDeleteMasterSaleRecord(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'master_sales', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `master_sales/${id}`);
  }
}

export async function getSalesJournalsFromDb(): Promise<any[]> {
  try {
    const colRef = collection(db, 'sales_journals');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'sales_journals');
    return [];
  }
}

export async function dbSaveJournalEntry(entry: any): Promise<void> {
  try {
    await setDoc(doc(db, 'sales_journals', entry.id), cleanUndefined(entry), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `sales_journals/${entry.id}`);
  }
}

export async function dbDeleteJournalEntry(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'sales_journals', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sales_journals/${id}`);
  }
}
