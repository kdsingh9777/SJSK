import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Lock, 
  Unlock, 
  FileCheck, 
  Download, 
  Eye, 
  Plus, 
  Phone, 
  CreditCard, 
  MapPin, 
  Trash2, 
  Edit, 
  History, 
  Upload, 
  ShieldAlert,
  FileText,
  Printer
} from 'lucide-react';
import { Customer, CustomerDocument, ServiceTransaction, CertificateApplication } from '../types';
import { exportCustomersToExcel } from '../lib/excel';

interface CustomerManagementProps {
  customers: Customer[];
  transactions: ServiceTransaction[];
  certificates: CertificateApplication[];
  isAdminUnlocked: boolean;
  onOpenAdminLockModal: () => void;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onViewReceipt: (tx: ServiceTransaction) => void;
  onOpenNewTransactionForCustomer?: (customer: Customer) => void;
  onOpenNewCertificateForCustomer?: (customer: Customer) => void;
  initialSearchQuery?: string;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  transactions,
  certificates,
  isAdminUnlocked,
  onOpenAdminLockModal,
  onSaveCustomer,
  onDeleteCustomer,
  onViewReceipt,
  onOpenNewTransactionForCustomer,
  onOpenNewCertificateForCustomer,
  initialSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Customer Edit/Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<Partial<Customer> | null>(null);
  const [custToDelete, setCustToDelete] = useState<Customer | null>(null);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Document Upload Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<CustomerDocument['type']>('Aadhaar');
  const [docFileData, setDocFileData] = useState<string>('');
  const [docFileName, setDocFileName] = useState('');

  const openNewCustomerModal = () => {
    setEditingCust(null);
    setName('');
    setFatherName('');
    setMobile('');
    setAadhaar('');
    setAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditCustomerModal = (cust: Customer) => {
    setEditingCust(cust);
    setName(cust.name);
    setFatherName(cust.fatherName || '');
    setMobile(cust.mobile);
    setAadhaar(cust.aadhaar || '');
    setAddress(cust.address);
    setNotes(cust.notes || '');
    setIsModalOpen(true);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      alert('Please enter Customer Name and Mobile Number!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newCust: Customer = {
      id: editingCust?.id || `cust-${Date.now()}`,
      name: name.trim(),
      fatherName: fatherName.trim(),
      mobile: mobile.trim(),
      aadhaar: aadhaar.trim(),
      address: address.trim(),
      notes: notes.trim(),
      documents: editingCust?.documents || [],
      createdAt: editingCust?.createdAt || todayStr,
      updatedAt: new Date().toISOString(),
    };

    onSaveCustomer(newCust);
    setIsModalOpen(false);
    if (selectedCustomer?.id === newCust.id) {
      setSelectedCustomer(newCust);
    }
  };

  // Handle File Upload for Document Vault
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocFileData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!docName.trim() || !docFileData) {
      alert('Please select a file and enter Document Name!');
      return;
    }

    const newDoc: CustomerDocument = {
      id: `doc-${Date.now()}`,
      name: docName.trim(),
      type: docType,
      fileData: docFileData,
      fileName: docFileName || `${docType}_document.pdf`,
      fileSize: 'Saved',
      uploadDate: new Date().toISOString().split('T')[0],
      isLocked: true,
    };

    const updatedCustomer: Customer = {
      ...selectedCustomer,
      documents: [...(selectedCustomer.documents || []), newDoc],
      updatedAt: new Date().toISOString(),
    };

    onSaveCustomer(updatedCustomer);
    setSelectedCustomer(updatedCustomer);
    setIsDocModalOpen(false);
    setDocName('');
    setDocFileData('');
    setDocFileName('');
  };

  const handleDeleteDocument = (docId: string) => {
    if (!selectedCustomer) return;
    if (!isAdminUnlocked) {
      onOpenAdminLockModal();
      return;
    }
    setDocToDelete(docId);
  };

  const confirmDeleteDoc = () => {
    if (!selectedCustomer || !docToDelete) return;
    const updatedCustomer: Customer = {
      ...selectedCustomer,
      documents: selectedCustomer.documents.filter((d) => d.id !== docToDelete),
      updatedAt: new Date().toISOString(),
    };
    onSaveCustomer(updatedCustomer);
    setSelectedCustomer(updatedCustomer);
    setDocToDelete(null);
  };

  // Search Logic (Search by Name, Mobile, Aadhaar)
  const filteredCustomers = customers.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.mobile.includes(query) ||
      c.aadhaar.includes(query) ||
      (c.fatherName && c.fatherName.toLowerCase().includes(query))
    );
  });

  // Selected customer history
  const customerTxs = selectedCustomer
    ? transactions.filter((t) => t.customerId === selectedCustomer.id || t.customerMobile === selectedCustomer.mobile)
    : [];

  const customerCerts = selectedCustomer
    ? certificates.filter((c) => c.customerId === selectedCustomer.id || c.mobile === selectedCustomer.mobile)
    : [];

  const customerTotalPaid = customerTxs.reduce((acc, t) => acc + (t.amountPaid || 0), 0);
  const customerTotalDue = customerTxs.reduce((acc, t) => acc + (t.balanceDue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <span>Customer Profile & Document Vault</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search customers by name, mobile number, or Aadhaar number. Keep Aadhaar PDF, PAN, and photos secure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCustomersToExcel(filteredCustomers)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel Data</span>
          </button>

          <button
            onClick={openNewCustomerModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search instantly by name, mobile number, or 12-digit Aadhaar number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Main Two-Column Layout: Customer Directory List vs Selected Profile Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Directory Table/List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Customer List ({filteredCustomers.length})
            </h3>
            <span className="text-[11px] text-slate-400">Click profile to view</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedCustomer?.id === c.id
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                    {c.fatherName && (
                      <p className="text-[11px] text-slate-500">Father: {c.fatherName}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {c.documents?.length || 0} files
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {c.mobile}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Aadhaar: XXXX-{c.aadhaar.slice(-4) || '****'}
                  </span>
                </div>
              </div>
            ))}
            {filteredCustomers.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No customers found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Details, Document Vault & Full History */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCustomer ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-6">
              {/* Profile Top Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                    <button
                      onClick={() => openEditCustomerModal(selectedCustomer)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                      title="Edit Profile"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCustToDelete(selectedCustomer)}
                      className="p-1 text-rose-400 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Father/Husband: {selectedCustomer.fatherName || 'Not entered'} • Address: {selectedCustomer.address}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenNewTransactionForCustomer && (
                    <button
                      onClick={() => onOpenNewTransactionForCustomer(selectedCustomer)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition"
                    >
                      + New Service
                    </button>
                  )}
                  {onOpenNewCertificateForCustomer && (
                    <button
                      onClick={() => onOpenNewCertificateForCustomer(selectedCustomer)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      + Income/Caste/Residence
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-400 font-medium block">Mobile Number</span>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedCustomer.mobile}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-400 font-medium block">Aadhaar Card Number</span>
                  <span className="font-mono font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    {selectedCustomer.aadhaar ? `XXXX-XXXX-${selectedCustomer.aadhaar.slice(-4)}` : 'Not available'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-slate-400 font-medium block">Due Balance</span>
                  <span className={`font-bold text-sm block mt-0.5 ${customerTotalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {customerTotalDue > 0 ? `Due: ₹${customerTotalDue}` : 'Fully Paid ✓'}
                  </span>
                </div>
              </div>

              {/* Section 1: Secure Document Vault (Aadhaar PDF, PAN, Photo) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Secure Document Vault (Aadhaar PDF, PAN, Photos)
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isAdminUnlocked && (
                      <button
                        onClick={onOpenAdminLockModal}
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-200 transition"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Unlock with PIN</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsDocModalOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>+ Upload New Document</span>
                    </button>
                  </div>
                </div>

                {/* Document Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCustomer.documents?.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {doc.type === 'Aadhaar' ? 'Aadhaar' : doc.type === 'PAN' ? 'PAN' : 'Photo'}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                          <p className="text-[10px] text-slate-400">
                            {doc.fileName} • {doc.uploadDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isAdminUnlocked ? (
                          <>
                            <a
                              href={doc.fileData}
                              download={doc.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="View / Download"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={onOpenAdminLockModal}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-[10px] font-bold"
                            title="Unlock Admin Lock to View"
                          >
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Locked</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!selectedCustomer.documents || selectedCustomer.documents.length === 0) && (
                    <div className="col-span-2 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
                      No Aadhaar PDF or PAN uploaded to secure vault yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Full Customer History */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-500" />
                    <span>Customer History & Receipts</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {customerTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{tx.serviceName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono">Receipt: {tx.receiptNo}</span>
                          <span>Date: {tx.orderDate}</span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="font-bold text-slate-900">₹{tx.fee}</div>
                          <div className={tx.paymentStatus === 'Paid' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                            {tx.paymentStatus === 'Paid' ? 'Paid' : `Due ₹${tx.balanceDue}`}
                          </div>
                        </div>

                        <button
                          onClick={() => onViewReceipt(tx)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Print / Download Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {customerCerts.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-indigo-900">{cert.certificateType}</div>
                        <div className="text-[10px] text-indigo-600">
                          App No: {cert.applicationNo} • Date: {cert.applicationDate}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-900">₹{cert.fee}</div>
                        <div className="text-[10px] font-bold">
                          {cert.deliveryStatus === 'Delivered' ? (
                            <span className="text-emerald-600">Delivered</span>
                          ) : (
                            <span className="text-amber-600">Not Delivered</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {customerTxs.length === 0 && customerCerts.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-xs italic">
                      No previous history recorded for this customer.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
              <Users className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">No Customer Selected</h3>
              <p className="text-xs">
                Click on a customer from the left list or add a new customer.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <span>{editingCust ? 'Edit Customer Details' : 'Create New Customer Profile'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ram Kumar Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Father or Husband Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shiv Prasad Verma"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Aadhaar Card Number (12 digits)</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="234567890123"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Address</label>
                <input
                  type="text"
                  placeholder="Village, Post, Tehsil, District..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Special notes related to customer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30"
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
                  {editingCust ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <span>Upload to Document Vault</span>
              </h3>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aadhaar Card Front-Back PDF"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as CustomerDocument['type'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  <option value="Aadhaar">Aadhaar Card (Aadhaar PDF)</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Photo">Passport Size Photo</option>
                  <option value="RationCard">Ration Card</option>
                  <option value="Marksheet">Marksheet</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Choose File (PDF/Image) *</label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
                />
                {docFileName && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">Selected: {docFileName}</p>
                )}
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This file will be saved securely in encrypted local storage. Only unlocked with your Admin PIN.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition"
                >
                  Save Securely in Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Customer Delete Confirmation Modal */}
      {custToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Customer Profile</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete customer <strong className="text-slate-900">{custToDelete.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setCustToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteCustomer(custToDelete.id);
                  if (selectedCustomer?.id === custToDelete.id) {
                    setSelectedCustomer(null);
                  }
                  setCustToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vault Document Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Remove Vault Document</h3>
                <p className="text-xs text-slate-500">Remove from customer vault</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to remove this document from the vault?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDoc}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Remove Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
