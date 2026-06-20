import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  INITIAL_SERVICES, 
  INITIAL_CLIENTS, 
  INITIAL_PROJECTS, 
  INITIAL_INCENTIVES,
  INITIAL_SALES_EMPLOYEES
} from '../data/mockData';
import { Service, Client, Project, Incentive, SalesEmployee } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCyw1X6bpHXh_cu4ZoPrX_yZ-RRtM6lQoY",
  authDomain: "skillful-grin-k6ppv.firebaseapp.com",
  projectId: "skillful-grin-k6ppv",
  storageBucket: "skillful-grin-k6ppv.firebasestorage.app",
  messagingSenderId: "1085522970663",
  appId: "1:1085522970663:web:27ca291f80553f8aaba602"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific Database ID
const db = getFirestore(app, "ai-studio-b426de26-e765-454b-af40-6d46739bbdf8");

export { db };

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
    console.error('Error fetching services from Firestore, using seeder fallback:', error);
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
    console.error('Error fetching clients from Firestore, using seeder fallback:', error);
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
    console.error('Error fetching projects from Firestore, using seeder fallback:', error);
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
    console.error('Error fetching incentives from Firestore, using seeder fallback:', error);
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
    console.error('Error fetching sales employees from Firestore, using seeder fallback:', error);
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
    console.error(`Failed to seed ${collectionName}:`, err);
  }
}

// CRUD operations
export async function dbAddService(service: Service) {
  await setDoc(doc(db, 'services', service.id), service);
}

export async function dbUpdateService(id: string, updated: Partial<Service>) {
  await updateDoc(doc(db, 'services', id), updated);
}

export async function dbDeleteService(id: string) {
  await deleteDoc(doc(db, 'services', id));
}

export async function dbAddClient(client: Client) {
  await setDoc(doc(db, 'clients', client.id), client);
}

export async function dbUpdateClient(id: string, updated: Partial<Client>) {
  await updateDoc(doc(db, 'clients', id), updated);
}

export async function dbDeleteClient(id: string) {
  await deleteDoc(doc(db, 'clients', id));
}

export async function dbAddProject(project: Project) {
  await setDoc(doc(db, 'projects', project.id), project);
}

export async function dbUpdateProject(id: string, updated: Partial<Project>) {
  await updateDoc(doc(db, 'projects', id), updated);
}

export async function dbDeleteProject(id: string) {
  await deleteDoc(doc(db, 'projects', id));
}

export async function dbAddIncentive(incentive: Incentive) {
  await setDoc(doc(db, 'incentives', incentive.id), incentive);
}

export async function dbUpdateIncentive(id: string, updated: Partial<Incentive>) {
  await updateDoc(doc(db, 'incentives', id), updated);
}

export async function dbDeleteIncentive(id: string) {
  await deleteDoc(doc(db, 'incentives', id));
}

export async function dbAddSalesEmployee(employee: SalesEmployee) {
  await setDoc(doc(db, 'sales_employees', employee.id), employee);
}

export async function dbUpdateSalesEmployee(id: string, updated: Partial<SalesEmployee>) {
  await updateDoc(doc(db, 'sales_employees', id), updated);
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
