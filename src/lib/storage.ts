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

const KEYS = {
  CONFIG: 'csc_config_v1',
  CUSTOMERS: 'csc_customers_v1',
  TRANSACTIONS: 'csc_transactions_v1',
  CERTIFICATES: 'csc_certificates_v1',
  SCHOLARSHIPS: 'csc_scholarships_v1',
  PAN_APPLICATIONS: 'csc_pan_applications_v1',
  IMPORTANT_LINKS: 'csc_important_links_v1',
  LAST_SYNC: 'csc_last_sync_v1',
};

export function getCloudDocRefs(userUid?: string): DocumentReference[] {
  const refs: DocumentReference[] = [doc(db, 'app_data', 'global_state')];
  const uid = userUid || auth.currentUser?.uid;
  if (uid && uid !== 'global_state') {
    refs.push(doc(db, 'app_data', uid));
  }
  return refs;
}

export function getCloudDocRef(userUid?: string): DocumentReference {
  const uid = userUid || auth.currentUser?.uid;
  if (uid) {
    return doc(db, 'app_data', uid);
  }
  return doc(db, 'app_data', 'global_state');
}

export function mergeLists<T extends { id: string; updatedAt?: string; createdAt?: string }>(
  localList: T[],
  cloudList: T[]
): T[] {
  const map = new Map<string, T>();

  const safeCloud = Array.isArray(cloudList) ? cloudList : [];
  const safeLocal = Array.isArray(localList) ? localList : [];

  for (const item of safeCloud) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }

  for (const item of safeLocal) {
    if (!item || !item.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
      if (itemTime >= existingTime) {
        map.set(item.id, { ...existing, ...item });
      }
    }
  }

  return Array.from(map.values());
}

export function applyCloudDataToLocalStorage(data: CloudBackupPayload): void {
  if (!data) return;

  if (data.cscConfig && data.cscConfig.centreName) {
    const currentConfig = getCSCConfig();
    const isDataDefault = data.cscConfig.centreName === 'CSC Digital Seva Kendra' && data.cscConfig.vleId === 'CSC-UP-12345678';
    const isCurrentDefault = currentConfig.centreName === 'CSC Digital Seva Kendra' && currentConfig.vleId === 'CSC-UP-12345678';

    if (!isDataDefault || isCurrentDefault) {
      localStorage.setItem(KEYS.CONFIG, JSON.stringify(data.cscConfig));
    }
  }

  if (data.customers && data.customers.length > 0) {
    const merged = mergeLists(getCustomers(), data.customers);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(merged));
  }
  if (data.transactions && data.transactions.length > 0) {
    const merged = mergeLists(getTransactions(), data.transactions);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(merged));
  }
  if (data.certificates && data.certificates.length > 0) {
    const merged = mergeLists(getCertificates(), data.certificates);
    localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(merged));
  }
  if (data.scholarships && data.scholarships.length > 0) {
    const merged = mergeLists(getScholarships(), data.scholarships);
    localStorage.setItem(KEYS.SCHOLARSHIPS, JSON.stringify(merged));
  }
  if (data.panApplications && data.panApplications.length > 0) {
    const merged = mergeLists(getPANApplications(), data.panApplications);
    localStorage.setItem(KEYS.PAN_APPLICATIONS, JSON.stringify(merged));
  }
  if (data.importantLinks && data.importantLinks.length > 0) {
    const merged = mergeLists(getImportantLinks(), data.importantLinks);
    localStorage.setItem(KEYS.IMPORTANT_LINKS, JSON.stringify(merged));
  }

  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  localStorage.setItem(KEYS.LAST_SYNC, timeStr);
}

// Helper to merge multiple payload objects into one master payload
export function mergePayloads(payloads: (CloudBackupPayload | null | undefined)[]): CloudBackupPayload {
  let config = getCSCConfig();
  let customers = getCustomers();
  let transactions = getTransactions();
  let certificates = getCertificates();
  let scholarships = getScholarships();
  let panApplications = getPANApplications();
  let importantLinks = getImportantLinks();

  for (const p of payloads) {
    if (!p) continue;
    if (p.cscConfig && p.cscConfig.centreName) {
      const isPDefault = p.cscConfig.centreName === 'CSC Digital Seva Kendra' && p.cscConfig.vleId === 'CSC-UP-12345678';
      const isConfigDefault = config.centreName === 'CSC Digital Seva Kendra' && config.vleId === 'CSC-UP-12345678';
      if (!isPDefault || isConfigDefault) {
        config = p.cscConfig;
      }
    }
    if (p.customers && p.customers.length > 0) {
      customers = mergeLists(customers, p.customers);
    }
    if (p.transactions && p.transactions.length > 0) {
      transactions = mergeLists(transactions, p.transactions);
    }
    if (p.certificates && p.certificates.length > 0) {
      certificates = mergeLists(certificates, p.certificates);
    }
    if (p.scholarships && p.scholarships.length > 0) {
      scholarships = mergeLists(scholarships, p.scholarships);
    }
    if (p.panApplications && p.panApplications.length > 0) {
      panApplications = mergeLists(panApplications, p.panApplications);
    }
    if (p.importantLinks && p.importantLinks.length > 0) {
      importantLinks = mergeLists(importantLinks, p.importantLinks);
    }
  }

  return {
    lastUpdated: new Date().toISOString(),
    cscConfig: config,
    customers,
    transactions,
    certificates,
    scholarships,
    panApplications,
    importantLinks,
  };
}

// Initialize default storage if empty
export function initLocalStorage(): void {
  if (!localStorage.getItem(KEYS.CONFIG)) {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(defaultCSCConfig));
  }
  if (!localStorage.getItem(KEYS.CUSTOMERS)) {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
  }
  if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
  }
  if (!localStorage.getItem(KEYS.CERTIFICATES)) {
    localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(initialCertificates));
  }
  if (!localStorage.getItem(KEYS.SCHOLARSHIPS)) {
    localStorage.setItem(KEYS.SCHOLARSHIPS, JSON.stringify(initialScholarships));
  }
  if (!localStorage.getItem(KEYS.PAN_APPLICATIONS)) {
    localStorage.setItem(KEYS.PAN_APPLICATIONS, JSON.stringify(initialPANApplications));
  }
  if (!localStorage.getItem(KEYS.IMPORTANT_LINKS)) {
    localStorage.setItem(KEYS.IMPORTANT_LINKS, JSON.stringify(defaultImportantLinks));
  }
}

// Fetch global state from Firestore or server backup
export async function fetchCloudBackupData(userUid?: string): Promise<CloudBackupPayload | null> {
  try {
    const refs = getCloudDocRefs(userUid);
    const fetchedPayloads: (CloudBackupPayload | null)[] = [];

    // 1. Fetch all Firestore refs
    for (const docRef of refs) {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          fetchedPayloads.push(docSnap.data() as CloudBackupPayload);
        }
      } catch (e) {
        console.warn('Doc fetch notice:', e);
      }
    }

    // 2. Fetch server endpoint
    try {
      const res = await fetch('/api/backup');
      if (res.ok) {
        const json = await res.json();
        if (json && json.cscConfig) {
          fetchedPayloads.push(json as CloudBackupPayload);
        }
      }
    } catch (e) {
      console.warn('Backup fetch notice:', e);
    }

    if (fetchedPayloads.length > 0) {
      const masterPayload = mergePayloads(fetchedPayloads);
      applyCloudDataToLocalStorage(masterPayload);
      return masterPayload;
    }
  } catch (err) {
    console.warn('Failed to fetch cloud backup data:', err);
  }
  return null;
}

// Subscribe to real-time changes across devices
export function subscribeToRealtimeSync(onDataChanged: () => void, userUid?: string): () => void {
  const unsubscribers: (() => void)[] = [];
  try {
    const refs = getCloudDocRefs(userUid);
    for (const docRef of refs) {
      const unsub = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as CloudBackupPayload;
          if (data && (data.cscConfig || data.customers || data.transactions)) {
            applyCloudDataToLocalStorage(data);
            onDataChanged();
          }
        }
      }, (error) => {
        console.warn('Realtime sync subscription notice:', error);
      });
      unsubscribers.push(unsub);
    }
  } catch (err) {
    console.warn('Realtime sync error:', err);
  }

  return () => {
    unsubscribers.forEach((fn) => fn());
  };
}

export function getCSCConfig(): CSCConfig {
  try {
    const raw = localStorage.getItem(KEYS.CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.centreName === 'CSC Digital Seva Kendra') {
        parsed.centreName = 'Shaurya Jan Sewa Kendra';
        localStorage.setItem(KEYS.CONFIG, JSON.stringify(parsed));
      }
      return parsed;
    }
    return defaultCSCConfig;
  } catch {
    return defaultCSCConfig;
  }
}

export function saveCSCConfig(config: CSCConfig): void {
  localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  triggerAutoSync();
}

export function getCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOMERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomer(customer: Customer): Customer[] {
  const current = getCustomers();
  const index = current.findIndex((c) => c.id === customer.id);
  let updated: Customer[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...customer, updatedAt: new Date().toISOString() };
  } else {
    updated = [
      {
        ...customer,
        id: customer.id || `cust-${Date.now()}`,
        createdAt: customer.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...current,
    ];
  }
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function deleteCustomer(id: string): Customer[] {
  const current = getCustomers();
  const updated = current.filter((c) => c.id !== id);
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function getTransactions(): ServiceTransaction[] {
  try {
    const raw = localStorage.getItem(KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTransaction(tx: ServiceTransaction): ServiceTransaction[] {
  const current = getTransactions();
  const index = current.findIndex((t) => t.id === tx.id);
  let updated: ServiceTransaction[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = tx;
  } else {
    const todayStr = new Date().toISOString().split('T')[0];
    const receiptNo = tx.receiptNo || `CSC-${new Date().getFullYear()}-${String(current.length + 1).padStart(3, '0')}`;
    const newTx: ServiceTransaction = {
      ...tx,
      id: tx.id || `tx-${Date.now()}`,
      receiptNo,
      orderDate: tx.orderDate || todayStr,
      balanceDue: Math.max(0, tx.fee - tx.amountPaid),
      createdAt: new Date().toISOString(),
      isSync: true,
    };
    updated = [newTx, ...current];
  }
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function deleteTransaction(id: string): ServiceTransaction[] {
  const current = getTransactions();
  const updated = current.filter((t) => t.id !== id);
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function getCertificates(): CertificateApplication[] {
  try {
    const raw = localStorage.getItem(KEYS.CERTIFICATES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCertificate(cert: CertificateApplication): CertificateApplication[] {
  const current = getCertificates();
  const index = current.findIndex((c) => c.id === cert.id);
  let updated: CertificateApplication[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = cert;
  } else {
    const newCert: CertificateApplication = {
      ...cert,
      id: cert.id || `cert-${Date.now()}`,
      applicationNo: cert.applicationNo || String(Date.now()).slice(-10),
      createdAt: new Date().toISOString(),
    };
    updated = [newCert, ...current];
  }
  localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function deleteCertificate(id: string): CertificateApplication[] {
  return deleteMultipleCertificates([id]);
}

export function deleteMultipleCertificates(ids: string[]): CertificateApplication[] {
  const current = getCertificates();
  const idSet = new Set(ids);
  const updated = current.filter((c) => !idSet.has(c.id));
  localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

// ================= SCHOLARSHIP PORTAL STORAGE =================
export function getScholarships(): ScholarshipApplication[] {
  try {
    const raw = localStorage.getItem(KEYS.SCHOLARSHIPS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveScholarship(scholarship: ScholarshipApplication): ScholarshipApplication[] {
  const current = getScholarships();
  const index = current.findIndex((s) => s.id === scholarship.id);
  let updated: ScholarshipApplication[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = scholarship;
  } else {
    const newSch: ScholarshipApplication = {
      ...scholarship,
      id: scholarship.id || `sch-${Date.now()}`,
      applicationNo: scholarship.applicationNo || `SCH2026-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
    };
    updated = [newSch, ...current];
  }
  localStorage.setItem(KEYS.SCHOLARSHIPS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function bulkAddScholarships(items: ScholarshipApplication[]): ScholarshipApplication[] {
  const current = getScholarships();
  const updated = [...items, ...current];
  localStorage.setItem(KEYS.SCHOLARSHIPS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function saveScholarshipsBulk(items: ScholarshipApplication[]): ScholarshipApplication[] {
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

export function deleteScholarship(id: string): ScholarshipApplication[] {
  return deleteMultipleScholarships([id]);
}

export function deleteMultipleScholarships(ids: string[]): ScholarshipApplication[] {
  const current = getScholarships();
  const idSet = new Set(ids);
  const updated = current.filter((s) => !idSet.has(s.id));
  localStorage.setItem(KEYS.SCHOLARSHIPS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

// ================= PAN CENTER PORTAL STORAGE =================
export function getPANApplications(): PANApplication[] {
  try {
    const raw = localStorage.getItem(KEYS.PAN_APPLICATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePANApplication(panApp: PANApplication): PANApplication[] {
  const current = getPANApplications();
  const index = current.findIndex((p) => p.id === panApp.id);
  let updated: PANApplication[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = panApp;
  } else {
    const prefix = panApp.applicationType === 'New PAN Card' ? 'N' : panApp.applicationType === 'PAN Correction' ? 'C' : 'R';
    const newPan: PANApplication = {
      ...panApp,
      id: panApp.id || `pan-${Date.now()}`,
      applicationNumber: panApp.applicationNumber || `${prefix}2026${String(Date.now()).slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    updated = [newPan, ...current];
  }
  localStorage.setItem(KEYS.PAN_APPLICATIONS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function bulkAddPANApplications(items: PANApplication[]): PANApplication[] {
  const current = getPANApplications();
  const updated = [...items, ...current];
  localStorage.setItem(KEYS.PAN_APPLICATIONS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function savePANApplicationsBulk(items: PANApplication[]): PANApplication[] {
  return bulkAddPANApplications(items);
}

export function deletePANApplication(id: string): PANApplication[] {
  return deleteMultiplePANApplications([id]);
}

export function deleteMultiplePANApplications(ids: string[]): PANApplication[] {
  const current = getPANApplications();
  const idSet = new Set(ids);
  const updated = current.filter((p) => !idSet.has(p.id));
  localStorage.setItem(KEYS.PAN_APPLICATIONS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function bulkAddCertificates(items: CertificateApplication[]): CertificateApplication[] {
  const current = getCertificates();
  const updated = [...items, ...current];
  localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function saveCertificatesBulk(items: CertificateApplication[]): CertificateApplication[] {
  return bulkAddCertificates(items);
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(KEYS.LAST_SYNC);
}

export async function syncWithCloud(userUid?: string): Promise<{ success: boolean; message: string }> {
  try {
    const activeUid = userUid || auth.currentUser?.uid;
    const refs = getCloudDocRefs(activeUid);

    const fetchedPayloads: (CloudBackupPayload | null)[] = [];

    // 1. Try reading all Firestore docs to merge any remote items before writing
    for (const docRef of refs) {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          fetchedPayloads.push(docSnap.data() as CloudBackupPayload);
        }
      } catch (readErr) {
        console.warn('Pre-sync doc read notice:', readErr);
      }
    }

    // 2. Combine all cloud data with local storage data into a master payload
    const masterPayload = mergePayloads(fetchedPayloads);

    // Apply merged result back to local storage
    applyCloudDataToLocalStorage(masterPayload);

    // 3. Save merged master payload to ALL Firestore doc references
    for (const docRef of refs) {
      try {
        await setDoc(docRef, masterPayload, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore sync write warning:', fsErr);
      }
    }

    // 4. Save to Express API endpoint
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(masterPayload),
      });
    } catch (apiErr) {
      // Ignore API server sync errors
    }

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    localStorage.setItem(KEYS.LAST_SYNC, timeStr);
    return { success: true, message: `Cloud sync successful (${timeStr})` };
  } catch (err: unknown) {
    console.warn('Sync failed / offline:', err);
    return { success: false, message: 'Offline mode - saved locally' };
  }
}

let syncTimeout: any = null;
function triggerAutoSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    if (navigator.onLine) {
      syncWithCloud(auth.currentUser?.uid);
    }
  }, 1000);
}

export function getImportantLinks(): ImportantLink[] {
  try {
    const raw = localStorage.getItem(KEYS.IMPORTANT_LINKS);
    return raw ? JSON.parse(raw) : defaultImportantLinks;
  } catch {
    return defaultImportantLinks;
  }
}

export function saveImportantLink(link: ImportantLink): ImportantLink[] {
  const current = getImportantLinks();
  const index = current.findIndex((l) => l.id === link.id);
  let updated: ImportantLink[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = link;
  } else {
    const newLink: ImportantLink = {
      ...link,
      id: link.id || `link-cust-${Date.now()}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    updated = [newLink, ...current];
  }
  localStorage.setItem(KEYS.IMPORTANT_LINKS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function deleteImportantLink(id: string): ImportantLink[] {
  const current = getImportantLinks();
  const updated = current.filter((l) => l.id !== id);
  localStorage.setItem(KEYS.IMPORTANT_LINKS, JSON.stringify(updated));
  triggerAutoSync();
  return updated;
}

export function exportFullDataJSON(): string {
  const data: CloudBackupPayload = {
    lastUpdated: new Date().toISOString(),
    cscConfig: getCSCConfig(),
    customers: getCustomers(),
    transactions: getTransactions(),
    certificates: getCertificates(),
    scholarships: getScholarships(),
    panApplications: getPANApplications(),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullDataJSON(jsonStr: string): boolean {
  try {
    const data: CloudBackupPayload = JSON.parse(jsonStr);
    if (data.cscConfig) localStorage.setItem(KEYS.CONFIG, JSON.stringify(data.cscConfig));
    if (data.customers) localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(data.customers));
    if (data.transactions) localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
    if (data.certificates) localStorage.setItem(KEYS.CERTIFICATES, JSON.stringify(data.certificates));
    if (data.scholarships) localStorage.setItem(KEYS.SCHOLARSHIPS, JSON.stringify(data.scholarships));
    if (data.panApplications) localStorage.setItem(KEYS.PAN_APPLICATIONS, JSON.stringify(data.panApplications));
    triggerAutoSync();
    return true;
  } catch (e) {
    console.error('Failed to import JSON data:', e);
    return false;
  }
}
