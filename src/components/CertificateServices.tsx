import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  Sparkles,
  Filter,
  IndianRupee,
  ShieldAlert
} from 'lucide-react';
import { CertificateApplication, CertificateType, Customer, ReceiptData } from '../types';
import { ExcelImportModal } from './ExcelImportModal';
import { exportToExcel, exportToCSV, printTableData } from '../lib/excel';
import { createCertificateReceipt } from '../lib/receiptHelper';

interface CertificateServicesProps {
  certificates: CertificateApplication[];
  customers: Customer[];
  onSaveCertificate: (cert: CertificateApplication) => void;
  onDeleteCertificate: (id: string | string[]) => void;
  onBulkAddCertificates: (items: CertificateApplication[]) => void;
  onViewReceipt?: (receipt: ReceiptData) => void;
}

export const CertificateServices: React.FC<CertificateServicesProps> = ({
  certificates,
  customers,
  onSaveCertificate,
  onDeleteCertificate,
  onBulkAddCertificates,
  onViewReceipt,
}) => {
  // Active Service Tab: 'Income' | 'Caste' | 'Residence'
  const [activeTab, setActiveTab] = useState<'Income' | 'Caste' | 'Residence'>('Income');

  // Search & Filters per service
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [deliveryFilter, setDeliveryFilter] = useState<'All' | 'Delivered' | 'Not Delivered'>('All');

  // Multi-select & Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  // Import Modal State
  const [importTargetType, setImportTargetType] = useState<CertificateType | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Partial<CertificateApplication> | null>(null);
  const [deleteConfirmCert, setDeleteConfirmCert] = useState<CertificateApplication | null>(null);

  // Form fields
  const [applicantName, setApplicantName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [certType, setCertType] = useState<CertificateType>('Income Certificate');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [deliveryStatus, setDeliveryStatus] = useState<'Delivered' | 'Not Delivered'>('Not Delivered');
  const [applicationNo, setApplicationNo] = useState('');
  const [fee, setFee] = useState<number>(70);
  const [notes, setNotes] = useState('');

  // Mapping Active Tab to CertificateType String
  const targetCertType: CertificateType = useMemo(() => {
    if (activeTab === 'Income') return 'Income Certificate';
    if (activeTab === 'Caste') return 'Caste Certificate';
    return 'Residence Certificate';
  }, [activeTab]);

  // Certificates for Active Tab
  const activeTabCertificates = useMemo(() => {
    return certificates.filter((c) => {
      if (activeTab === 'Income') return c.certificateType === 'Income Certificate';
      if (activeTab === 'Caste') return c.certificateType === 'Caste Certificate';
      return c.certificateType === 'Residence Certificate' || c.certificateType === 'Domicile Certificate';
    });
  }, [certificates, activeTab]);

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return activeTabCertificates.filter((cert) => {
      // Payment filter
      if (paymentFilter !== 'All' && cert.paymentStatus !== paymentFilter) return false;

      // Delivery filter
      if (deliveryFilter !== 'All' && cert.deliveryStatus !== deliveryFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = cert.applicantName.toLowerCase().includes(q);
        const fatherMatch = cert.fatherName.toLowerCase().includes(q);
        const appNoMatch = cert.applicationNo.toLowerCase().includes(q);
        const mobileMatch = cert.mobile.includes(q);
        if (!nameMatch && !fatherMatch && !appNoMatch && !mobileMatch) return false;
      }

      return true;
    });
  }, [activeTabCertificates, paymentFilter, deliveryFilter, searchQuery]);

  // Selection Helpers
  const isAllSelected = useMemo(() => {
    if (filteredCertificates.length === 0) return false;
    return filteredCertificates.every((cert) => selectedIds.includes(cert.id));
  }, [filteredCertificates, selectedIds]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const visibleIds = filteredCertificates.map((cert) => cert.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    } else {
      const visibleSet = new Set(filteredCertificates.map((cert) => cert.id));
      setSelectedIds(selectedIds.filter((id) => !visibleSet.has(id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Stats for active tab
  const tabStats = useMemo(() => {
    const total = activeTabCertificates.length;
    const paid = activeTabCertificates.filter((c) => c.paymentStatus === 'Paid').length;
    const unpaid = activeTabCertificates.filter((c) => c.paymentStatus === 'Unpaid').length;
    const delivered = activeTabCertificates.filter((c) => c.deliveryStatus === 'Delivered').length;
    const notDelivered = activeTabCertificates.filter((c) => c.deliveryStatus === 'Not Delivered').length;
    const totalFee = activeTabCertificates.reduce((sum, c) => sum + (c.fee || 0), 0);

    return { total, paid, unpaid, delivered, notDelivered, totalFee };
  }, [activeTabCertificates]);

  // Open New Certificate Modal preselected to current active tab certificate type
  const openNewModal = (typeForced?: CertificateType) => {
    const defaultType = typeForced || targetCertType;
    setEditingCert(null);
    setApplicantName('');
    setFatherName('');
    setAddress('');
    setMobile('');
    setAadhaar('');
    setCertType(defaultType);
    setPaymentStatus('Paid');
    setDeliveryStatus('Not Delivered');
    setApplicationNo(String(Date.now()).slice(-10));
    setFee(70);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (cert: CertificateApplication) => {
    setEditingCert(cert);
    setApplicantName(cert.applicantName);
    setFatherName(cert.fatherName);
    setAddress(cert.address);
    setMobile(cert.mobile);
    setAadhaar(cert.aadhaar || '');
    setCertType(cert.certificateType);
    setPaymentStatus(cert.paymentStatus);
    setDeliveryStatus(cert.deliveryStatus);
    setApplicationNo(cert.applicationNo);
    setFee(cert.fee);
    setNotes(cert.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !fatherName.trim()) {
      alert('Please enter Applicant Name and Father Name!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newCert: CertificateApplication = {
      id: editingCert?.id || `cert-${Date.now()}`,
      applicationNo: applicationNo || String(Date.now()).slice(-10),
      applicantName: applicantName.trim(),
      fatherName: fatherName.trim(),
      address: address.trim(),
      mobile: mobile.trim(),
      aadhaar: aadhaar.trim(),
      certificateType: certType,
      paymentStatus,
      deliveryStatus,
      fee: Number(fee) || 70,
      applicationDate: editingCert?.applicationDate || todayStr,
      targetDeliveryDate: editingCert?.targetDeliveryDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      notes: notes.trim(),
      createdAt: editingCert?.createdAt || new Date().toISOString(),
    };

    onSaveCertificate(newCert);
    setIsModalOpen(false);
  };

  // Export Handlers
  const handleExportExcel = () => {
    const data = filteredCertificates.map((c) => ({
      'Application No': c.applicationNo,
      'Applicant Name': c.applicantName,
      'Father Name': c.fatherName,
      'Mobile': c.mobile,
      'Address': c.address,
      'Aadhaar': c.aadhaar,
      'Certificate Type': c.certificateType,
      'Fee': c.fee,
      'Payment Status': c.paymentStatus,
      'Delivery Status': c.deliveryStatus,
      'Application Date': c.applicationDate,
    }));
    exportToExcel(data, `${activeTab}_Certificates_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    const data = filteredCertificates.map((c) => ({
      'Application No': c.applicationNo,
      'Applicant Name': c.applicantName,
      'Father Name': c.fatherName,
      'Mobile': c.mobile,
      'Address': c.address,
      'Aadhaar': c.aadhaar,
      'Certificate Type': c.certificateType,
      'Fee': c.fee,
      'Payment Status': c.paymentStatus,
      'Delivery Status': c.deliveryStatus,
      'Application Date': c.applicationDate,
    }));
    exportToCSV(data, `${activeTab}_Certificates_${new Date().toISOString().split('T')[0]}`);
  };

  const handlePrint = () => {
    const headers = ['Application No', 'Applicant Name', 'Father Name', 'Mobile', 'Fee (₹)', 'Payment', 'Delivery Status'];
    const rows = filteredCertificates.map((c) => [
      c.applicationNo,
      c.applicantName,
      c.fatherName,
      c.mobile,
      `₹${c.fee}`,
      c.paymentStatus,
      c.deliveryStatus,
    ]);
    printTableData(`${targetCertType} List`, 'Digital Seva CSC Certificate Management System', headers, rows);
  };

  // Bulk Excel Import Handler for current service
  const handleBulkImportForType = (parsedRows: Record<string, any>[]) => {
    if (!importTargetType) return;

    const newItems: CertificateApplication[] = parsedRows.map((row, idx) => {
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

      const finalAppNo = (rawAppNo && String(rawAppNo).trim()) ? String(rawAppNo).trim() : String(Date.now() + idx).slice(-10);
      const appDate = row.applicationDate || row.appliedDate || row.date || new Date().toISOString().split('T')[0];

      return {
        id: `cert-imp-${Date.now()}-${idx}`,
        applicationNo: finalAppNo,
        applicantName: row.applicantName || row.name || 'Applicant',
        fatherName: row.fatherName || '',
        address: row.address || 'Address',
        mobile: String(row.mobile || ''),
        aadhaar: String(row.aadhaar || ''),
        certificateType: importTargetType,
        paymentStatus: String(row.paymentStatus || row.status || '').toLowerCase().includes('paid') ? 'Paid' : 'Paid',
        deliveryStatus: String(row.deliveryStatus || row.status || '').toLowerCase().includes('deliver') ? 'Delivered' : 'Not Delivered',
        fee: Number(row.fee || row.amount) || 70,
        applicationDate: appDate,
        targetDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: 'Added via Excel Import System',
        createdAt: new Date().toISOString(),
      };
    });

    onBulkAddCertificates(newItems);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm text-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Certificate Services
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Automated records, search, and Excel import/export for Income, Caste, and Domicile certificates
            </p>
          </div>
        </div>

        <button
          onClick={() => openNewModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Certificate Application</span>
        </button>
      </div>

      {/* Clean Service Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('Income')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'Income'
              ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'Income' ? 'text-white' : 'text-blue-600'}`} />
          <span>Income Certificate</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'Income' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {certificates.filter((c) => c.certificateType === 'Income Certificate').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Caste')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'Caste'
              ? 'bg-purple-600 text-white shadow-sm border border-purple-600'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'Caste' ? 'text-white' : 'text-purple-600'}`} />
          <span>Caste Certificate</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'Caste' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {certificates.filter((c) => c.certificateType === 'Caste Certificate').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Residence')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'Residence'
              ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-500'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'Residence' ? 'text-slate-950' : 'text-amber-600'}`} />
          <span>Residence Certificate</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'Residence' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {certificates.filter((c) => c.certificateType === 'Residence Certificate' || c.certificateType === 'Domicile Certificate').length}
          </span>
        </button>
      </div>

      {/* Dedicated Service Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total {targetCertType} Apps</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{tabStats.total}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Total Fees: ₹{tabStats.totalFee}</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Delivered</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{tabStats.delivered}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Certificates Issued</p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending / Not Delivered</p>
            <h3 className="text-2xl font-extrabold text-amber-900 mt-1">{tabStats.notDelivered}</h3>
            <p className="text-[11px] text-slate-500 mt-1">In Verification Process</p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Payment Status</p>
            <h3 className="text-2xl font-extrabold text-purple-700 mt-1">{tabStats.paid} Paid</h3>
            <p className="text-[11px] text-rose-600 font-medium mt-1">{tabStats.unpaid} Unpaid Outstanding</p>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Service Specific Table Header Controls & Excel Import Button */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{targetCertType} Table</span>
            </h3>

            {/* Individual Import Excel Button for this specific service type */}
            <button
              onClick={() => setImportTargetType(targetCertType)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
          </div>

          {/* Export & Print controls for this service */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print Table</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search: Applicant Name / Father / App No...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
            >
              <option value="All">All Payment Status (Paid & Unpaid)</option>
              <option value="Paid">Only Paid</option>
              <option value="Unpaid">Only Unpaid</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
            >
              <option value="All">All Delivery Status</option>
              <option value="Delivered">Delivered</option>
              <option value="Not Delivered">Not Delivered (Pending)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Service Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>{targetCertizeType(targetCertType)} Records</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-indigo-800 border border-slate-200 font-semibold">
              {filteredCertificates.length} Records
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
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
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
                <th className="px-4 py-3">Applicant Name & Mobile</th>
                <th className="px-4 py-3">Father / Husband Name</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-center">Fee (₹)</th>
                <th className="px-4 py-3 text-center">Payment Status</th>
                <th className="px-4 py-3 text-center">Delivery Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No records found for {targetCertizeType(targetCertType)}.
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => (
                  <tr
                    key={cert.id}
                    className={`transition ${selectedIds.includes(cert.id) ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(cert.id)}
                        onChange={() => handleToggleSelectRow(cert.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                      <div>{cert.applicationNo}</div>
                      <div className="text-[10px] font-normal text-slate-400">{cert.applicationDate}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{cert.applicantName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Mob: {cert.mobile}</div>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-700">
                      {cert.fatherName}
                    </td>

                    <td className="px-4 py-3 text-[11px] text-slate-600 max-w-xs truncate">
                      {cert.address || '-'}
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-emerald-600">
                      ₹{cert.fee}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          const nextStatus = cert.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
                          onSaveCertificate({ ...cert, paymentStatus: nextStatus });
                        }}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                          cert.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {cert.paymentStatus === 'Paid' ? '✓ Paid' : '✗ Unpaid'}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          const nextStatus = cert.deliveryStatus === 'Delivered' ? 'Not Delivered' : 'Delivered';
                          onSaveCertificate({ ...cert, deliveryStatus: nextStatus });
                        }}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                          cert.deliveryStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {cert.deliveryStatus === 'Delivered' ? '✓ Delivered' : '⏳ Not Delivered'}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (onViewReceipt) {
                              onViewReceipt(createCertificateReceipt(cert));
                            }
                          }}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg transition text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                          title="Print Duplicate Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>

                        <button
                          onClick={() => openEditModal(cert)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="Edit Record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmCert(cert)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-rose-600 rounded-lg transition"
                          title="Delete Record"
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

      {/* Excel Import Modal for Specific Service */}
      {importTargetType && (
        <ExcelImportModal
          isOpen={Boolean(importTargetType)}
          onClose={() => setImportTargetType(null)}
          moduleTitle={`${importTargetType} Service`}
          sampleColumnsNotice="Sr No., Application No., Applicant Name, Father Name, Address, Application Date, Status, Mobile"
          onImportComplete={handleBulkImportForType}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200/80 text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>{editingCert ? 'Edit Certificate Application' : `+ Add New ${certType}`}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {/* Customer selection helper */}
              {customers.length > 0 && !editingCert && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Auto-fill from existing customer:
                  </label>
                  <select
                    onChange={(e) => {
                      const cust = customers.find((c) => c.name === e.target.value);
                      if (cust) {
                        setApplicantName(cust.name);
                        setFatherName(cust.fatherName || '');
                        setAddress(cust.address);
                        setMobile(cust.mobile);
                        setAadhaar(cust.aadhaar || '');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value="">-- Select Customer (or enter new below) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.mobile}) - {c.fatherName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Applicant Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ram Kumar Verma"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Father/Husband Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shiv Prasad Verma"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Village, Post, Block, Tehsil, District..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="10 digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Application Ref No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 24561009871"
                    value={applicationNo}
                    onChange={(e) => setApplicationNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Document Type *</label>
                  <select
                    value={certType}
                    onChange={(e) => setCertType(e.target.value as CertificateType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value="Income Certificate">Income Certificate</option>
                    <option value="Caste Certificate">Caste Certificate</option>
                    <option value="Residence Certificate">Domicile Certificate</option>
                    <option value="Disability Certificate">Disability Certificate</option>
                    <option value="Solvency Certificate">Solvency Certificate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fee Amount (₹)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'Paid' | 'Unpaid')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Delivery Status</label>
                  <select
                    value={deliveryStatus}
                    onChange={(e) => setDeliveryStatus(e.target.value as 'Delivered' | 'Not Delivered')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Not Delivered">Not Delivered</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Details / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Enter remarks or verification status..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-sm transition"
                >
                  {editingCert ? 'Update' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Certificate Application</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete application for <strong className="text-slate-900">{deleteConfirmCert.applicantName}</strong> (App No: {deleteConfirmCert.applicationNo})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmCert(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteCertificate(deleteConfirmCert.id);
                  setDeleteConfirmCert(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Delete Record
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
                <h3 className="font-bold text-slate-900 text-base">Delete Multiple Certificate Records</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-rose-600 font-bold">{selectedIds.length}</strong> selected certificate application records?
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
                  onDeleteCertificate(selectedIds);
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

function targetCertizeType(type: CertificateType): string {
  return type;
}
