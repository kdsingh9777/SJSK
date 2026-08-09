import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  Cloud, 
  CloudOff, 
  Lock, 
  Unlock, 
  Database,
  Search,
  PlusCircle,
  Building2,
  GraduationCap,
  CreditCard,
  Globe,
  IndianRupee,
  LogOut,
  UserCheck
} from 'lucide-react';
import { CSCConfig } from '../types';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: CSCConfig;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  isAdminUnlocked: boolean;
  onToggleAdminLock: () => void;
  onOpenSyncModal: () => void;
  onOpenNewCustomer: () => void;
  onOpenNewCertificate: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  currentUser?: User | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  isOnline,
  isSyncing,
  lastSyncTime,
  isAdminUnlocked,
  onToggleAdminLock,
  onOpenSyncModal,
  onOpenNewCustomer,
  onOpenNewCertificate,
  globalSearchQuery,
  setGlobalSearchQuery,
  currentUser,
  onSignOut,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-800/80">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Building2 className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-amber-400 leading-tight">
              {config.centreName || 'Shaurya Jan Sewa Kendra'}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>VLE: {config.operatorName}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-300/80">ID: {config.vleId}</span>
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search: Customer / Mobile / Aadhaar..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Action Controls & Sync Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Action Buttons */}
          <button
            onClick={onOpenNewCustomer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
            title="Register New Customer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ New Customer</span>
          </button>

          <button
            onClick={onOpenNewCertificate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
            title="Certificate Application"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>+ Certificate App</span>
          </button>

          {/* Sync Status Badge */}
          <button
            onClick={onOpenSyncModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/40'
            }`}
            title="Cloud Backup & Sync Status"
          >
            {isSyncing ? (
              <Cloud className="w-3.5 h-3.5 animate-bounce text-amber-400" />
            ) : isOnline ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">
              {isOnline ? 'Cloud Sync Active' : 'Offline Mode'}
            </span>
            {lastSyncTime && (
              <span className="text-[10px] opacity-75 hidden lg:inline">
                ({lastSyncTime})
              </span>
            )}
          </button>

          {/* User Profile & Sign Out */}
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-1 bg-slate-800/90 border border-slate-700 rounded-lg text-xs font-medium text-slate-200">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="max-w-[110px] truncate text-emerald-300 font-semibold" title={currentUser.email || ''}>
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </div>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-r-lg transition border-l border-slate-700"
                  title="Sign Out of VLE Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Admin Lock Toggle */}
          <button
            onClick={onToggleAdminLock}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              isAdminUnlocked
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={isAdminUnlocked ? 'Admin Unlocked (Click to lock)' : 'Admin Locked (Documents Protected)'}
          >
            {isAdminUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-amber-300">Admin Unlocked</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Secured Lock</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'dashboard'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('daily-revenue')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'daily-revenue'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-emerald-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <IndianRupee className="w-4 h-4 text-emerald-400" />
          <span>Daily Revenue</span>
        </button>

        <button
          onClick={() => setActiveTab('scholarships')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'scholarships'
              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
              : 'text-indigo-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <span>Scholarship Portal</span>
        </button>

        <button
          onClick={() => setActiveTab('pan-center')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'pan-center'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-amber-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>PAN Card Center</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'certificates'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Certificate Services</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'customers'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'transactions'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Services & Receipts</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'sync'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('imp-links')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition ${
            activeTab === 'imp-links'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-amber-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-amber-400" />
          <span>Imp Links</span>
        </button>
      </nav>
    </header>
  );
};
