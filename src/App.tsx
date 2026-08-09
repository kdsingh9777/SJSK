/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CertificateServices } from './components/CertificateServices';
import { ScholarshipPortal } from './components/ScholarshipPortal/ScholarshipPortal';
import { PANPortal } from './components/PANPortal/PANPortal';
import { CustomerManagement } from './components/CustomerManagement';
import { TransactionManagement } from './components/TransactionManagement';
import { BackupSyncModal } from './components/BackupSyncModal';
import { ImportantLinksSection } from './components/ImportantLinksSection';
import { DailyRevenueSection } from './components/DailyRevenueSection';
import { ReceiptModal } from './components/ReceiptModal';
import { AdminLockModal } from './components/AdminLockModal';
import { AuthScreen } from './components/AuthScreen';

import { auth, onAuthStateChanged, signOut, User } from './lib/firebase';

import {
  initLocalStorage,
  getCSCConfig,
  saveCSCConfig,
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getTransactions,
  saveTransaction,
  deleteTransaction,
  getCertificates,
  saveCertificate,
  deleteCertificate,
  deleteMultipleCertificates,
  saveCertificatesBulk,
  getScholarships,
  saveScholarship,
  deleteScholarship,
  deleteMultipleScholarships,
  saveScholarshipsBulk,
  getScholarshipActivities,
  getPANApplications,
  savePANApplication,
  deletePANApplication,
  deleteMultiplePANApplications,
  savePANApplicationsBulk,
  getLastSyncTime,
  syncWithCloud,
  fetchCloudBackupData,
  subscribeToRealtimeSync,
} from './lib/storage';

import { 
  Customer, 
  ServiceTransaction, 
  CertificateApplication, 
  CSCConfig,
  ScholarshipApplication,
  PANApplication,
  ScholarshipActivity,
  ReceiptData
} from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getLastSyncTime());
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // App Data State
  const [config, setConfig] = useState<CSCConfig>(getCSCConfig());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<ServiceTransaction[]>([]);
  const [certificates, setCertificates] = useState<CertificateApplication[]>([]);
  const [scholarships, setScholarships] = useState<ScholarshipApplication[]>([]);
  const [panApplications, setPanApplications] = useState<PANApplication[]>([]);
  const [scholarshipActivities, setScholarshipActivities] = useState<ScholarshipActivity[]>([]);

  // Modals
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<ReceiptData | ServiceTransaction | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Quick Action Modal Triggers
  const [openNewCertificateModal, setOpenNewCertificateModal] = useState<boolean>(false);
  const [openNewTransactionModal, setOpenNewTransactionModal] = useState<boolean>(false);
  const [preselectedCustomerForTx, setPreselectedCustomerForTx] = useState<Customer | null>(null);

  // Auth Listener & Initial Mount
  useEffect(() => {
    initLocalStorage();
    reloadAllData();

    // Perform an initial cloud fetch on mount to get global_state immediately
    fetchCloudBackupData().then((cloudData) => {
      if (cloudData) {
        reloadAllData();
      }
    });

    let unsubscribeRealtime: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (unsubscribeRealtime) {
        unsubscribeRealtime();
        unsubscribeRealtime = null;
      }

      const uid = user?.uid;
      // Fetch cloud backup data for this user account & global state
      const cloudData = await fetchCloudBackupData(uid);
      if (cloudData) {
        reloadAllData();
      }
      // Always sync to ensure local & cloud are unified
      await syncWithCloud(uid);
      reloadAllData();

      // Subscribe to real-time multi-doc changes across devices
      unsubscribeRealtime = subscribeToRealtimeSync(() => {
        reloadAllData();
      }, uid);
    });

    // Online/Offline Listeners
    const handleOnline = () => {
      setIsOnline(true);
      if (auth.currentUser) {
        fetchCloudBackupData(auth.currentUser.uid).then((cloudData) => {
          if (cloudData) reloadAllData();
        });
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribeAuth();
      if (unsubscribeRealtime) unsubscribeRealtime();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const reloadAllData = () => {
    setConfig(getCSCConfig());
    setCustomers(getCustomers());
    setTransactions(getTransactions());
    setCertificates(getCertificates());
    setScholarships(getScholarships());
    setPanApplications(getPANApplications());
    setScholarshipActivities(getScholarshipActivities());
    setLastSyncTime(getLastSyncTime());
  };

  const handleCloudSync = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    const res = await syncWithCloud(currentUser?.uid);
    setIsSyncing(false);
    if (res.success) {
      reloadAllData();
    }
  };

  // Handlers for Data Mutations
  const handleSaveCustomer = (cust: Customer) => {
    const updated = saveCustomer(cust);
    setCustomers(updated);
  };

  const handleDeleteCustomer = (id: string) => {
    const updated = deleteCustomer(id);
    setCustomers(updated);
  };

  const handleSaveTransaction = (tx: ServiceTransaction) => {
    const updated = saveTransaction(tx);
    setTransactions(updated);
    if (!tx.id || tx.id.startsWith('tx-')) {
      setSelectedReceiptTx(tx);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = deleteTransaction(id);
    setTransactions(updated);
  };

  const handleSaveCertificate = (cert: CertificateApplication) => {
    const updated = saveCertificate(cert);
    setCertificates(updated);
  };

  const handleDeleteCertificate = (ids: string | string[]) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    const updated = deleteMultipleCertificates(idList);
    setCertificates(updated);
  };

  const handleBulkAddCertificates = (items: CertificateApplication[]) => {
    const updated = saveCertificatesBulk(items);
    setCertificates(updated);
  };

  // Scholarship Portal Handlers
  const handleSaveScholarship = (sch: ScholarshipApplication) => {
    const updated = saveScholarship(sch);
    setScholarships(updated);
  };

  const handleDeleteScholarship = (ids: string | string[]) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    const updated = deleteMultipleScholarships(idList);
    setScholarships(updated);
  };

  const handleBulkAddScholarships = (items: ScholarshipApplication[]) => {
    const updated = saveScholarshipsBulk(items);
    setScholarships(updated);
  };

  // PAN Portal Handlers
  const handleSavePANApplication = (app: PANApplication) => {
    const updated = savePANApplication(app);
    setPanApplications(updated);
  };

  const handleDeletePANApplication = (ids: string | string[]) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    const updated = deleteMultiplePANApplications(idList);
    setPanApplications(updated);
  };

  const handleBulkAddPANApplications = (items: PANApplication[]) => {
    const updated = savePANApplicationsBulk(items);
    setPanApplications(updated);
  };

  const handleSaveConfig = (newConfig: CSCConfig) => {
    saveCSCConfig(newConfig);
    setConfig(newConfig);
  };

  const handleUpdatePin = (newPin: string) => {
    const updated = { ...config, adminPin: newPin };
    handleSaveConfig(updated);
  };

  // Quick Action Routing Helpers
  const handleOpenNewCustomerFromHeader = () => {
    setActiveTab('customers');
  };

  const handleOpenNewCertificateFromHeader = () => {
    setActiveTab('certificates');
    setOpenNewCertificateModal(true);
  };

  const handleOpenTxForCustomer = (cust: Customer) => {
    setPreselectedCustomerForTx(cust);
    setActiveTab('transactions');
    setOpenNewTransactionModal(true);
  };

  const handleOpenCertForCustomer = (cust: Customer) => {
    setActiveTab('certificates');
    setOpenNewCertificateModal(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">Loading CSC Digital Seva VLE Portal...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onSuccess={() => reloadAllData()} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Top Application Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        isOnline={isOnline}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        isAdminUnlocked={isAdminUnlocked}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onToggleAdminLock={() => {
          if (isAdminUnlocked) setIsAdminUnlocked(false);
          else setIsAdminModalOpen(true);
        }}
        onOpenSyncModal={() => setActiveTab('sync')}
        onOpenNewCustomer={handleOpenNewCustomerFromHeader}
        onOpenNewCertificate={handleOpenNewCertificateFromHeader}
        globalSearchQuery={globalSearchQuery}
        setGlobalSearchQuery={(query) => {
          setGlobalSearchQuery(query);
          if (query.trim().length > 0 && activeTab === 'dashboard') {
            setActiveTab('customers');
          }
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            certificates={certificates}
            customers={customers}
            scholarships={scholarships}
            panApplications={panApplications}
            onOpenNewTransaction={() => {
              setActiveTab('transactions');
              setOpenNewTransactionModal(true);
            }}
            onOpenNewCertificate={handleOpenNewCertificateFromHeader}
            onOpenNewCustomer={handleOpenNewCustomerFromHeader}
            onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSaveTransaction={handleSaveTransaction}
            onSaveCertificate={handleSaveCertificate}
          />
        )}

        {activeTab === 'daily-revenue' && (
          <DailyRevenueSection
            transactions={transactions}
            certificates={certificates}
            scholarships={scholarships}
            panApplications={panApplications}
          />
        )}

        {activeTab === 'scholarships' && (
          <ScholarshipPortal
            scholarships={scholarships}
            activities={scholarshipActivities}
            onSaveScholarship={handleSaveScholarship}
            onDeleteScholarship={handleDeleteScholarship}
            onBulkAddScholarships={handleBulkAddScholarships}
            onViewReceipt={(receipt) => setSelectedReceiptTx(receipt)}
          />
        )}

        {activeTab === 'pan-center' && (
          <PANPortal
            panApplications={panApplications}
            operatorName={config.operatorName}
            onSavePANApplication={handleSavePANApplication}
            onDeletePANApplication={handleDeletePANApplication}
            onBulkAddPANApplications={handleBulkAddPANApplications}
            onViewReceipt={(receipt) => setSelectedReceiptTx(receipt)}
          />
        )}

        {activeTab === 'certificates' && (
          <CertificateServices
            certificates={certificates}
            customers={customers}
            onSaveCertificate={handleSaveCertificate}
            onDeleteCertificate={handleDeleteCertificate}
            onBulkAddCertificates={handleBulkAddCertificates}
            onViewReceipt={(receipt) => setSelectedReceiptTx(receipt)}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerManagement
            customers={customers}
            transactions={transactions}
            certificates={certificates}
            isAdminUnlocked={isAdminUnlocked}
            onOpenAdminLockModal={() => setIsAdminModalOpen(true)}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
            onOpenNewTransactionForCustomer={handleOpenTxForCustomer}
            onOpenNewCertificateForCustomer={handleOpenCertForCustomer}
            initialSearchQuery={globalSearchQuery}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionManagement
            transactions={transactions}
            customers={customers}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
            initialOpenModal={openNewTransactionModal}
            preselectedCustomer={preselectedCustomerForTx}
          />
        )}

        {activeTab === 'sync' && (
          <BackupSyncModal
            config={config}
            customers={customers}
            transactions={transactions}
            certificates={certificates}
            isOnline={isOnline}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onManualSync={handleCloudSync}
            onSaveConfig={handleSaveConfig}
            onDataReload={reloadAllData}
          />
        )}

        {activeTab === 'imp-links' && (
          <ImportantLinksSection />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>{config.centreName} • Operator: {config.operatorName} ({config.mobile})</p>
          <p className="text-slate-500">Secure Automatic Cloud Backup & Offline Mode Active</p>
        </div>
      </footer>

      {/* Receipt Modal */}
      {selectedReceiptTx && (
        <ReceiptModal
          receipt={selectedReceiptTx}
          config={config}
          onSaveConfig={handleSaveConfig}
          onClose={() => setSelectedReceiptTx(null)}
        />
      )}

      {/* Admin Lock / PIN Modal */}
      <AdminLockModal
        config={config}
        isOpen={isAdminModalOpen}
        isAdminUnlocked={isAdminUnlocked}
        onUnlockSuccess={() => setIsAdminUnlocked(true)}
        onClose={() => setIsAdminModalOpen(false)}
        onUpdatePin={handleUpdatePin}
      />
    </div>
  );
}
