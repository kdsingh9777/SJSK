import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Eye, 
  Trash2,
  ShieldCheck,
  RefreshCw,
  FileCheck2,
  UserCheck
} from 'lucide-react';
import { PANApplication, PANApplicationType, PANStatus, ReceiptData } from '../../types';
import { PANApplicationModal } from './PANApplicationModal';
import { PANDetailModal } from './PANDetailModal';
import { ExcelImportModal } from '../ExcelImportModal';
import { exportToExcel, exportToCSV, printTableData } from '../../lib/excel';
import { createPANReceipt } from '../../lib/receiptHelper';

interface PANPortalProps {
  panApplications: PANApplication[];
  operatorName: string;
  onSavePANApplication: (app: PANApplication) => void;
  onDeletePANApplication: (id: string | string[]) => void;
  onBulkAddPANApplications: (items: PANApplication[]) => void;
  onViewReceipt?: (receipt: ReceiptData) => void;
}

export const PANPortal: React.FC<PANPortalProps> = ({
  panApplications,
  operatorName,
  onSavePANApplication,
  onDeletePANApplication,
  onBulkAddPANApplications,
  onViewReceipt,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed' | 'Rejected'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Multi-select & Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  // Modals
  const [isAppModalOpen, setIsAppModalOpen] = useState<boolean>(false);
  const [selectedAppForEdit, setSelectedAppForEdit] = useState<PANApplication | null>(null);
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<PANApplication | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<PANApplication | null>(null);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = panApplications.length;
    const newCount = panApplications.filter((p) => p.applicationType === 'New PAN Card').length;
    const correctionCount = panApplications.filter((p) => p.applicationType === 'PAN Correction').length;
    const reprintCount = panApplications.filter((p) => p.applicationType === 'PAN Reprint').length;

    const pending = panApplications.filter((p) => p.currentStatus === 'Pending' || p.currentStatus === 'Under Verification').length;
    const completed = panApplications.filter((p) => p.currentStatus === 'Completed').length;
    const rejected = panApplications.filter((p) => p.currentStatus === 'Rejected').length;

    return { total, newCount, correctionCount, reprintCount, pending, completed, rejected };
  }, [panApplications]);

  // Filtered Applications List
  const filteredApplications = useMemo(() => {
    return panApplications.filter((app) => {
      // Status Filter
      if (statusFilter === 'Pending' && !(app.currentStatus === 'Pending' || app.currentStatus === 'Under Verification')) {
        return false;
      }
      if (statusFilter === 'Completed' && app.currentStatus !== 'Completed') return false;
      if (statusFilter === 'Rejected' && app.currentStatus !== 'Rejected') return false;

      // Type Filter
      if (typeFilter !== 'All' && app.applicationType !== typeFilter) return false;

      // Search Query (Applicant Name, Father Name, Mobile, PAN Number, Application Number)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = app.applicantName?.toLowerCase().includes(q);
        const fatherMatch = app.fatherName?.toLowerCase().includes(q);
        const mobileMatch = app.mobile?.includes(q);
        const panMatch = app.panNumber?.toLowerCase().includes(q);
        const appNoMatch = app.applicationNumber?.toLowerCase().includes(q);
        if (!nameMatch && !fatherMatch && !mobileMatch && !panMatch && !appNoMatch) {
          return false;
        }
      }

      return true;
    });
  }, [panApplications, statusFilter, typeFilter, searchQuery]);

  // Selection Helpers
  const isAllSelected = useMemo(() => {
    if (filteredApplications.length === 0) return false;
    return filteredApplications.every((app) => selectedIds.includes(app.id));
  }, [filteredApplications, selectedIds]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const visibleIds = filteredApplications.map((app) => app.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    } else {
      const visibleSet = new Set(filteredApplications.map((app) => app.id));
      setSelectedIds(selectedIds.filter((id) => !visibleSet.has(id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Export & Print Handlers
  const handleExportExcel = () => {
    const exportData = filteredApplications.map((p) => ({
      'Application Number': p.applicationNumber,
      'PAN Number': p.panNumber,
      'Applicant Name': p.applicantName,
      'Father Name': p.fatherName,
      'DOB': p.dob,
      'Mobile': p.mobile,
      'Email': p.email,
      'Address': p.address,
      'Application Type': p.applicationType,
      'Current Status': p.currentStatus,
      'Date': p.date,
      'Operator Name': p.operatorName,
      'Remarks': p.remarks,
    }));
    exportToExcel(exportData, `PAN_Center_Applications_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    const exportData = filteredApplications.map((p) => ({
      'Application Number': p.applicationNumber,
      'PAN Number': p.panNumber,
      'Applicant Name': p.applicantName,
      'Father Name': p.fatherName,
      'DOB': p.dob,
      'Mobile': p.mobile,
      'Email': p.email,
      'Address': p.address,
      'Application Type': p.applicationType,
      'Current Status': p.currentStatus,
      'Date': p.date,
      'Operator Name': p.operatorName,
      'Remarks': p.remarks,
    }));
    exportToCSV(exportData, `PAN_Center_Applications_${new Date().toISOString().split('T')[0]}`);
  };

  const handlePrintList = () => {
    const headers = ['App No', 'PAN Number', 'Applicant Name', 'Father Name', 'Type', 'Status', 'Date'];
    const rows = filteredApplications.map((p) => [
      p.applicationNumber,
      p.panNumber || 'Pending',
      p.applicantName,
      p.fatherName,
      p.applicationType,
      p.currentStatus,
      p.date,
    ]);
    printTableData('PAN Center Applications List', 'PAN Seva Kendra Digital Records', headers, rows);
  };

  const handleImportExcelData = (parsedRows: Record<string, any>[]) => {
    const newItems: PANApplication[] = parsedRows.map((row, idx) => {
      let rawAppNo = row.applicationNumber || row.applicationNo || row.appNo || row.ackNo || row.refNo;

      if (!rawAppNo && row.rawOriginal) {
        for (const [k, v] of Object.entries(row.rawOriginal)) {
          const kLow = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if ((kLow.includes('app') || kLow.includes('no') || kLow.includes('num') || kLow.includes('ack') || kLow.includes('ref')) && !['srno', 'sno', 'slno'].includes(kLow)) {
            if (v !== undefined && v !== null && String(v).trim() !== '') {
              rawAppNo = String(v).trim();
              break;
            }
          }
        }
      }

      if (!rawAppNo && row.srNo) {
        rawAppNo = String(row.srNo).trim();
      }

      const finalAppNo = (rawAppNo && String(rawAppNo).trim()) ? String(rawAppNo).trim() : `N2026${String(Date.now() + idx).slice(-6)}`;
      const appDate = row.applicationDate || row.appliedDate || row.date || new Date().toISOString().split('T')[0];

      return {
        id: `pan-imp-${Date.now()}-${idx}`,
        applicantName: row.applicantName || row.studentName || row.name || 'Applicant',
        fatherName: row.fatherName || '',
        dob: row.dob || '1995-01-01',
        mobile: String(row.mobile || ''),
        email: row.email || '',
        address: row.address || '',
        applicationNumber: finalAppNo,
        panNumber: row.panNumber || 'Pending',
        applicationType: (row.applicationType as PANApplicationType) || 'New PAN Card',
        currentStatus: (row.currentStatus as PANStatus) || 'Pending',
        date: appDate,
        operatorName: row.operatorName || operatorName,
        remarks: 'Imported via Excel',
        createdAt: new Date().toISOString(),
      };
    });

    onBulkAddPANApplications(newItems);
  };

  return (
    <div className="space-y-6">
      {/* Module Banner Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm text-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              PAN Card Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Dedicated center for New PAN Card, Correction, Reprint requests & status tracking
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSelectedAppForEdit(null);
              setIsAppModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ New PAN Application</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handlePrintList}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* PAN Center Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Applications */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total PAN Applications</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              New: {stats.newCount} • Correction: {stats.correctionCount}
            </p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200/80 text-amber-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Pending Applications */}
        <div
          onClick={() => setStatusFilter('Pending')}
          className="bg-white border border-slate-200/80 hover:border-amber-400 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer transition"
        >
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending</p>
            <h3 className="text-2xl font-extrabold text-amber-800 mt-1">{stats.pending}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Under NSDL/UTI Verification</p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200/80 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Completed Applications */}
        <div
          onClick={() => setStatusFilter('Completed')}
          className="bg-white border border-slate-200/80 hover:border-emerald-400 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer transition"
        >
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.completed}</h3>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">PAN Allocated & Dispatched</p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Rejected Applications */}
        <div
          onClick={() => setStatusFilter('Rejected')}
          className="bg-white border border-slate-200/80 hover:border-rose-400 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer transition"
        >
          <div>
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Rejected</p>
            <h3 className="text-2xl font-extrabold text-rose-700 mt-1">{stats.rejected}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Signature / Document Error</p>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Status Tracking Search & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === 'All' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === 'Pending' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === 'Completed' ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => setStatusFilter('Rejected')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === 'Rejected' ? 'bg-rose-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejected ({stats.rejected})
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="All">All Application Types</option>
              <option value="New PAN Card">New PAN Card</option>
              <option value="PAN Correction">PAN Correction</option>
              <option value="PAN Reprint">PAN Reprint</option>
            </select>
          </div>
        </div>

        {/* Dedicated Search Input for Tracking */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600" />
          <input
            type="text"
            placeholder="Search by PAN Number (e.g. CYPYA1234K), App Number (e.g. N20269871101), Name, or Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
          />
        </div>
      </div>

      {/* Main PAN Applications Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>PAN Card Applications & Tracking Table</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-amber-800 border border-slate-200 font-semibold">
              {filteredApplications.length} Records
            </span>
          </h3>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs text-rose-800 animate-in fade-in duration-150">
              <span className="font-bold">{selectedIds.length} selected</span>
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 font-medium hover:bg-rose-100 rounded-lg transition"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    title="Select All Records"
                  />
                </th>
                <th className="px-4 py-3">App No / Type</th>
                <th className="px-4 py-3">Applicant Name & Father</th>
                <th className="px-4 py-3">Date of Birth (DOB)</th>
                <th className="px-4 py-3">Contact (Mobile/Email)</th>
                <th className="px-4 py-3">PAN Number</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3">Date / Operator</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No PAN card application records found.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className={`transition ${selectedIds.includes(app.id) ? 'bg-amber-50/60' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(app.id)}
                        onChange={() => handleToggleSelectRow(app.id)}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-amber-800">{app.applicationNumber}</div>
                      <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        {app.applicationType}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{app.applicantName}</div>
                      <div className="text-[10px] text-slate-400">{app.fatherName}</div>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">
                      {app.dob || '-'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-900 font-mono">{app.mobile}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{app.email || '-'}</div>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      {app.panNumber && app.panNumber !== 'Pending' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                          {app.panNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        app.currentStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        app.currentStatus === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        app.currentStatus === 'Under Verification' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                        'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {app.currentStatus === 'Completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {app.currentStatus === 'Rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {app.currentStatus === 'Under Verification' && <ShieldCheck className="w-3 h-3 text-sky-600" />}
                        {app.currentStatus === 'Pending' && <Clock className="w-3 h-3 text-amber-600" />}
                        <span>{app.currentStatus}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[11px]">
                      <div className="text-slate-700 font-medium">{app.date}</div>
                      <div className="text-[10px] text-slate-400">{app.operatorName}</div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (onViewReceipt) {
                              onViewReceipt(createPANReceipt(app));
                            }
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                          title="Print Duplicate Receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-600" />
                          <span>Receipt</span>
                        </button>

                        <button
                          onClick={() => setSelectedAppForDetail(app)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-amber-700 rounded-lg transition"
                          title="View Timeline & Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmApp(app)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-rose-600 rounded-lg transition"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAN Application Creation Modal */}
      {isAppModalOpen && (
        <PANApplicationModal
          isOpen={isAppModalOpen}
          onClose={() => setIsAppModalOpen(false)}
          onSave={onSavePANApplication}
          initialData={selectedAppForEdit}
          operatorName={operatorName}
        />
      )}

      {/* PAN Detail & Timeline View Modal */}
      {selectedAppForDetail && (
        <PANDetailModal
          application={selectedAppForDetail}
          onClose={() => setSelectedAppForDetail(null)}
          onViewReceipt={onViewReceipt}
          onUpdateStatus={(id, currentStatus, panNumber) => {
            const updated = {
              ...selectedAppForDetail,
              currentStatus,
              panNumber: panNumber || selectedAppForDetail.panNumber,
            };
            onSavePANApplication(updated);
            setSelectedAppForDetail(updated);
          }}
        />
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleTitle="PAN Center Portal"
        sampleColumnsNotice="applicantName, fatherName, dob, mobile, email, address, applicationNumber, panNumber, applicationType, currentStatus"
        onImportComplete={handleImportExcelData}
      />
      {/* Delete Confirmation Modal */}
      {deleteConfirmApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete PAN Application</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete PAN application for <strong className="text-slate-900">{deleteConfirmApp.applicantName}</strong> (App No: {deleteConfirmApp.applicationNumber})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeletePANApplication(deleteConfirmApp.id);
                  setDeleteConfirmApp(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Delete Application
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Multiple PAN Applications</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-rose-600 font-bold">{selectedIds.length}</strong> selected PAN application records?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeletePANApplication(selectedIds);
                  setSelectedIds([]);
                  setIsBulkDeleteModalOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete {selectedIds.length} Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
