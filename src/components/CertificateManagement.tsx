import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  IndianRupee,
  UserCheck,
  Building,
  Sparkles
} from 'lucide-react';
import { CertificateApplication, CertificateType, Customer } from '../types';
import { exportCertificatesToExcel } from '../lib/excel';

interface CertificateManagementProps {
  certificates: CertificateApplication[];
  customers: Customer[];
  onSaveCertificate: (cert: CertificateApplication) => void;
  onDeleteCertificate: (id: string) => void;
  initialOpenModal?: boolean;
}

export const CertificateManagement: React.FC<CertificateManagementProps> = ({
  certificates,
  customers,
  onSaveCertificate,
  onDeleteCertificate,
  initialOpenModal = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('All');
  const [selectedDeliveryFilter, setSelectedDeliveryFilter] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal);
  const [editingCert, setEditingCert] = useState<Partial<CertificateApplication> | null>(null);
  const [certToDelete, setCertToDelete] = useState<CertificateApplication | null>(null);

  // Form State
  const [applicantName, setApplicantName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [certType, setCertType] = useState<CertificateType>('Income Certificate');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [deliveryStatus, setDeliveryStatus] = useState<'Delivered' | 'Not Delivered'>('Not Delivered');
  const [applicationNo, setApplicationNo] = useState('');
  const [fee, setFee] = useState<number>(150);
  const [notes, setNotes] = useState('');

  const openNewModal = () => {
    setEditingCert(null);
    setApplicantName('');
    setFatherName('');
    setAddress('');
    setMobile('');
    setAadhaar('');
    setCertType('Income Certificate');
    setPaymentStatus('Paid');
    setDeliveryStatus('Not Delivered');
    setApplicationNo(String(Date.now()).slice(-10));
    setFee(150);
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

  const handleSelectExistingCustomer = (custName: string) => {
    const cust = customers.find((c) => c.name === custName);
    if (cust) {
      setApplicantName(cust.name);
      setFatherName(cust.fatherName || '');
      setAddress(cust.address);
      setMobile(cust.mobile);
      setAadhaar(cust.aadhaar || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !fatherName.trim()) {
      alert('Please fill in applicant name and father name!');
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
      fee: Number(fee) || 150,
      applicationDate: editingCert?.applicationDate || todayStr,
      targetDeliveryDate: editingCert?.targetDeliveryDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      notes: notes.trim(),
      createdAt: editingCert?.createdAt || new Date().toISOString(),
    };

    onSaveCertificate(newCert);
    setIsModalOpen(false);
  };

  // Filter Logic
  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.fatherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.mobile.includes(searchQuery);

    const matchesType = selectedType === 'All' || cert.certificateType === selectedType;
    const matchesPayment = selectedPaymentFilter === 'All' || cert.paymentStatus === selectedPaymentFilter;
    const matchesDelivery = selectedDeliveryFilter === 'All' || cert.deliveryStatus === selectedDeliveryFilter;

    return matchesSearch && matchesType && matchesPayment && matchesDelivery;
  });

  return (
    <div className="space-y-6">
      {/* Top Title & Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>e-District Special Services</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            Certificate Management (Income, Caste, Domicile)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track application numbers, applicant details, payment status, and delivery status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCertificatesToExcel(filteredCertificates)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Application</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name / father / application no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Certificate Type Dropdown */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
            >
              <option value="All">All Certificate Types</option>
              <option value="Income Certificate">Income Certificate</option>
              <option value="Caste Certificate">Caste Certificate</option>
              <option value="Domicile Certificate">Domicile Certificate</option>
              <option value="Disability Certificate">Disability Certificate</option>
              <option value="Encumbrance Certificate">Encumbrance Certificate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Payment Status Dropdown (Paid / Unpaid) */}
          <div>
            <select
              value={selectedPaymentFilter}
              onChange={(e) => setSelectedPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Delivery Status Dropdown (Delivered / Not Delivered) */}
          <div>
            <select
              value={selectedDeliveryFilter}
              onChange={(e) => setSelectedDeliveryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
            >
              <option value="All">All Delivery Statuses</option>
              <option value="Delivered">Delivered</option>
              <option value="Not Delivered">Not Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Application No</th>
                <th className="py-3 px-4">Applicant Name & Details</th>
                <th className="py-3 px-4">Father Name</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4 text-center">Fee (₹)</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Delivery Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-50/80 transition">
                  {/* Application No */}
                  <td className="py-3 px-4 font-mono font-bold text-indigo-900">
                    <div>{cert.applicationNo}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{cert.applicationDate}</div>
                  </td>

                  {/* Applicant Name & Mobile */}
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div>{cert.applicantName}</div>
                    <div className="text-[11px] text-slate-500 font-normal">Mob: {cert.mobile}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">{cert.address}</div>
                  </td>

                  {/* Father's Name */}
                  <td className="py-3 px-4 font-medium text-slate-700">{cert.fatherName}</td>

                  {/* Document Type */}
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg font-bold border border-indigo-100 text-[11px]">
                      {cert.certificateType}
                    </span>
                  </td>

                  {/* Fee */}
                  <td className="py-3 px-4 text-center font-bold text-slate-900">₹{cert.fee}</td>

                  {/* Paid / Unpaid Status Toggle Button */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        const nextStatus = cert.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
                        onSaveCertificate({ ...cert, paymentStatus: nextStatus });
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition shadow-2xs ${
                        cert.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                      }`}
                      title="Click to toggle payment status"
                    >
                      {cert.paymentStatus === 'Paid' ? '✓ Paid' : '✗ Unpaid'}
                    </button>
                  </td>

                  {/* Delivery Status Toggle Button */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        const nextStatus = cert.deliveryStatus === 'Delivered' ? 'Not Delivered' : 'Delivered';
                        onSaveCertificate({ ...cert, deliveryStatus: nextStatus });
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition shadow-2xs ${
                        cert.deliveryStatus === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                      }`}
                      title="Click to toggle delivery status"
                    >
                      {cert.deliveryStatus === 'Delivered' ? '✓ Delivered' : '⏳ Not Delivered'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(cert)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Application"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCertToDelete(cert)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCertificates.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                    No records found. Please adjust filters or add a new application.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>{editingCert ? 'Edit Certificate Application' : 'New Certificate Application'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {/* Quick Select from existing customer */}
              {customers.length > 0 && !editingCert && (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Select Existing Customer (Auto-fill):
                  </label>
                  <select
                    onChange={(e) => handleSelectExistingCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="">-- Select Customer (or enter new) --</option>
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
                  <label className="block text-slate-700 font-bold mb-1">Applicant Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ram Kumar Verma"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Father / Husband Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shiv Prasad Verma"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Village, Post, Block, Tehsil, District..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Application Number (Ref No.)</label>
                  <input
                    type="text"
                    placeholder="e.g. 24561009871"
                    value={applicationNo}
                    onChange={(e) => setApplicationNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Document Type Dropdown */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Certificate Type *</label>
                  <select
                    value={certType}
                    onChange={(e) => setCertType(e.target.value as CertificateType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30 font-bold text-indigo-900 bg-indigo-50/30"
                  >
                    <option value="Income Certificate">Income Certificate</option>
                    <option value="Caste Certificate">Caste Certificate</option>
                    <option value="Domicile Certificate">Domicile Certificate</option>
                    <option value="Disability Certificate">Disability Certificate</option>
                    <option value="Encumbrance Certificate">Encumbrance Certificate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fee Amount (₹)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Paid / Unpaid Status Dropdown */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'Paid' | 'Unpaid')}
                    className={`w-full px-3 py-2 border rounded-xl font-bold ${
                      paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>

                {/* Delivered / Not Delivered Status Dropdown */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Delivery Status</label>
                  <select
                    value={deliveryStatus}
                    onChange={(e) => setDeliveryStatus(e.target.value as 'Delivered' | 'Not Delivered')}
                    className={`w-full px-3 py-2 border rounded-xl font-bold ${
                      deliveryStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <option value="Not Delivered">Not Delivered</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Additional Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Lekhpal report submitted / Pending at Tehsil"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30"
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition"
                >
                  {editingCert ? 'Update Application' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {certToDelete && (
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
              Are you sure you want to delete application for <strong className="text-slate-900">{certToDelete.applicantName}</strong> (App No: {certToDelete.applicationNo})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setCertToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteCertificate(certToDelete.id);
                  setCertToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Delete Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
