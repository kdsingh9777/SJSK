import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  IndianRupee, 
  Clock, 
  AlertCircle, 
  Plus, 
  FileText, 
  UserPlus, 
  Receipt, 
  CheckCircle2, 
  TrendingUp,
  ArrowRight,
  Sparkles,
  Printer,
  X,
  Search,
  ExternalLink,
  GraduationCap,
  CreditCard,
  Filter,
  Check,
  Phone,
  User
} from 'lucide-react';
import { ServiceTransaction, CertificateApplication, Customer, ScholarshipApplication, PANApplication } from '../types';

interface DashboardProps {
  transactions: ServiceTransaction[];
  certificates: CertificateApplication[];
  customers: Customer[];
  scholarships?: ScholarshipApplication[];
  panApplications?: PANApplication[];
  onOpenNewTransaction: () => void;
  onOpenNewCertificate: () => void;
  onOpenNewCustomer: () => void;
  onViewReceipt: (tx: ServiceTransaction) => void;
  onNavigateTab: (tab: string) => void;
  onSaveTransaction?: (tx: ServiceTransaction) => void;
  onSaveCertificate?: (cert: CertificateApplication) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  certificates,
  customers,
  scholarships = [],
  panApplications = [],
  onOpenNewTransaction,
  onOpenNewCertificate,
  onOpenNewCustomer,
  onViewReceipt,
  onNavigateTab,
  onSaveTransaction,
  onSaveCertificate,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Modals for pending details
  const [isPendingAppsModalOpen, setIsPendingAppsModalOpen] = useState<boolean>(false);
  const [isPendingDuesModalOpen, setIsPendingDuesModalOpen] = useState<boolean>(false);

  // Search & Filter state for Pending Apps Modal
  const [pendingAppsSearch, setPendingAppsSearch] = useState<string>('');
  const [pendingAppsCategory, setPendingAppsCategory] = useState<'All' | 'Certificates' | 'Transactions' | 'PAN' | 'Scholarships'>('All');

  // Search & Filter state for Pending Dues Modal
  const [pendingDuesSearch, setPendingDuesSearch] = useState<string>('');
  const [pendingDuesCategory, setPendingDuesCategory] = useState<'All' | 'Transactions' | 'Certificates'>('All');

  // 1. Today's Work Count
  const todayTransactions = transactions.filter((t) => t.orderDate === todayStr);
  const todayWorkCount = todayTransactions.length;

  // 2. Today's Earnings
  const todayEarnings = todayTransactions.reduce((acc, t) => acc + (t.amountPaid || 0), 0);

  // 3. Total Pending Applications
  const pendingCertificates = useMemo(() => {
    return certificates.filter((c) => c.deliveryStatus === 'Not Delivered');
  }, [certificates]);

  const pendingTransactions = useMemo(() => {
    return transactions.filter((t) => t.workStatus === 'Pending' || t.workStatus === 'In Progress');
  }, [transactions]);

  const pendingPAN = useMemo(() => {
    return panApplications.filter((p) => p.status === 'Pending');
  }, [panApplications]);

  const pendingScholarships = useMemo(() => {
    return scholarships.filter((s) => s.status === 'Pending');
  }, [scholarships]);

  const totalPendingApplicationsCount = 
    pendingCertificates.length + 
    pendingTransactions.length + 
    pendingPAN.length + 
    pendingScholarships.length;

  // 4. Total Pending Dues (Uncollected Balances)
  const pendingDueTransactions = useMemo(() => {
    return transactions.filter((t) => (t.balanceDue || 0) > 0 || t.paymentStatus === 'Pending' || t.paymentStatus === 'Unpaid');
  }, [transactions]);

  const pendingDueCertificates = useMemo(() => {
    return certificates.filter((c) => c.paymentStatus === 'Unpaid' || ((c.fee || 0) > 0 && c.paymentStatus !== 'Paid'));
  }, [certificates]);

  const totalPendingPaymentsAmount = 
    pendingDueTransactions.reduce((acc, t) => acc + (t.balanceDue || (t.totalAmount - t.amountPaid) || 0), 0) +
    pendingDueCertificates.reduce((acc, c) => acc + (c.fee || 0), 0);

  const totalPendingDueRecordsCount = pendingDueTransactions.length + pendingDueCertificates.length;

  // Filtered List for Pending Apps Modal
  const filteredPendingAppsList = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'Certificate' | 'Transaction' | 'PAN' | 'Scholarship';
      appNo: string;
      title: string;
      customerName: string;
      mobile: string;
      date: string;
      status: string;
      rawItem: any;
    }> = [];

    if (pendingAppsCategory === 'All' || pendingAppsCategory === 'Certificates') {
      pendingCertificates.forEach((c) => {
        list.push({
          id: c.id,
          type: 'Certificate',
          appNo: c.applicationNo || 'N/A',
          title: c.certificateType,
          customerName: c.applicantName,
          mobile: c.mobile || 'N/A',
          date: c.applicationDate || 'N/A',
          status: c.deliveryStatus || 'Not Delivered',
          rawItem: c
        });
      });
    }

    if (pendingAppsCategory === 'All' || pendingAppsCategory === 'Transactions') {
      pendingTransactions.forEach((t) => {
        list.push({
          id: t.id,
          type: 'Transaction',
          appNo: t.receiptNo || t.id,
          title: t.serviceName,
          customerName: t.customerName,
          mobile: t.customerMobile || 'N/A',
          date: t.orderDate || 'N/A',
          status: t.workStatus || 'Pending',
          rawItem: t
        });
      });
    }

    if (pendingAppsCategory === 'All' || pendingAppsCategory === 'PAN') {
      pendingPAN.forEach((p) => {
        list.push({
          id: p.id,
          type: 'PAN',
          appNo: p.applicationNumber || 'N/A',
          title: `PAN Card (${p.applicationType})`,
          customerName: p.applicantName,
          mobile: p.mobileNumber || 'N/A',
          date: p.date || 'N/A',
          status: p.status || 'Pending',
          rawItem: p
        });
      });
    }

    if (pendingAppsCategory === 'All' || pendingAppsCategory === 'Scholarships') {
      pendingScholarships.forEach((s) => {
        list.push({
          id: s.id,
          type: 'Scholarship',
          appNo: s.applicationNo || 'N/A',
          title: s.scheme,
          customerName: s.studentName,
          mobile: s.mobileNo || 'N/A',
          date: s.applicationDate || 'N/A',
          status: s.status || 'Pending',
          rawItem: s
        });
      });
    }

    if (!pendingAppsSearch.trim()) return list;

    const q = pendingAppsSearch.toLowerCase().trim();
    return list.filter((item) =>
      item.customerName.toLowerCase().includes(q) ||
      item.mobile.toLowerCase().includes(q) ||
      item.appNo.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q)
    );
  }, [
    pendingCertificates,
    pendingTransactions,
    pendingPAN,
    pendingScholarships,
    pendingAppsCategory,
    pendingAppsSearch
  ]);

  // Filtered List for Pending Dues Modal
  const filteredPendingDuesList = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'Transaction' | 'Certificate';
      receiptNo: string;
      serviceTitle: string;
      customerName: string;
      mobile: string;
      date: string;
      totalAmount: number;
      amountPaid: number;
      balanceDue: number;
      rawItem: any;
    }> = [];

    if (pendingDuesCategory === 'All' || pendingDuesCategory === 'Transactions') {
      pendingDueTransactions.forEach((t) => {
        const total = t.fee || 0;
        const paid = t.amountPaid || 0;
        const due = t.balanceDue !== undefined ? t.balanceDue : (total - paid);

        list.push({
          id: t.id,
          type: 'Transaction',
          receiptNo: t.receiptNo || t.id,
          serviceTitle: t.serviceName,
          customerName: t.customerName,
          mobile: t.customerMobile || 'N/A',
          date: t.orderDate || 'N/A',
          totalAmount: total,
          amountPaid: paid,
          balanceDue: due > 0 ? due : total,
          rawItem: t
        });
      });
    }

    if (pendingDuesCategory === 'All' || pendingDuesCategory === 'Certificates') {
      pendingDueCertificates.forEach((c) => {
        const due = c.fee || 0;
        list.push({
          id: c.id,
          type: 'Certificate',
          receiptNo: c.applicationNo || 'N/A',
          serviceTitle: c.certificateType,
          customerName: c.applicantName,
          mobile: c.mobile || 'N/A',
          date: c.applicationDate || 'N/A',
          totalAmount: due,
          amountPaid: 0,
          balanceDue: due,
          rawItem: c
        });
      });
    }

    if (!pendingDuesSearch.trim()) return list;

    const q = pendingDuesSearch.toLowerCase().trim();
    return list.filter((item) =>
      item.customerName.toLowerCase().includes(q) ||
      item.mobile.toLowerCase().includes(q) ||
      item.receiptNo.toLowerCase().includes(q) ||
      item.serviceTitle.toLowerCase().includes(q)
    );
  }, [pendingDueTransactions, pendingDueCertificates, pendingDuesCategory, pendingDuesSearch]);

  // Actions for Pending Dues Modal
  const handleMarkPaid = (item: { type: string; rawItem: any }) => {
    if (item.type === 'Transaction') {
      const tx = item.rawItem as ServiceTransaction;
      const updatedTx: ServiceTransaction = {
        ...tx,
        amountPaid: tx.fee || tx.amountPaid,
        balanceDue: 0,
        paymentStatus: 'Paid'
      };
      onSaveTransaction?.(updatedTx);
    } else if (item.type === 'Certificate') {
      const cert = item.rawItem as CertificateApplication;
      const updatedCert: CertificateApplication = {
        ...cert,
        paymentStatus: 'Paid'
      };
      onSaveCertificate?.(updatedCert);
    }
  };

  // Actions for Pending Apps Modal
  const handleMarkComplete = (item: { type: string; rawItem: any }) => {
    if (item.type === 'Transaction') {
      const tx = item.rawItem as ServiceTransaction;
      const updatedTx: ServiceTransaction = {
        ...tx,
        workStatus: 'Completed'
      };
      onSaveTransaction?.(updatedTx);
    } else if (item.type === 'Certificate') {
      const cert = item.rawItem as CertificateApplication;
      const updatedCert: CertificateApplication = {
        ...cert,
        deliveryStatus: 'Delivered'
      };
      onSaveCertificate?.(updatedCert);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Highlights */}
      <div className="bg-white rounded-2xl p-5 md:p-6 text-slate-900 shadow-sm border border-slate-200/80">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold mb-2 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Digital Seva Daily Summary</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome! Today's Work Summary
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Today's Date: <span className="text-amber-700 font-semibold">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>

          {/* Quick Action Buttons Grid */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenNewCustomer}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Customer</span>
            </button>
            <button
              onClick={onOpenNewCertificate}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
            >
              <FileText className="w-4 h-4" />
              <span>Income/Caste/Domicile</span>
            </button>
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service Tx</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Today's Work Count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Jobs</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{todayWorkCount}</span>
            <span className="text-xs text-slate-500 font-medium">Entries Today</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {todayWorkCount > 0 ? 'Services recorded today' : 'No new service recorded today'}
          </p>
        </div>

        {/* Stat 2: Today's Earnings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">₹{todayEarnings.toLocaleString('en-IN')}</span>
            <span className="text-xs text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-medium">Cash/UPI Recd</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Total collection from today's recorded transactions
          </p>
        </div>

        {/* Stat 3: Total Pending Applications (CLICKABLE) */}
        <div
          onClick={() => setIsPendingAppsModalOpen(true)}
          className="bg-white rounded-2xl p-5 border border-amber-200/90 shadow-sm hover:shadow-md hover:border-amber-400 hover:scale-[1.01] transition cursor-pointer group relative overflow-hidden"
          title="Click to view & manage pending applications"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Total Pending Apps</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-900">{totalPendingApplicationsCount}</span>
              <span className="text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">Pending Work</span>
            </div>
            <span className="text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              View <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between border-t border-amber-100/60 pt-2">
            <span>Certs: {pendingCertificates.length}</span>
            <span>Services: {pendingTransactions.length}</span>
            <span>PAN: {pendingPAN.length}</span>
          </div>
        </div>

        {/* Stat 4: Pending Payment Dues (CLICKABLE) */}
        <div
          onClick={() => setIsPendingDuesModalOpen(true)}
          className="bg-white rounded-2xl p-5 border border-rose-200/90 shadow-sm hover:shadow-md hover:border-rose-400 hover:scale-[1.01] transition cursor-pointer group relative overflow-hidden"
          title="Click to view & manage pending dues"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Pending Dues</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-700">₹{totalPendingPaymentsAmount.toLocaleString('en-IN')}</span>
              <span className="text-xs text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full font-bold">{totalPendingDueRecordsCount} Records</span>
            </div>
            <span className="text-xs font-bold text-rose-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-xs text-rose-600/90 font-medium mt-2 border-t border-rose-100/60 pt-2">
            Click to view unpaid balances & mark as paid
          </p>
        </div>
      </div>

      {/* Main Content Grid: Recent Transactions & Income/Caste/Domicile Quick Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Services Table (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-base">Recent Service Transactions</h3>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 transition"
            >
              <span>View All Transactions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Date / Receipt</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Service Name</th>
                  <th className="px-3 py-2.5 text-right">Fee / Paid</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-2.5 font-mono text-slate-600">
                      <div>{tx.orderDate}</div>
                      <div className="text-[10px] text-amber-700 font-bold">{tx.receiptNo}</div>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      <div>{tx.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{tx.customerMobile}</div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{tx.serviceName}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="font-bold text-slate-900">₹{tx.totalAmount}</div>
                      <div className="text-[10px] text-emerald-600 font-bold">Recd: ₹{tx.amountPaid}</div>
                      {(tx.balanceDue || 0) > 0 && (
                        <div className="text-[10px] text-rose-600 font-bold">Due: ₹{tx.balanceDue}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          tx.workStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.workStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => onViewReceipt(tx)}
                        className="p-1.5 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 rounded-lg transition"
                        title="Print / View Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No service transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certificate Applications Summary Card (1 Column) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Income/Caste/Domicile</h3>
            </div>
            <button
              onClick={() => onNavigateTab('certificates')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Open Portal →
            </button>
          </div>

          <div className="space-y-3">
            {certificates.slice(0, 4).map((cert) => (
              <div key={cert.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {cert.certificateType}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      cert.deliveryStatus === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {cert.deliveryStatus === 'Delivered' ? 'Delivered' : 'Not Delivered'}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900">{cert.applicantName}</div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Father: {cert.fatherName}</span>
                  <span className="font-mono font-bold text-slate-700">₹{cert.fee}</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>App No: {cert.applicationNo}</span>
                  <span className={cert.paymentStatus === 'Paid' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {cert.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))}
            {certificates.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">No certificate applications recorded.</p>
            )}
          </div>

          <button
            onClick={onOpenNewCertificate}
            className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certificate Application</span>
          </button>
        </div>
      </div>

      {/* ==================== MODAL 1: TOTAL PENDING APPLICATIONS ==================== */}
      {isPendingAppsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-900 via-slate-900 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <span>Total Pending Applications Tracker</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                      {totalPendingApplicationsCount} Pending
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Review and complete all pending work across Certificates, Services, PAN, and Scholarships
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPendingAppsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Applicant Name, Mobile, or Application No..."
                    value={pendingAppsSearch}
                    onChange={(e) => setPendingAppsSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setPendingAppsCategory('All')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      pendingAppsCategory === 'All'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All ({totalPendingApplicationsCount})
                  </button>
                  <button
                    onClick={() => setPendingAppsCategory('Certificates')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      pendingAppsCategory === 'Certificates'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Certificates ({pendingCertificates.length})
                  </button>
                  <button
                    onClick={() => setPendingAppsCategory('Transactions')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      pendingAppsCategory === 'Transactions'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Service Tx ({pendingTransactions.length})
                  </button>
                  <button
                    onClick={() => setPendingAppsCategory('PAN')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      pendingAppsCategory === 'PAN'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    PAN ({pendingPAN.length})
                  </button>
                  <button
                    onClick={() => setPendingAppsCategory('Scholarships')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      pendingAppsCategory === 'Scholarships'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Scholarships ({pendingScholarships.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">App / Receipt No</th>
                    <th className="px-3 py-2.5">Applicant / Customer</th>
                    <th className="px-3 py-2.5">Service / Scheme</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPendingAppsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        No pending application records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredPendingAppsList.map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.type === 'Certificate' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            item.type === 'Transaction' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            item.type === 'PAN' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {item.type === 'Certificate' && <FileText className="w-3 h-3" />}
                            {item.type === 'Transaction' && <Receipt className="w-3 h-3" />}
                            {item.type === 'PAN' && <CreditCard className="w-3 h-3" />}
                            {item.type === 'Scholarship' && <GraduationCap className="w-3 h-3" />}
                            {item.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700">
                          <div className="font-bold">{item.appNo}</div>
                          <div className="text-[10px] text-slate-400">{item.date}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-900">{item.customerName}</div>
                          <div className="text-[10px] text-slate-500">{item.mobile}</div>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">{item.title}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(item.type === 'Certificate' || item.type === 'Transaction') && (
                              <button
                                onClick={() => handleMarkComplete(item)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-2xs"
                                title="Mark as Delivered / Completed"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark Done</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setIsPendingAppsModalOpen(false);
                                if (item.type === 'Certificate') onNavigateTab('certificates');
                                else if (item.type === 'Transaction') onNavigateTab('transactions');
                                else if (item.type === 'PAN') onNavigateTab('pan');
                                else if (item.type === 'Scholarship') onNavigateTab('scholarships');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition flex items-center gap-1"
                            >
                              <span>Manage</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredPendingAppsList.length} pending items</span>
              <button
                onClick={() => setIsPendingAppsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: PENDING DUES & RECOVERY TRACKER ==================== */}
      {isPendingDuesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/30">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <span>Pending Dues & Uncollected Balances</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black">
                      ₹{totalPendingPaymentsAmount.toLocaleString('en-IN')} Due
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Track and clear unpaid fees across all service transactions and certificate applications
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPendingDuesModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Customer Name, Mobile, or Receipt No..."
                    value={pendingDuesSearch}
                    onChange={(e) => setPendingDuesSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setPendingDuesCategory('All')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      pendingDuesCategory === 'All'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Dues ({totalPendingDueRecordsCount})
                  </button>
                  <button
                    onClick={() => setPendingDuesCategory('Transactions')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      pendingDuesCategory === 'Transactions'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Service Tx ({pendingDueTransactions.length})
                  </button>
                  <button
                    onClick={() => setPendingDuesCategory('Certificates')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      pendingDuesCategory === 'Certificates'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Certificates ({pendingDueCertificates.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Receipt / App No</th>
                    <th className="px-3 py-2.5">Customer / Mobile</th>
                    <th className="px-3 py-2.5">Service Name</th>
                    <th className="px-3 py-2.5 text-right">Fee</th>
                    <th className="px-3 py-2.5 text-right">Paid</th>
                    <th className="px-3 py-2.5 text-right">Balance Due</th>
                    <th className="px-3 py-2.5 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPendingDuesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        No pending dues records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredPendingDuesList.map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.type === 'Certificate'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {item.type === 'Certificate' ? <FileText className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                            {item.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700">
                          <div className="font-bold">{item.receiptNo}</div>
                          <div className="text-[10px] text-slate-400">{item.date}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-900">{item.customerName}</div>
                          <div className="text-[10px] text-slate-500">{item.mobile}</div>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">{item.serviceTitle}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-700">
                          ₹{item.totalAmount}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">
                          ₹{item.amountPaid}
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-rose-600 text-sm">
                          ₹{item.balanceDue}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleMarkPaid(item)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-2xs"
                              title="Mark full balance as paid"
                            >
                              <Check className="w-3 h-3" />
                              <span>Clear / Mark Paid</span>
                            </button>
                            {item.type === 'Transaction' && (
                              <button
                                onClick={() => onViewReceipt(item.rawItem)}
                                className="p-1 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 rounded-lg transition"
                                title="Print Receipt"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Total Dues in view: <strong className="text-rose-600">₹{filteredPendingDuesList.reduce((acc, i) => acc + i.balanceDue, 0).toLocaleString('en-IN')}</strong></span>
              <button
                onClick={() => setIsPendingDuesModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
