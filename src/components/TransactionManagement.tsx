import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  IndianRupee,
  Filter,
  Users,
  PlusCircle,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { ServiceTransaction, PaymentStatus, WorkStatus, Customer } from '../types';
import { exportTransactionsToExcel } from '../lib/excel';

interface TransactionManagementProps {
  transactions: ServiceTransaction[];
  customers: Customer[];
  onSaveTransaction: (tx: ServiceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onViewReceipt: (tx: ServiceTransaction) => void;
  initialOpenModal?: boolean;
  preselectedCustomer?: Customer | null;
}

const COMMON_SERVICES = [
  'New PAN Card',
  'PAN Card Correction',
  'Aadhaar Biometric / Update',
  'Income Certificate',
  'Caste Certificate',
  'Domicile Certificate',
  'PM Kisan eKYC',
  'Electricity Bill Payment',
  'Pension eKYC',
  'Ration Card Application',
  'Ayushman Bharat Card',
  'Passport Application',
  'AEPS Cash Out',
  'Other CSC Service'
];

export const TransactionManagement: React.FC<TransactionManagementProps> = ({
  transactions,
  customers,
  onSaveTransaction,
  onDeleteTransaction,
  onViewReceipt,
  initialOpenModal = false,
  preselectedCustomer = null,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'transactions'>('customers');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [workFilter, setWorkFilter] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal);
  const [editingTx, setEditingTx] = useState<Partial<ServiceTransaction> | null>(null);
  const [txToDelete, setTxToDelete] = useState<ServiceTransaction | null>(null);

  // Form State - Default fee is set to 70
  const [customerName, setCustomerName] = useState(preselectedCustomer?.name || '');
  const [customerMobile, setCustomerMobile] = useState(preselectedCustomer?.mobile || '');
  const [customerAadhaar, setCustomerAadhaar] = useState(preselectedCustomer?.aadhaar || '');
  const [customerId, setCustomerId] = useState(preselectedCustomer?.id || '');
  const [serviceName, setServiceName] = useState('Income Certificate');
  const [fee, setFee] = useState<number>(70);
  const [amountPaid, setAmountPaid] = useState<number>(70);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [workStatus, setWorkStatus] = useState<WorkStatus>('Completed');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const openNewTxModal = (cust?: Customer) => {
    const targetCust = cust || preselectedCustomer;
    setEditingTx(null);
    setCustomerName(targetCust?.name || '');
    setCustomerMobile(targetCust?.mobile || '');
    setCustomerAadhaar(targetCust?.aadhaar || '');
    setCustomerId(targetCust?.id || '');
    setServiceName('Income Certificate');
    setFee(70);
    setAmountPaid(70);
    setPaymentStatus('Paid');
    setWorkStatus('Completed');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditTxModal = (tx: ServiceTransaction) => {
    setEditingTx(tx);
    setCustomerName(tx.customerName);
    setCustomerMobile(tx.customerMobile);
    setCustomerAadhaar(tx.customerAadhaar || '');
    setCustomerId(tx.customerId);
    setServiceName(tx.serviceName);
    setFee(tx.fee);
    setAmountPaid(tx.amountPaid);
    setPaymentStatus(tx.paymentStatus);
    setWorkStatus(tx.workStatus);
    setDeliveryDate(tx.deliveryDate);
    setNotes(tx.notes || '');
    setIsModalOpen(true);
  };

  const handleSelectCustomer = (custName: string) => {
    const cust = customers.find((c) => c.name === custName);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerMobile(cust.mobile);
      setCustomerAadhaar(cust.aadhaar || '');
      setCustomerId(cust.id);
    }
  };

  const handleFeeChange = (val: number) => {
    setFee(val);
    if (paymentStatus === 'Paid') {
      setAmountPaid(val);
    }
  };

  const handlePaymentStatusChange = (status: PaymentStatus) => {
    setPaymentStatus(status);
    if (status === 'Paid') setAmountPaid(fee);
    else if (status === 'Unpaid') setAmountPaid(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !serviceName.trim()) {
      alert('Please enter Customer Name and Service Name!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const balanceDue = Math.max(0, fee - amountPaid);
    let finalPayStatus: PaymentStatus = paymentStatus;
    if (amountPaid >= fee) finalPayStatus = 'Paid';
    else if (amountPaid === 0) finalPayStatus = 'Unpaid';
    else finalPayStatus = 'Partial';

    const newTx: ServiceTransaction = {
      id: editingTx?.id || `tx-${Date.now()}`,
      receiptNo: editingTx?.receiptNo || `CSC-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`,
      customerId: customerId || `cust-${Date.now()}`,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      customerAadhaar: customerAadhaar.trim(),
      serviceName: serviceName.trim(),
      fee: Number(fee),
      amountPaid: Number(amountPaid),
      balanceDue,
      paymentStatus: finalPayStatus,
      workStatus,
      orderDate: editingTx?.orderDate || todayStr,
      deliveryDate: deliveryDate || todayStr,
      notes: notes.trim(),
      createdAt: editingTx?.createdAt || new Date().toISOString(),
      isSync: true,
    };

    onSaveTransaction(newTx);
    setIsModalOpen(false);
  };

  // Filter Customers
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      (c.fatherName && c.fatherName.toLowerCase().includes(q)) ||
      (c.aadhaar && c.aadhaar.includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  // Filter Transactions
  const filteredTxs = transactions.filter((tx) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      tx.customerName.toLowerCase().includes(query) ||
      tx.receiptNo.toLowerCase().includes(query) ||
      tx.customerMobile.includes(query) ||
      tx.serviceName.toLowerCase().includes(query);

    const matchesPayment = paymentFilter === 'All' || tx.paymentStatus === paymentFilter;
    const matchesWork = workFilter === 'All' || tx.workStatus === workFilter;

    return matchesQuery && matchesPayment && matchesWork;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-500" />
            <span>All CSC Services & Receipt Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Record service name, fee, payment status (Paid/Unpaid), work status, and delivery date for every task.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTransactionsToExcel(filteredTxs)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel Report</span>
          </button>

          <button
            onClick={openNewTxModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Work</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar for Customer Database vs Transactions */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('customers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeSubTab === 'customers'
              ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-500'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Users className="w-4 h-4 text-slate-950" />
          <span>Saved Customer Database</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-600 text-white font-extrabold">
            {customers.length} Saved
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeSubTab === 'transactions'
              ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-500'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Receipt className="w-4 h-4 text-slate-950" />
          <span>All Service Receipts & Work History</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 font-extrabold">
            {transactions.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: SAVED CUSTOMER DATABASE TABLE */}
      {activeSubTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer name, mobile, father name, address..."
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
              />
            </div>

            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers in database</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Customer Name & Father</th>
                    <th className="py-3.5 px-4">Mobile & Aadhaar</th>
                    <th className="py-3.5 px-4">Full Address</th>
                    <th className="py-3.5 px-4 text-center">Service History</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 italic">
                        No customer records found in the database.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const custTxs = transactions.filter(
                        (t) => t.customerMobile === cust.mobile || t.customerName.toLowerCase() === cust.name.toLowerCase()
                      );
                      return (
                        <tr key={cust.id} className="hover:bg-amber-50/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{cust.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {cust.fatherName ? `Father: ${cust.fatherName}` : 'S/o: N/A'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-800">Mob: {cust.mobile}</div>
                            {cust.aadhaar && (
                              <div className="text-[10px] text-slate-500 font-mono">Aadhaar: {cust.aadhaar}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                            {cust.address || '-'}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold">
                              {custTxs.length} Receipts
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => openNewTxModal(cust)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create Service / Receipt</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ALL TRANSACTIONS & RECEIPTS */}
      {activeSubTab === 'transactions' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search: Receipt No / Customer / Service / Mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
                >
                  <option value="All">All Payment Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid / Due</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>

              <div>
                <select
                  value={workFilter}
                  onChange={(e) => setWorkFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
                >
                  <option value="All">All Work Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Receipt No / Date</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4 text-right">Fee / Paid / Due</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Work Status</th>
                <th className="py-3 px-4 text-center">Delivery Date</th>
                <th className="py-3 px-4 text-center">Receipt & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredTxs.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    <div>{tx.receiptNo}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{tx.orderDate}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{tx.customerName}</div>
                    <div className="text-[10px] text-slate-500">Mob: {tx.customerMobile}</div>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">{tx.serviceName}</td>

                  <td className="py-3 px-4 text-right">
                    <div className="font-bold text-slate-900">₹{tx.fee}</div>
                    <div className="text-[10px]">
                      <span className="text-emerald-600 font-bold">Paid ₹{tx.amountPaid}</span>
                      {tx.balanceDue > 0 && (
                        <span className="text-rose-600 font-bold ml-1.5">(Due ₹{tx.balanceDue})</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : tx.paymentStatus === 'Unpaid'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {tx.paymentStatus === 'Paid' ? '✓ Paid' : tx.paymentStatus === 'Unpaid' ? '✗ Unpaid' : 'Partial'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.workStatus === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.workStatus === 'Completed'
                          ? 'bg-blue-100 text-blue-800'
                          : tx.workStatus === 'In Progress'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.workStatus === 'Delivered'
                        ? 'Delivered'
                        : tx.workStatus === 'Completed'
                        ? 'Completed'
                        : tx.workStatus === 'In Progress'
                        ? 'In Progress'
                        : 'Pending'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                    {tx.deliveryDate || '-'}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewReceipt(tx)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="View / Print Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditTxModal(tx)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTxToDelete(tx)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTxs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                    No service records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                <span>{editingTx ? 'Edit Service Record' : 'Record New CSC Service Work'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {/* Customer Selector */}
              {customers.length > 0 && !editingTx && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Existing Customer (Auto-fill)</label>
                  <select
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="">-- Select Customer (or enter name below) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.mobile})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ram Kumar Verma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select or Enter Service Name *</label>
                <div className="space-y-1.5">
                  <select
                    value={COMMON_SERVICES.includes(serviceName) ? serviceName : 'Other CSC Service'}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-semibold text-slate-900"
                  >
                    {COMMON_SERVICES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom service name..."
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    value={fee}
                    onChange={(e) => handleFeeChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-700 bg-emerald-50/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => handlePaymentStatusChange(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid / Due</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Work Status</label>
                  <select
                    value={workStatus}
                    onChange={(e) => setWorkStatus(e.target.value as WorkStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Details / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Application No / Special Instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition"
                >
                  {editingTx ? 'Update' : 'Save & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Service Transaction</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete transaction receipt <strong className="text-slate-900">{txToDelete.receiptNo}</strong> for customer <strong className="text-slate-900">{txToDelete.customerName}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteTransaction(txToDelete.id);
                  setTxToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
