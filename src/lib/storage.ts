import { 
  CSCConfig, 
  Customer, 
  ServiceTransaction, 
  CertificateApplication, 
  ScholarshipApplication,
  PANApplication,
  ScholarshipActivity,
  ImportantLink,
  CloudBackupPayload 
} from '../types';
import { 
  defaultCSCConfig, 
  initialCustomers, 
  initialTransactions, 
  initialCertificates,
  initialScholarships,
  initialPANApplications,
  defaultImportantLinks
} from '../data/initialData';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, DocumentReference } from 'firebase/firestore';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// In-memory active user dataset
let activeUserPayload: CloudBackupPayload | null = null;
let currentActiveUid: string | null = null;

function getUserStorageKey(uid: string): string {
  return `csc_user_data_v2_${uid}`;
}

export function getUserDocRef(userUid?: string): DocumentReference {
  const uid = userUid || auth.currentUser?.uid;
  if (!uid) {
    throw new Error('User authentication UID is required for Firestore operations.');
  }
  return doc(db, 'users', uid);
}

// Clear in-memory payload on logout
export function clearUserSession(): void {
  activeUserPayload = null;
  currentActiveUid = null;
}

export function initLocalStorage(): void {
  // No-op for global defaults, data is bound to user UID
}

function getActivePayload(uid?: string): CloudBackupPayload {
  const targetUid = uid || auth.currentUser?.uid || currentActiveUid;
  if (activeUserPayload && currentActiveUid === targetUid) {
    return activeUserPayload;
  }

  if (targetUid) {
    const raw = localStorage.getItem(getUserStorageKey(targetUid));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        activeUserPayload = parsed;
        currentActiveUid = targetUid;
        return parsed;
      } catch {
        // Fallback
      }
    }
  }

  // Fallback empty default payload for unauthenticated or initializing user
  return {
    lastUpdated: new Date().toISOString(),
    cscConfig: defaultCSCConfig,
    customers: [],
    transactions: [],
    certificates: [],
    scholarships: [],
    panApplications: [],
    importantLinks: defaultImportantLinks,
  };
}

/**
 * Save draft payload to Firestore FIRST.
 * ONLY after Firestore write succeeds, update local cache and in-memory payload.
 * If internet is offline or Firestore write fails, throw error and DO NOT touch local cache.
 */
async function savePayloadToFirestoreAndCache(draftPayload: CloudBackupPayload, targetUid?: string): Promise<void> {
  const uid = targetUid || auth.currentUser?.uid || currentActiveUid;
  if (!uid) {
    throw new Error('User authentication required to save changes.');
  }

  if (!navigator.onLine) {
    throw new Error('🔴 You are not connected to the internet. Please check your internet connection.');
  }

  draftPayload.lastUpdated = new Date().toISOString();

  // 1. Write to Firestore FIRST
  try {
    const userDocRef = getUserDocRef(uid);
    await setDoc(userDocRef, draftPayload, { merge: true });
  } catch (err: any) {
    console.error('Firestore write failed:', err);
    throw new Error('Unable to save data. Please check your internet connection and try again.');
  }

  // 2. ONLY AFTER Firestore write succeeds: update local cache & active in-memory payload
  activeUserPayload = JSON.parse(JSON.stringify(draftPayload));
  currentActiveUid = uid;
  localStorage.setItem(getUserStorageKey(uid), JSON.stringify(activeUserPayload));

  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  localStorage.setItem('csc_last_sync_time', timeStr);
}

// Fetch primary user cloud data from Firestore
export async function fetchCloudBackupData(userUid?: string): Promise<CloudBackupPayload | null> {
  const uid = userUid || auth.currentUser?.uid;
  if (!uid) return null;

  try {
    const userDocRef = getUserDocRef(uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const cloudData = docSnap.data() as CloudBackupPayload;
      activeUserPayload = {
        lastUpdated: cloudData.lastUpdated || new Date().toISOString(),
        cscConfig: cloudData.cscConfig || defaultCSCConfig,
        customers: Array.isArray(cloudData.customers) ? cloudData.customers : [],
        transactions: Array.isArray(cloudData.transactions) ? cloudData.transactions : [],
        certificates: Array.isArray(cloudData.certificates) ? cloudData.certificates : [],
        scholarships: Array.isArray(cloudData.scholarships) ? cloudData.scholarships : [],
        panApplications: Array.isArray(cloudData.panApplications) ? cloudData.panApplications : [],
        importantLinks: Array.isArray(cloudData.importantLinks) ? cloudData.importantLinks : defaultImportantLinks,
      };
      currentActiveUid = uid;
      localStorage.setItem(getUserStorageKey(uid), JSON.stringify(activeUserPayload));
      return activeUserPayload;
    } else {
      // First-time user setup in Firestore
      const cached = localStorage.getItem(getUserStorageKey(uid));
      let initialPayload: CloudBackupPayload;

      if (cached) {
        try {
          initialPayload = JSON.parse(cached);
        } catch {
          initialPayload = {
            lastUpdated: new Date().toISOString(),
            cscConfig: defaultCSCConfig,
            customers: initialCustomers,
            transactions: initialTransactions,
            certificates: initialCertificates,
            scholarships: initialScholarships,
            panApplications: initialPANApplications,
            importantLinks: defaultImportantLinks,
          };
        }
      } else {
        initialPayload = {
          lastUpdated: new Date().toISOString(),
          cscConfig: defaultCSCConfig,
          customers: initialCustomers,
          transactions: initialTransactions,
          certificates: initialCertificates,
          scholarships: initialScholarships,
          panApplications: initialPANApplications,
          importantLinks: defaultImportantLinks,
        };
      }

      if (navigator.onLine) {
        try {
          await setDoc(userDocRef, initialPayload);
        } catch (err) {
          console.warn('Initial user doc create notice:', err);
        }
      }

      activeUserPayload = initialPayload;
      currentActiveUid = uid;
      localStorage.setItem(getUserStorageKey(uid), JSON.stringify(initialPayload));
      return initialPayload;
    }
  } catch (err: any) {
    if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
      console.warn('Network offline or client unavailable, falling back to local cached data');
    } else {
      console.warn('Could not fetch user cloud data:', err?.message || err);
    }
    const cached = localStorage.getItem(getUserStorageKey(uid));
    if (cached) {
      try {
        activeUserPayload = JSON.parse(cached);
        currentActiveUid = uid;
        return activeUserPayload;
      } catch {
        // Ignore
      }
    }
  }
  return null;
}

// Subscribe to real-time sync for current authenticated user
export function subscribeToRealtimeSync(onDataChanged: (data?: CloudBackupPayload) => void, userUid?: string): () => void {
  const uid = userUid || auth.currentUser?.uid;
  if (!uid) {
    return () => {};
  }

  try {
    const userDocRef = getUserDocRef(uid);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as CloudBackupPayload;
        activeUserPayload = {
          lastUpdated: cloudData.lastUpdated || new Date().toISOString(),
          cscConfig: cloudData.cscConfig || defaultCSCConfig,
          customers: Array.isArray(cloudData.customers) ? cloudData.customers : [],
          transactions: Array.isArray(cloudData.transactions) ? cloudData.transactions : [],
          certificates: Array.isArray(cloudData.certificates) ? cloudData.certificates : [],
          scholarships: Array.isArray(cloudData.scholarships) ? cloudData.scholarships : [],
          panApplications: Array.isArray(cloudData.panApplications) ? cloudData.panApplications : [],
          importantLinks: Array.isArray(cloudData.importantLinks) ? cloudData.importantLinks : defaultImportantLinks,
        };
        currentActiveUid = uid;
        localStorage.setItem(getUserStorageKey(uid), JSON.stringify(activeUserPayload));
        onDataChanged(activeUserPayload);
      }
    }, (error) => {
      console.warn('Realtime listener notice:', error);
    });

    return unsub;
  } catch (err) {
    console.warn('Subscribe to realtime error:', err);
    return () => {};
  }
}

export function getCSCConfig(): CSCConfig {
  const payload = getActivePayload();
  if (payload.cscConfig && payload.cscConfig.centreName === 'CSC Digital Seva Kendra') {
    payload.cscConfig.centreName = 'Shaurya Jan Sewa Kendra';
  }
  return payload.cscConfig || defaultCSCConfig;
}

export async function saveCSCConfig(config: CSCConfig): Promise<CSCConfig> {
  const currentPayload = getActivePayload();
  const draft: CloudBackupPayload = {
    ...currentPayload,
    cscConfig: config,
  };
  await savePayloadToFirestoreAndCache(draft);
  return draft.cscConfig;
}

export function getCustomers(): Customer[] {
  return getActivePayload().customers || [];
}

export async function saveCustomer(customer: Customer): Promise<Customer[]> {
  const currentPayload = getActivePayload();
  const currentList = [...(currentPayload.customers || [])];
  const index = currentList.findIndex((c) => c.id === customer.id);
  
  if (index >= 0) {
    currentList[index] = { ...customer, updatedAt: new Date().toISOString() };
  } else {
    currentList.unshift({
      ...customer,
      id: customer.id || `cust-${Date.now()}`,
      createdAt: customer.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const draft: CloudBackupPayload = {
    ...currentPayload,
    customers: currentList,
  };

  await savePayloadToFirestoreAndCache(draft);
  return draft.customers;
}

export async function deleteCustomer(id: string): Promise<Customer[]> {
  const currentPayload = getActivePayload();
  const currentList = (currentPayload.customers || []).filter((c) => c.id !== id);
  const draft: CloudBackupPayload = {
    ...currentPayload,
    customers: currentList,
  };
  await savePayloadToFirestoreAndCache(draft);
  return draft.customers;
}

export function getTransactions(): ServiceTransaction[] {
  return getActivePayload().transactions || [];
}

export async function saveTransaction(tx: ServiceTransaction): Promise<ServiceTransaction[]> {
  const currentPayload = getActivePayload();
  const currentList = [...(currentPayload.transactions || [])];
  const index = currentList.findIndex((t) => t.id === tx.id);

  if (index >= 0) {
    currentList[index] = tx;
  } else {
    const todayStr = new Date().toISOString().split('T')[0];
    const receiptNo = tx.receiptNo || `CSC-${new Date().getFullYear()}-${String(currentList.length + 1).padStart(3, '0')}`;
    const newTx: ServiceTransaction = {
      ...tx,
      id: tx.id || `tx-${Date.now()}`,
      receiptNo,
      orderDate: tx.orderDate || todayStr,
      balanceDue: Math.max(0, tx.fee - tx.amountPaid),
      createdAt: new Date().toISOString(),
      isSync: true,
    };
    currentList.unshift(newTx);
  }

  const draft: CloudBackupPayload = {
    ...currentPayload,
    transactions: currentList,
  };

  await savePayloadToFirestoreAndCache(draft);
  return draft.transactions;
}

export async function deleteTransaction(id: string): Promise<ServiceTransaction[]> {
  const currentPayload = getActivePayload();
  const currentList = (currentPayload.transactions || []).filter((t) => t.id !== id);
  const draft: CloudBackupPayload = {
    ...currentPayload,
    transactions: currentList,
  };
  await savePayloadToFirestoreAndCache(draft);
  return draft.transactions;
}

export function getCertificates(): CertificateApplication[] {
  return getActivePayload().certificates || [];
}

export async function saveCertificate(cert: CertificateApplication): Promise<CertificateApplication[]> {
  const currentPayload = getActivePayload();
  const currentList = [...(currentPayload.certificates || [])];
  const index = currentList.findIndex((c) => c.id === cert.id);

  if (index >= 0) {
    currentList[index] = cert;
  } else {
    const newCert: CertificateApplication = {
      ...cert,
      id: cert.id || `cert-${Date.now()}`,
      applicationNo: cert.applicationNo || String(Date.now()).slice(-10),
      createdAt: new Date().toISOString(),
    };
    currentList.unshift(newCert);
  }

  const draft: CloudBackupPayload = {
    ...currentPayload,
    certificates: currentList,
  };

  await savePayloadToFirestoreAndCache(draft);
  return draft.certificates;
}

export async function deleteMultipleCertificates(ids: string[]): Promise<CertificateApplication[]> {
  const currentPayload = getActivePayload();
  const idSet = new Set(ids);
  const currentList = (currentPayload.certificates || []).filter((c) => !idSet.has(c.id));
  const draft: CloudBackupPayload = {
    ...currentPayload,
    certificates: currentList,
  };
  await savePayloadToFirestoreAndCache(draft);
  return draft.certificates;
}

export async function deleteCertificate(id: string): Promise<CertificateApplication[]> {
  return deleteMultipleCertificates([id]);
}

export async function bulkAddCertificates(items: CertificateApplication[]): Promise<CertificateApplication[]> {
  const currentPayload = getActivePayload();
  const draft: CloudBackupPayload = {
    ...currentPayload,
    certificates: [...items, ...(currentPayload.certificates || [])],
  };
  await savePayloadToFirestoreAndCache(draft);
  return draft.certificates;
}

export async function saveCertificatesBulk(items: CertificateApplication[]): Promise<CertificateApplication[]> {
  return bulkAddCertificates(items);
}

export function getScholarships(): ScholarshipApplication[] {
  return getActivePayload().scholarships || [];
}

export async function saveScholarship(scholarship: ScholarshipApplication): Promise<ScholarshipApplication[]> {
  const currentPayload = getActivePayload();
  const currentList = [...(currentPayload.scholarships || [])];
  const index = currentList.findIndex((s) => s.id === scholarship.id);

  if (index >= 0) {
    currentList[index] = scholarship;
  } else {
    const newSch: ScholarshipApplication = {
      ...scholarship,
      id: scholarship.id || `sch-${Date.now()}`,
      applicationNo: scholarship.applicationNo || `SCH2026-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
    };
    currentList.unshift(newSch);
  }

  const draft: CloudBackupPayload = {
    ...currentPayload,
    scholarships: currentList,
  };

  await savePayloadToFirestoreAndCache(draft);
  return draft.scholarships;
}

export async function deleteMultipleScholarships(ids: string[]): Promise<ScholarshipApplication[]> {
  const currentPayload = getActivePayload();
  const idSet = new Set(ids);
  const currentList = (currentPayload.scholarships || []).filter((s) => !idSet.has(s.id));
  const draft: CloudBackupPayload = {
    ...currentPayload,
    scholarships: currentList,
  };
  await savePayloadToFirestoreAndCache(draft);
  return draft.scholarships;
}

export async function deleteScholarship(id: string): Promise<ScholarshipApplication[]> {
  return deleteMultipleScholarships([id]);
}

export async function bulkAddScholarships(items: ScholarshipApplication[]): Promise<ScholarshipApplication[]> {
  const currentPayload = getActivePayload();
  const draft: CloudBackupPayload = {
    ...currentPayload,
    scholarships: [...items, ...(currentPayload.scholarships || [])],
  };
  await savePayloadToFirestoreAndCache(draft);
  return draft.scholarships;
}

export async function saveScholarshipsBulk(items: ScholarshipApplication[]): Promise<ScholarshipApplication[]> {
  return bulkAddScholarships(items);
}

export function getScholarshipActivities(): ScholarshipActivity[] {
  const scholarships = getScholarships();
  const activities: ScholarshipActivity[] = [];
  scholarships.forEach((s) => {
    activities.push({
      id: `act-${s.id}`,
      title: s.status === 'Approved' ? `Scholarship Approved: ${s.studentName}` : s.status === 'Rejected' ? `Application Rejected: ${s.studentName}` : `New Scholarship Application: ${s.studentName}`,
      description: `Scheme: ${s.scheme} • Roll No: ${s.rollNo || '-'} • Amount: ₹${s.amount}`,
      type: s.status === 'Approved' ? 'success' : s.status === 'Rejected' ? 'danger' : 'info',
      timestamp: s.applicationDate || s.createdAt || new Date().toISOString()
    });
  });
  return activities.slice(0, 10);
}

export function getPANApplications(): PANApplication[] {
  return getActivePayload().panApplications || [];
}

export async function savePANApplication(panApp: PANApplication): Promise<PANApplication[]> {
  const currentPayload = getActivePayload();
  const currentList = [...(currentPayload.panApplications || [])];
  const index = currentList.findIndex((p) => p.id === panApp.id);

  if (index >= 0) {
    currentList[index] = panApp;
  } else {
    const prefix = panApp.applicationType === 'New PAN Card' ? 'N' : panApp.applicationType === 'PAN Correction' ? 'C' : 'R';
    const newPan: PANApplication = {
      ...panApp,
      id: panApp.id || `pan-${Date.now()}`,
      applicationNumber: panApp.applicationNumber || `${prefix}2026${String(Date.now()).slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    currentList.unshift(newPan);
  }

  const draft: CloudBackupPayload = {
    ...currentPayload,
    panApplications: currentList,
  };

  await savePayloadToFirestoreAndCache(draft);
  return draft.panApplications;
}

export async function deleteMultiplePANApplications(ids: string[]): Promise<PANApplication[]> {
  const currentPayload = getActivePayload();
  const idSet = new Set(ids);
  const currentList = (currentPayload.panApplications || []).filter((p) => !idSet.has(p.id));
  const draft: CloudBackupPayload = {
    ...currentPayload,
    panApplications: currentList,
  };
  await savePayloadToFirestoreAndCache(draft);
  return draft.panApplications;
}

export async function deletePANApplication(id: string): Promise<PANApplication[]> {
  return deleteMultiplePANApplications([id]);
}

export async function bulkAddPANApplications(items: PANApplication[]): Promise<PANApplication[]> {
  const currentPayload = getActivePayload();
  const draft: CloudBackupPayload = {
    ...currentPayload,
    panApplications: [...items, ...(currentPayload.panApplications || [])],
  };
  await savePayloadToFirestoreAndCache(draft);
  return draft.panApplications;
}

export async function savePANApplicationsBulk(items: PANApplication[]): Promise<PANApplication[]> {
  return bulkAddPANApplications(items);
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem('csc_last_sync_time');
}

export async function syncWithCloud(userUid?: string): Promise<{ success: boolean; message: string }> {
  const uid = userUid || auth.currentUser?.uid;
  if (!uid) {
    return { success: false, message: 'User not authenticated' };
  }
  if (!navigator.onLine) {
    return { success: false, message: '🔴 You are not connected to the internet. Please check your internet connection.' };
  }
  try {
    const currentPayload = getActivePayload(uid);
    await savePayloadToFirestoreAndCache(currentPayload, uid);
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return { success: true, message: `Synced with cloud (${timeStr})` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Sync failed' };
  }
}

export function getImportantLinks(): ImportantLink[] {
  return getActivePayload().importantLinks || defaultImportantLinks;
}

export async function saveImportantLink(link: ImportantLink): Promise<ImportantLink[]> {
  const currentPayload = getActivePayload();
  const currentList = [...(currentPayload.importantLinks || [])];
  const index = currentList.findIndex((l) => l.id === link.id);

  if (index >= 0) {
    currentList[index] = link;
  } else {
    const newLink: ImportantLink = {
      ...link,
      id: link.id || `link-cust-${Date.now()}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    currentList.unshift(newLink);
  }

  const draft: CloudBackupPayload = {
    ...currentPayload,
    importantLinks: currentList,
  };

  await savePayloadToFirestoreAndCache(draft);
  return draft.importantLinks;
}

export async function deleteImportantLink(id: string): Promise<ImportantLink[]> {
  const currentPayload = getActivePayload();
  const currentList = (currentPayload.importantLinks || []).filter((l) => l.id !== id);
  const draft: CloudBackupPayload = {
    ...currentPayload,
    importantLinks: currentList,
  };
  await savePayloadToFirestoreAndCache(draft);
  return draft.importantLinks;
}

export function exportFullDataJSON(): string {
  return JSON.stringify(getActivePayload(), null, 2);
}

export async function importFullDataJSON(jsonStr: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;

  if (!navigator.onLine) {
    throw new Error('🔴 You are not connected to the internet. Please check your internet connection.');
  }

  try {
    const data: CloudBackupPayload = JSON.parse(jsonStr);
    const draftPayload: CloudBackupPayload = {
      lastUpdated: new Date().toISOString(),
      cscConfig: data.cscConfig || defaultCSCConfig,
      customers: Array.isArray(data.customers) ? data.customers : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      certificates: Array.isArray(data.certificates) ? data.certificates : [],
      scholarships: Array.isArray(data.scholarships) ? data.scholarships : [],
      panApplications: Array.isArray(data.panApplications) ? data.panApplications : [],
      importantLinks: Array.isArray(data.importantLinks) ? data.importantLinks : defaultImportantLinks,
    };
    await savePayloadToFirestoreAndCache(draftPayload, uid);
    return true;
  } catch (e: any) {
    console.error('Failed to import JSON backup:', e);
    throw e;
  }
}
