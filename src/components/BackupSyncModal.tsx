import React, { useState } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Download, 
  Upload, 
  Database, 
  FileSpreadsheet, 
  Settings, 
  Building2, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { CSCConfig, Customer, ServiceTransaction, CertificateApplication } from '../types';
import { syncWithCloud, exportFullDataJSON, importFullDataJSON } from '../lib/storage';
import { exportCustomersToExcel, exportTransactionsToExcel, exportCertificatesToExcel } from '../lib/excel';

interface BackupSyncModalProps {
  config: CSCConfig;
  customers: Customer[];
  transactions: ServiceTransaction[];
  certificates: CertificateApplication[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  onManualSync: () => void;
  onSaveConfig: (config: CSCConfig) => void;
  onDataReload: () => void;
}

export const BackupSyncModal: React.FC<BackupSyncModalProps> = ({
  config,
  customers,
  transactions,
  certificates,
  isOnline,
  isSyncing,
  lastSyncTime,
  onManualSync,
  onSaveConfig,
  onDataReload,
}) => {
  const [centreName, setCentreName] = useState(config.centreName);
  const [operatorName, setOperatorName] = useState(config.operatorName);
  const [vleId, setVleId] = useState(config.vleId);
  const [address, setAddress] = useState(config.address);
  const [mobile, setMobile] = useState(config.mobile);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const [isImporting, setIsImporting] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CSCConfig = {
      ...config,
      centreName: centreName.trim(),
      operatorName: operatorName.trim(),
      vleId: vleId.trim(),
      address: address.trim(),
      mobile: mobile.trim(),
    };
    onSaveConfig(updated);
    if (isOnline) {
      await syncWithCloud();
    }
    alert('Jan Seva Kendra details updated & saved online to Cloud!');
  };

  const handleDownloadJSON = () => {
    const jsonStr = exportFullDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CSC_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (content) {
          try {
            const success = await importFullDataJSON(content);
            if (success) {
              alert('✓ All JSON backup entries successfully uploaded & saved online to Cloud!');
              onDataReload();
            } else {
              alert('Invalid backup file format!');
            }
          } catch (err) {
            console.error('Import error:', err);
            alert('Failed to process JSON backup file.');
          } finally {
            setIsImporting(false);
          }
        } else {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cloud Sync Status Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className="w-6 h-6 text-emerald-600" />
              ) : (
                <CloudOff className="w-6 h-6 text-amber-500" />
              )}
              <h2 className="text-xl font-bold text-slate-900">
                Automatic Cloud Backup & Online Sync
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Every transaction is backed up to the cloud. When offline, data is stored locally and auto-synced upon reconnecting.
            </p>
          </div>

          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync to Cloud Now'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 font-medium block">Network Status</span>
            <span className={`font-bold text-sm block mt-0.5 ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isOnline ? '✓ Online (Internet Active)' : '⚡ Offline (Saved to Local Storage)'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 font-medium block">Last Cloud Sync</span>
            <span className="font-mono font-bold text-slate-800 text-sm block mt-0.5">
              {lastSyncTime || 'Local Backup Active'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 font-medium block">Total Saved Records</span>
            <span className="font-bold text-slate-800 text-sm block mt-0.5">
              {customers.length} Customers • {transactions.length} Services • {certificates.length} Certificates
            </span>
          </div>
        </div>
      </div>

      {/* Excel & JSON Backup Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Excel Exports */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Excel Export Tools</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Download all your records in Excel (.xlsx) spreadsheet format.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => exportCertificatesToExcel(certificates)}
              className="w-full p-3 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 rounded-xl border border-emerald-200 text-xs font-bold transition flex items-center justify-between"
            >
              <span>1. Download Income, Caste, Domicile Certificates List in Excel</span>
              <Download className="w-4 h-4 text-emerald-700" />
            </button>

            <button
              onClick={() => exportCustomersToExcel(customers)}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 text-xs font-bold transition flex items-center justify-between"
            >
              <span>2. Download Customer List (Name, Mobile, Aadhaar) in Excel</span>
              <Download className="w-4 h-4 text-slate-600" />
            </button>

            <button
              onClick={() => exportTransactionsToExcel(transactions)}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 text-xs font-bold transition flex items-center justify-between"
            >
              <span>3. Download Services & Transactions List in Excel</span>
              <Download className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Card 2: JSON System Backup / Restore */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Full Database Backup & Restore</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Download or upload JSON backup to transfer data or switch computers safely.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadJSON}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Full App JSON Backup</span>
            </button>

            <div className="border border-dashed border-slate-300 p-3 rounded-xl text-center bg-slate-50">
              <label className="block text-xs font-bold text-slate-700 mb-1 cursor-pointer">
                Restore Previous JSON Backup (Syncs Online to Cloud):
              </label>
              {isImporting ? (
                <div className="flex items-center justify-center gap-2 py-2 text-indigo-600 font-bold text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading & Syncing Data Online to Cloud...</span>
                </div>
              ) : (
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  disabled={isImporting}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer disabled:opacity-50"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSC VLE Profile Settings */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>Jan Seva Kendra (CSC Centre) Profile Settings</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            This information will appear on all printed receipts.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Centre Name *</label>
              <input
                type="text"
                required
                value={centreName}
                onChange={(e) => setCentreName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Operator (VLE Name) *</label>
              <input
                type="text"
                required
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">VLE ID / CSC ID</label>
              <input
                type="text"
                value={vleId}
                onChange={(e) => setVleId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Contact Mobile Number *</label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Centre Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition"
            >
              Save Profile Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
