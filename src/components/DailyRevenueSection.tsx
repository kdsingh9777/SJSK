import React, { useState, useMemo } from 'react';
import {
  IndianRupee,
  Calendar,
  Search,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Receipt,
  FileText,
  CreditCard,
  GraduationCap,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  ServiceTransaction,
  CertificateApplication,
  ScholarshipApplication,
  PANApplication
} from '../types';
import * as XLSX from 'xlsx';

interface DailyRevenueSectionProps {
  transactions: ServiceTransaction[];
  certificates: CertificateApplication[];
  scholarships?: ScholarshipApplication[];
  panApplications?: PANApplication[];
}

export interface DayRevenueGroup {
  date: string; // YYYY-MM-DD or formatted string
  totalRevenue: number;
  totalDues: number;
  totalCount: number;
  transactionsCount: number;
  transactionsRevenue: number;
  certificatesCount: number;
  certificatesRevenue: number;
  scholarshipsCount: number;
  scholarshipsRevenue: number;
  panCount: number;
  panRevenue: number;
  items: Array<{
    id: string;
    source: 'Service Tx' | 'Certificate' | 'Scholarship' | 'PAN';
    title: string;
    customerName: string;
    receiptNo: string;
    amountPaid: number;
    balanceDue: number;
    paymentStatus: string;
    timeOrDate: string;
  }>;
}

export const DailyRevenueSection: React.FC<DailyRevenueSectionProps> = ({
  transactions,
  certificates,
  scholarships = [],
  panApplications = []
}) => {
  const [searchDate, setSearchDate] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'All' | 'Today' | 'ThisWeek' | 'ThisMonth'>('All');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Today string for calculations
  const todayStr = new Date().toISOString().split('T')[0];

  // Aggregate revenue data by Date
  const dateWiseData = useMemo(() => {
    const map: Record<string, DayRevenueGroup> = {};

    const getOrCreateGroup = (dateStr: string): DayRevenueGroup => {
      const cleanDate = dateStr && dateStr.trim() ? dateStr.trim().split('T')[0] : 'Unknown Date';
      if (!map[cleanDate]) {
        map[cleanDate] = {
          date: cleanDate,
          totalRevenue: 0,
          totalDues: 0,
          totalCount: 0,
          transactionsCount: 0,
          transactionsRevenue: 0,
          certificatesCount: 0,
          certificatesRevenue: 0,
          scholarshipsCount: 0,
          scholarshipsRevenue: 0,
          panCount: 0,
          panRevenue: 0,
          items: []
        };
      }
      return map[cleanDate];
    };

    // 1. Process Service Transactions
    transactions.forEach((tx) => {
      const d = tx.orderDate || tx.createdAt?.split('T')[0] || todayStr;
      const group = getOrCreateGroup(d);
      const paid = tx.amountPaid || 0;
      const due = tx.balanceDue || 0;

      group.totalRevenue += paid;
      group.totalDues += due;
      group.totalCount += 1;
      group.transactionsCount += 1;
      group.transactionsRevenue += paid;

      group.items.push({
        id: tx.id,
        source: 'Service Tx',
        title: tx.serviceName || 'CSC Service',
        customerName: tx.customerName || 'N/A',
        receiptNo: tx.receiptNo || tx.id,
        amountPaid: paid,
        balanceDue: due,
        paymentStatus: tx.paymentStatus,
        timeOrDate: tx.orderDate
      });
    });

    // 2. Process Certificate Applications
    certificates.forEach((cert) => {
      const d = cert.applicationDate || cert.createdAt?.split('T')[0] || todayStr;
      const group = getOrCreateGroup(d);
      const isPaid = cert.paymentStatus === 'Paid';
      const paid = isPaid ? cert.fee || 0 : 0;
      const due = !isPaid ? cert.fee || 0 : 0;

      group.totalRevenue += paid;
      group.totalDues += due;
      group.totalCount += 1;
      group.certificatesCount += 1;
      group.certificatesRevenue += paid;

      group.items.push({
        id: cert.id,
        source: 'Certificate',
        title: cert.certificateType,
        customerName: cert.applicantName,
        receiptNo: cert.applicationNo,
        amountPaid: paid,
        balanceDue: due,
        paymentStatus: cert.paymentStatus,
        timeOrDate: cert.applicationDate
      });
    });

    // 3. Process Scholarships
    scholarships.forEach((sch) => {
      const d = sch.applicationDate || sch.createdAt?.split('T')[0] || todayStr;
      const group = getOrCreateGroup(d);
      const amt = sch.amount || 0;

      group.totalRevenue += amt;
      group.totalCount += 1;
      group.scholarshipsCount += 1;
      group.scholarshipsRevenue += amt;

      group.items.push({
        id: sch.id,
        source: 'Scholarship',
        title: sch.scheme,
        customerName: sch.studentName,
        receiptNo: sch.applicationNo,
        amountPaid: amt,
        balanceDue: 0,
        paymentStatus: 'Paid',
        timeOrDate: sch.applicationDate
      });
    });

    // 4. Process PAN Applications
    panApplications.forEach((pan) => {
      const d = pan.date || pan.createdAt?.split('T')[0] || todayStr;
      const group = getOrCreateGroup(d);
      const panFee = 107; // Default CSC PAN fee standard

      group.totalRevenue += panFee;
      group.totalCount += 1;
      group.panCount += 1;
      group.panRevenue += panFee;

      group.items.push({
        id: pan.id,
        source: 'PAN',
        title: `${pan.applicationType} (${pan.panNumber || 'New'})`,
        customerName: pan.applicantName,
        receiptNo: pan.applicationNumber,
        amountPaid: panFee,
        balanceDue: 0,
        paymentStatus: 'Paid',
        timeOrDate: pan.date
      });
    });

    // Convert to array and sort descending by date
    const list = Object.values(map).sort((a, b) => {
      if (a.date === b.date) return 0;
      return a.date < b.date ? 1 : -1;
    });

    return list;
  }, [transactions, certificates, scholarships, panApplications, todayStr]);

  // Filter date-wise list
  const filteredDateWise = useMemo(() => {
    return dateWiseData.filter((group) => {
      // Date Search Filter
      if (searchDate && !group.date.includes(searchDate)) {
        return false;
      }

      // Range Filter
      if (dateRangeFilter === 'Today') {
        return group.date === todayStr;
      }

      if (dateRangeFilter === 'ThisWeek') {
        const dateObj = new Date(group.date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }

      if (dateRangeFilter === 'ThisMonth') {
        const groupMonth = group.date.substring(0, 7);
        const currentMonth = todayStr.substring(0, 7);
        return groupMonth === currentMonth;
      }

      return true;
    });
  }, [dateWiseData, searchDate, dateRangeFilter, todayStr]);

  // High level totals across filtered items
  const grandTotalRevenue = useMemo(() => {
    return filteredDateWise.reduce((acc, g) => acc + g.totalRevenue, 0);
  }, [filteredDateWise]);

  const grandTotalDues = useMemo(() => {
    return filteredDateWise.reduce((acc, g) => acc + g.totalDues, 0);
  }, [filteredDateWise]);

  const todayRevenue = useMemo(() => {
    const todayGroup = dateWiseData.find((g) => g.date === todayStr);
    return todayGroup ? todayGroup.totalRevenue : 0;
  }, [dateWiseData, todayStr]);

  const highestRevenueDay = useMemo(() => {
    if (dateWiseData.length === 0) return null;
    return dateWiseData.reduce((prev, curr) => (curr.totalRevenue > prev.totalRevenue ? curr : prev), dateWiseData[0]);
  }, [dateWiseData]);

  // Toggle Row Expansion
  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Export to Excel
  const handleExportExcel = () => {
    const excelRows: any[] = [];
    filteredDateWise.forEach((group) => {
      excelRows.push({
        Date: group.date,
        'Total Jobs': group.totalCount,
        'Service Tx Revenue': `₹${group.transactionsRevenue}`,
        'Certificate Revenue': `₹${group.certificatesRevenue}`,
        'Scholarship Revenue': `₹${group.scholarshipsRevenue}`,
        'PAN Revenue': `₹${group.panRevenue}`,
        'Total Revenue (Collected)': `₹${group.totalRevenue}`,
        'Total Pending Dues': `₹${group.totalDues}`
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Date-wise Revenue');
    XLSX.writeFile(workbook, `Daily_Revenue_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold mb-2 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Financial Analytics & Date-wise Ledger</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <IndianRupee className="w-6 h-6 text-emerald-400" />
              <span>Date-Wise Revenue & Earnings Section</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1">
              Track daily collections, certificate fees, service charges, and pending dues date by date.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue Recd</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">
              ₹{grandTotalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Net cash & UPI payments collected
          </p>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600">
              ₹{todayRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-bold">Today</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Total collection logged for {todayStr}
          </p>
        </div>

        {/* Total Dues */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Total Pending Dues</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">
              ₹{grandTotalDues.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Unpaid balances across all dates
          </p>
        </div>

        {/* Highest Collection Day */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Best Day Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-700">
              ₹{(highestRevenueDay?.totalRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Peak Date: <strong className="text-slate-700 font-semibold">{highestRevenueDay?.date || 'N/A'}</strong>
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search by date string */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by Date (e.g. 2026-08-07)..."
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Quick Date Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Range:
            </span>
            <button
              onClick={() => setDateRangeFilter('All')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                dateRangeFilter === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => setDateRangeFilter('Today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                dateRangeFilter === 'Today'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRangeFilter('ThisWeek')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                dateRangeFilter === 'ThisWeek'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRangeFilter('ThisMonth')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                dateRangeFilter === 'ThisMonth'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* Date-wise Breakdown Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Date-wise Revenue Ledger</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {filteredDateWise.length} Dates Recorded
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Total Jobs</th>
                <th className="px-4 py-3 text-right">Service Tx Revenue</th>
                <th className="px-4 py-3 text-right">Certificate Revenue</th>
                <th className="px-4 py-3 text-right">PAN/Scholarship</th>
                <th className="px-4 py-3 text-right">Total Collected</th>
                <th className="px-4 py-3 text-right">Pending Dues</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDateWise.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No date revenue records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDateWise.map((group) => {
                  const isExpanded = !!expandedDates[group.date];
                  const isToday = group.date === todayStr;

                  return (
                    <React.Fragment key={group.date}>
                      <tr className={`transition ${isToday ? 'bg-emerald-50/40' : 'hover:bg-slate-50/80'}`}>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">{group.date}</span>
                            {isToday && (
                              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                                TODAY
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">
                          {group.totalCount}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          ₹{group.transactionsRevenue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          ₹{group.certificatesRevenue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          ₹{(group.panRevenue + group.scholarshipsRevenue).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-emerald-700 text-sm">
                          ₹{group.totalRevenue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">
                          {group.totalDues > 0 ? `₹${group.totalDues.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleExpand(group.date)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                          >
                            <span>{isExpanded ? 'Hide' : 'Details'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Item Breakdown for this Date */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-inner">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                  <Receipt className="w-4 h-4 text-emerald-600" />
                                  <span>Transactions & Applications recorded on {group.date}</span>
                                </h4>
                                <span className="text-xs text-slate-500 font-medium">
                                  {group.items.length} records found
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">
                                    <tr>
                                      <th className="px-3 py-2">Module</th>
                                      <th className="px-3 py-2">Service / Application</th>
                                      <th className="px-3 py-2">Customer / Applicant</th>
                                      <th className="px-3 py-2">Receipt / App No</th>
                                      <th className="px-3 py-2 text-right">Collected (₹)</th>
                                      <th className="px-3 py-2 text-right">Due (₹)</th>
                                      <th className="px-3 py-2 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {group.items.map((item) => (
                                      <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2">
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                            {item.source === 'Service Tx' && <Receipt className="w-3 h-3 text-amber-600" />}
                                            {item.source === 'Certificate' && <FileText className="w-3 h-3 text-indigo-600" />}
                                            {item.source === 'Scholarship' && <GraduationCap className="w-3 h-3 text-emerald-600" />}
                                            {item.source === 'PAN' && <CreditCard className="w-3 h-3 text-rose-600" />}
                                            {item.source}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 font-medium text-slate-900">{item.title}</td>
                                        <td className="px-3 py-2 text-slate-700">{item.customerName}</td>
                                        <td className="px-3 py-2 font-mono text-slate-600">{item.receiptNo}</td>
                                        <td className="px-3 py-2 text-right font-bold text-emerald-700">
                                          ₹{item.amountPaid}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-rose-600">
                                          {item.balanceDue > 0 ? `₹${item.balanceDue}` : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            item.paymentStatus === 'Paid'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}>
                                            {item.paymentStatus}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
