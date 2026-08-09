import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Filter, 
  FileText, 
  Eye, 
  Trash2,
  TrendingUp,
  Activity,
  Calendar,
  Award
} from 'lucide-react';
import { ScholarshipApplication, ScholarshipScheme, ScholarshipStatus, ScholarshipActivity, ReceiptData } from '../../types';
import { ScholarshipApplicationModal } from './ScholarshipApplicationModal';
import { ScholarshipDetailModal } from './ScholarshipDetailModal';
import { ExcelImportModal } from '../ExcelImportModal';
import { exportToExcel, exportToCSV, printTableData } from '../../lib/excel';
import { createScholarshipReceipt } from '../../lib/receiptHelper';

interface ScholarshipPortalProps {
  scholarships: ScholarshipApplication[];
  activities: ScholarshipActivity[];
  onSaveScholarship: (sch: ScholarshipApplication) => void;
  onDeleteScholarship: (id: string | string[]) => void;
  onBulkAddScholarships: (items: ScholarshipApplication[]) => void;
  onViewReceipt?: (receipt: ReceiptData) => void;
}

export const ScholarshipPortal: React.FC<ScholarshipPortalProps> = ({
  scholarships,
  activities,
  onSaveScholarship,
  onDeleteScholarship,
  onBulkAddScholarships,
  onViewReceipt,
}) => {
  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusTab, setStatusTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedScheme, setSelectedScheme] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'Applications' | 'Students'>('Applications');

  // Multi-select & Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  // Modals
  const [isAppModalOpen, setIsAppModalOpen] = useState<boolean>(false);
  const [selectedAppForEdit, setSelectedAppForEdit] = useState<ScholarshipApplication | null>(null);
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<ScholarshipApplication | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [deleteConfirmSch, setDeleteConfirmSch] = useState<ScholarshipApplication | null>(null);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = scholarships.length;
    const pending = scholarships.filter((s) => s.status === 'Pending').length;
    const approved = scholarships.filter((s) => s.status === 'Approved').length;
    const rejected = scholarships.filter((s) => s.status === 'Rejected').length;
    const totalAmount = scholarships.reduce((sum, s) => sum + (s.amount || 0), 0);
    const approvedAmount = scholarships
      .filter((s) => s.status === 'Approved')
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    return { total, pending, approved, rejected, totalAmount, approvedAmount };
  }, [scholarships]);

  // Filtered Scholarships
  const filteredScholarships = useMemo(() => {
    return scholarships.filter((sch) => {
      // Status tab
      if (statusTab !== 'All' && sch.status !== statusTab) return false;

      // Scheme filter
      if (selectedScheme !== 'All' && sch.scheme !== selectedScheme) return false;

      // Academic Year filter
      if (selectedYear !== 'All' && sch.academicYear !== selectedYear) return false;

      // Search Query (Student Name, Application No, Roll No, Aadhaar, Mobile, Institution)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = sch.studentName?.toLowerCase().includes(q);
        const appNoMatch = sch.applicationNo?.toLowerCase().includes(q);
        const rollMatch = sch.rollNo?.toLowerCase().includes(q);
        const aadhaarMatch = sch.aadhaar?.includes(q);
        const mobileMatch = sch.mobile?.includes(q);
        const instMatch = sch.institutionName?.toLowerCase().includes(q);
        if (!nameMatch && !appNoMatch && !rollMatch && !aadhaarMatch && !mobileMatch && !instMatch) {
          return false;
        }
      }

      return true;
    });
  }, [scholarships, statusTab, selectedScheme, selectedYear, searchQuery]);

  // Selection Helpers
  const isAllSelected = useMemo(() => {
    if (filteredScholarships.length === 0) return false;
    return filteredScholarships.every((sch) => selectedIds.includes(sch.id));
  }, [filteredScholarships, selectedIds]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const visibleIds = filteredScholarships.map((sch) => sch.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    } else {
      const visibleSet = new Set(filteredScholarships.map((sch) => sch.id));
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
    const exportData = filteredScholarships.map((s) => ({
      'Application No': s.applicationNo,
      'Student Name': s.studentName,
      'Father Name': s.fatherName,
      'Roll No': s.rollNo,
      'Category': s.category,
      'Mobile': s.mobile,
      'Aadhaar': s.aadhaar,
      'Institution': s.institutionName,
      'Course': s.course,
      'Academic Year': s.academicYear,
      'Scheme': s.scheme,
      'Amount': s.amount,
      'Status': s.status,
      'Application Date': s.applicationDate,
    }));
    exportToExcel(exportData, `Scholarship_Applications_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    const exportData = filteredScholarships.map((s) => ({
      'Application No': s.applicationNo,
      'Student Name': s.studentName,
      'Father Name': s.fatherName,
      'Roll No': s.rollNo,
      'Category': s.category,
      'Mobile': s.mobile,
      'Aadhaar': s.aadhaar,
      'Institution': s.institutionName,
      'Course': s.course,
      'Academic Year': s.academicYear,
      'Scheme': s.scheme,
      'Amount': s.amount,
      'Status': s.status,
      'Application Date': s.applicationDate,
    }));
    exportToCSV(exportData, `Scholarship_Applications_${new Date().toISOString().split('T')[0]}`);
  };

  const handlePrintList = () => {
    const headers = ['App No', 'Student Name', 'Roll No', 'Institution', 'Scheme', 'Amount ($)', 'Status'];
    const rows = filteredScholarships.map((s) => [
      s.applicationNo,
      s.studentName,
      s.rollNo,
      s.institutionName,
      s.scheme,
      `₹${s.amount.toLocaleString('en-IN')}`,
      s.status,
    ]);
    printTableData('Scholarship Applications List', 'Scholarship Portal Digital Records', headers, rows);
  };

  const handleImportExcelData = (parsedRows: Record<string, any>[]) => {
    const newItems: ScholarshipApplication[] = parsedRows.map((row, idx) => {
      let rawAppNo = row.applicationNo || row.applicationNumber || row.appNo || row.ackNo || row.refNo;

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

      const finalAppNo = (rawAppNo && String(rawAppNo).trim()) ? String(rawAppNo).trim() : `SCH2026-IMP${String(Date.now() + idx).slice(-4)}`;
      const appDate = row.applicationDate || row.appliedDate || row.date || new Date().toISOString().split('T')[0];

      return {
        id: `sch-imp-${Date.now()}-${idx}`,
        applicationNo: finalAppNo,
        studentName: row.studentName || row.applicantName || row.name || 'Student',
        fatherName: row.fatherName || '',
        rollNo: row.rollNo || `2026-${idx + 100}`,
        category: (row.category as any) || 'General',
        mobile: String(row.mobile || ''),
        aadhaar: String(row.aadhaar || ''),
        institutionName: row.institutionName || 'School / College',
        course: row.course || 'General Studies',
        academicYear: row.academicYear || '2025-26',
        scheme: (row.scheme as ScholarshipScheme) || 'Post-Matric Scholarship',
        amount: Number(row.amount || row.fee) || 10000,
        status: (row.status as ScholarshipStatus) || 'Pending',
        applicationDate: appDate,
        remarks: 'Added via Excel Import',
        documents: [
          { id: 'doc-1', docName: 'Marksheet', isUploaded: true },
          { id: 'doc-2', docName: 'Income Certificate', isUploaded: true },
        ],
        createdAt: new Date().toISOString(),
      };
    });

    onBulkAddScholarships(newItems);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Module Identification */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm text-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Scholarship Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Scholarship application management, student directory, verification & status tracking digital portal
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSelectedAppForEdit(null);
              setIsAppModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Scholarship Application</span>
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
            title="Download in Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition shadow-sm"
            title="Download in CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={handlePrintList}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition shadow-sm"
            title="Print List"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Dedicated Scholarship Dashboard Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Applications */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Applications</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Total Amount: ₹{stats.totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200/80 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Pending Applications */}
        <div
          onClick={() => setStatusTab('Pending')}
          className="bg-white border border-slate-200/80 hover:border-amber-400 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer transition"
        >
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending</p>
            <h3 className="text-2xl font-extrabold text-amber-800 mt-1">{stats.pending}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting Verification</p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200/80 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Approved Applications */}
        <div
          onClick={() => setStatusTab('Approved')}
          className="bg-white border border-slate-200/80 hover:border-emerald-400 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer transition"
        >
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Approved</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.approved}</h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">₹{stats.approvedAmount.toLocaleString('en-IN')} Approved</p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Rejected Applications */}
        <div
          onClick={() => setStatusTab('Rejected')}
          className="bg-white border border-slate-200/80 hover:border-rose-400 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer transition"
        >
          <div>
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Rejected</p>
            <h3 className="text-2xl font-extrabold text-rose-700 mt-1">{stats.rejected}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Incomplete Documents</p>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters, View Toggle & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusTab('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusTab === 'All' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusTab('Pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusTab === 'Pending' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setStatusTab('Approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusTab === 'Approved' ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved ({stats.approved})
            </button>
            <button
              onClick={() => setStatusTab('Rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusTab === 'Rejected' ? 'bg-rose-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejected ({stats.rejected})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('Applications')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'Applications' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setViewMode('Students')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'Students' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student List
            </button>
          </div>
        </div>

        {/* Search & Select Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, roll no, aadhaar, app no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Scheme Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedScheme}
              onChange={(e) => setSelectedScheme(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="All">All Schemes</option>
              <option value="Pre-Matric Scholarship">Pre-Matric Scholarship</option>
              <option value="Post-Matric Scholarship">Post-Matric Scholarship</option>
              <option value="Merit-cum-Means">Merit-cum-Means</option>
              <option value="Higher Education">Higher Education Scholarship</option>
              <option value="National Scholarship Portal (NSP)">National Scholarship Portal (NSP)</option>
              <option value="State Scholarship Scheme">State Scholarship Scheme</option>
            </select>
          </div>

          {/* Academic Year Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="All">All Academic Years</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recent Activity Panel */}
      {activities && activities.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Recent Activity</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-start gap-2.5"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    act.type === 'success' ? 'bg-emerald-500' : act.type === 'danger' ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}
                />
                <div>
                  <div className="flex items-center justify-between text-slate-900 font-semibold mb-0.5">
                    <span>{act.title}</span>
                    <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>
              {viewMode === 'Applications' ? 'Scholarship Application List' : 'Registered Student Directory'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-indigo-800 border border-slate-200 font-semibold">
              {filteredScholarships.length} Records
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
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Select All Records"
                  />
                </th>
                <th className="px-4 py-3">App No / Date</th>
                <th className="px-4 py-3">Student Name & Father</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Institution / Course</th>
                <th className="px-4 py-3">Scholarship Scheme</th>
                <th className="px-4 py-3">Amount (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScholarships.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No scholarship records found.
                  </td>
                </tr>
              ) : (
                filteredScholarships.map((sch) => (
                  <tr
                    key={sch.id}
                    className={`transition ${selectedIds.includes(sch.id) ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sch.id)}
                        onChange={() => handleToggleSelectRow(sch.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-indigo-900">{sch.applicationNo}</div>
                      <div className="text-[10px] text-slate-400">{sch.applicationDate}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{sch.studentName}</div>
                      <div className="text-[10px] text-slate-400">{sch.fatherName}</div>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-700">
                      {sch.rollNo}
                      <span className="block text-[10px] text-slate-400">{sch.category}</span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-900 font-medium truncate max-w-[180px]">{sch.institutionName}</div>
                      <div className="text-[10px] text-slate-400">{sch.course}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                        {sch.scheme}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">Year: {sch.academicYear}</span>
                    </td>

                    <td className="px-4 py-3 font-bold text-emerald-600">
                      ₹{sch.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        sch.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        sch.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {sch.status === 'Approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {sch.status === 'Rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {sch.status === 'Pending' && <Clock className="w-3 h-3 text-amber-600" />}
                        <span>{sch.status}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (onViewReceipt) {
                              onViewReceipt(createScholarshipReceipt(sch));
                            }
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg transition text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                          title="Print Duplicate Receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-600" />
                          <span>Receipt</span>
                        </button>

                        <button
                          onClick={() => setSelectedAppForDetail(sch)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded-lg transition"
                          title="View Details & Documents"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmSch(sch)}
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

      {/* Application Creation / Edit Modal */}
      {isAppModalOpen && (
        <ScholarshipApplicationModal
          isOpen={isAppModalOpen}
          onClose={() => setIsAppModalOpen(false)}
          onSave={onSaveScholarship}
          initialData={selectedAppForEdit}
        />
      )}

      {/* Application Detail View Modal */}
      {selectedAppForDetail && (
        <ScholarshipDetailModal
          application={selectedAppForDetail}
          onClose={() => setSelectedAppForDetail(null)}
          onViewReceipt={onViewReceipt}
          onUpdateStatus={(id, status) => {
            const updated = { ...selectedAppForDetail, status };
            onSaveScholarship(updated);
            setSelectedAppForDetail(updated);
          }}
        />
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleTitle="Scholarship Portal"
        sampleColumnsNotice="studentName, fatherName, rollNo, category, mobile, aadhaar, institutionName, course, scheme, amount, status"
        onImportComplete={handleImportExcelData}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmSch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Scholarship Application</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete scholarship application for <strong className="text-slate-900">{deleteConfirmSch.studentName}</strong> (App No: {deleteConfirmSch.applicationNo})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmSch(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteScholarship(deleteConfirmSch.id);
                  setDeleteConfirmSch(null);
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
                <h3 className="font-bold text-slate-900 text-base">Delete Multiple Scholarship Applications</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-rose-600 font-bold">{selectedIds.length}</strong> selected scholarship application records?
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
                  onDeleteScholarship(selectedIds);
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
