import React, { useState } from 'react';
import { X, Save, CreditCard } from 'lucide-react';
import { PANApplication, PANApplicationType, PANStatus } from '../../types';

interface PANApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: PANApplication) => void;
  initialData?: PANApplication | null;
  operatorName: string;
}

export const PANApplicationModal: React.FC<PANApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  operatorName,
}) => {
  const [formData, setFormData] = useState<Partial<PANApplication>>(() => {
    if (initialData) return { ...initialData };
    return {
      applicantName: '',
      fatherName: '',
      dob: '1995-01-01',
      mobile: '',
      email: '',
      address: '',
      applicationNumber: `N2026${String(Date.now()).slice(-6)}`,
      panNumber: '',
      applicationType: 'New PAN Card',
      currentStatus: 'Pending',
      date: new Date().toISOString().split('T')[0],
      operatorName: operatorName || 'Operator (VLE)',
      remarks: '',
    };
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicantName || !formData.fatherName || !formData.mobile) {
      alert('Please enter applicant name, father name, and mobile number');
      return;
    }

    const typePrefix = formData.applicationType === 'New PAN Card' ? 'N' : formData.applicationType === 'PAN Correction' ? 'C' : 'R';
    const appNo = formData.applicationNumber || `${typePrefix}2026${String(Date.now()).slice(-6)}`;

    const panToSave: PANApplication = {
      id: formData.id || `pan-${Date.now()}`,
      applicantName: formData.applicantName || '',
      fatherName: formData.fatherName || '',
      dob: formData.dob || '',
      mobile: formData.mobile || '',
      email: formData.email || '',
      address: formData.address || '',
      applicationNumber: appNo,
      panNumber: formData.panNumber || 'Pending',
      applicationType: (formData.applicationType as PANApplicationType) || 'New PAN Card',
      currentStatus: (formData.currentStatus as PANStatus) || 'Pending',
      date: formData.date || new Date().toISOString().split('T')[0],
      operatorName: formData.operatorName || operatorName,
      remarks: formData.remarks || '',
      timeline: formData.timeline || [
        { step: 'Application Submitted', date: formData.date || new Date().toISOString().split('T')[0], completed: true, note: 'Submitted via CSC Portal' },
        { step: 'Document Verification', date: formData.date || new Date().toISOString().split('T')[0], completed: true, note: 'Biometric / OTP e-KYC' },
        { step: 'Sent to NSDL / UTI', date: '', completed: false, note: 'In Progress' },
        { step: 'PAN Number Allocated', date: '', completed: false, note: 'Awaiting' },
        { step: 'Card Printed & Dispatched', date: '', completed: false, note: 'Awaiting' }
      ],
      createdAt: formData.createdAt || new Date().toISOString(),
    };

    onSave(panToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 border border-amber-200/80 text-amber-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {initialData ? 'Edit PAN Card Application' : '+ New PAN Card Application'}
              </h3>
              <p className="text-xs text-slate-500">New PAN, Correction or Reprint request entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Application Type *</label>
              <select
                value={formData.applicationType || 'New PAN Card'}
                onChange={(e) => setFormData({ ...formData, applicationType: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="New PAN Card">New PAN Card</option>
                <option value="PAN Correction">PAN Correction</option>
                <option value="PAN Reprint">PAN Reprint</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Application No</label>
              <input
                type="text"
                value={formData.applicationNumber || ''}
                onChange={(e) => setFormData({ ...formData, applicationNumber: e.target.value })}
                placeholder="e.g. N2026100234"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Applicant Name *</label>
              <input
                type="text"
                required
                value={formData.applicantName || ''}
                onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                placeholder="e.g. Anil Kumar"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Father Name *</label>
              <input
                type="text"
                required
                value={formData.fatherName || ''}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                placeholder="e.g. Ram Avtar"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth (DOB) *</label>
              <input
                type="date"
                required
                value={formData.dob || ''}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                value={formData.mobile || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="10 digit mobile number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email ID</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="To receive e-PAN"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number (If available)</label>
              <input
                type="text"
                value={formData.panNumber || ''}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. CYPYA1234K (or leave Pending)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Status</label>
              <select
                value={formData.currentStatus || 'Pending'}
                onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="Pending">Pending</option>
                <option value="Under Verification">Under Verification</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operator Name</label>
              <input
                type="text"
                value={formData.operatorName || operatorName}
                onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="House No, Street, Post, Tehsil, District"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Enter remarks..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Application</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
