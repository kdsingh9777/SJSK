import React, { useState } from 'react';
import { X, Save, GraduationCap } from 'lucide-react';
import { ScholarshipApplication, ScholarshipScheme, ScholarshipStatus } from '../../types';

interface ScholarshipApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: ScholarshipApplication) => void;
  initialData?: ScholarshipApplication | null;
}

export const ScholarshipApplicationModal: React.FC<ScholarshipApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<ScholarshipApplication>>(() => {
    if (initialData) return { ...initialData };
    return {
      studentName: '',
      fatherName: '',
      rollNo: '',
      category: 'OBC',
      mobile: '',
      email: '',
      aadhaar: '',
      institutionName: '',
      course: '',
      academicYear: '2025-26',
      scheme: 'Post-Matric Scholarship',
      amount: 10000,
      status: 'Pending',
      applicationDate: new Date().toISOString().split('T')[0],
      remarks: '',
      documents: [
        { id: 'doc-1', docName: 'Marksheet', isUploaded: true, uploadDate: new Date().toISOString().split('T')[0] },
        { id: 'doc-2', docName: 'Income Certificate', isUploaded: true, uploadDate: new Date().toISOString().split('T')[0] },
        { id: 'doc-3', docName: 'Caste Certificate', isUploaded: false },
        { id: 'doc-4', docName: 'Fee Receipt', isUploaded: true, uploadDate: new Date().toISOString().split('T')[0] },
        { id: 'doc-5', docName: 'Bank Passbook', isUploaded: true, uploadDate: new Date().toISOString().split('T')[0] },
      ]
    };
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.institutionName || !formData.rollNo) {
      alert('Please fill required fields (Student Name, Roll No, Institution)');
      return;
    }

    const applicationToSave: ScholarshipApplication = {
      id: formData.id || `sch-${Date.now()}`,
      applicationNo: formData.applicationNo || `SCH2026-${String(Date.now()).slice(-5)}`,
      studentName: formData.studentName || '',
      fatherName: formData.fatherName || '',
      rollNo: formData.rollNo || '',
      category: (formData.category as any) || 'General',
      mobile: formData.mobile || '',
      email: formData.email || '',
      aadhaar: formData.aadhaar || '',
      institutionName: formData.institutionName || '',
      course: formData.course || '',
      academicYear: formData.academicYear || '2025-26',
      scheme: (formData.scheme as ScholarshipScheme) || 'Post-Matric Scholarship',
      amount: Number(formData.amount) || 0,
      status: (formData.status as ScholarshipStatus) || 'Pending',
      applicationDate: formData.applicationDate || new Date().toISOString().split('T')[0],
      approvalDate: formData.status === 'Approved' ? new Date().toISOString().split('T')[0] : undefined,
      remarks: formData.remarks || '',
      documents: formData.documents || [],
      createdAt: formData.createdAt || new Date().toISOString(),
    };

    onSave(applicationToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200/80">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {initialData ? 'Edit Scholarship Application' : '+ New Scholarship Application'}
              </h3>
              <p className="text-xs text-slate-500">Student details & scholarship scheme entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                value={formData.studentName || ''}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Name *</label>
              <input
                type="text"
                required
                value={formData.fatherName || ''}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                placeholder="e.g. Robert Doe"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number *</label>
              <input
                type="text"
                required
                value={formData.rollNo || ''}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                placeholder="e.g. 2026-CS-042"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category || 'General'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="Minority">Minority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={formData.mobile || ''}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar Number</label>
              <input
                type="text"
                value={formData.aadhaar || ''}
                onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                placeholder="12-digit Aadhaar number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institution / College Name *</label>
              <input
                type="text"
                required
                value={formData.institutionName || ''}
                onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                placeholder="e.g. Government Polytechnic College"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Class</label>
              <input
                type="text"
                value={formData.course || ''}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="e.g. Diploma Computer Science (2nd Year)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scholarship Scheme</label>
              <select
                value={formData.scheme || 'Post-Matric Scholarship'}
                onChange={(e) => setFormData({ ...formData, scheme: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="Pre-Matric Scholarship">Pre-Matric Scholarship (Class 9-10)</option>
                <option value="Post-Matric Scholarship">Post-Matric Scholarship (Class 11-12 / Diploma)</option>
                <option value="Merit-cum-Means">Merit-cum-Means (Higher Education)</option>
                <option value="Higher Education">Higher Education Scholarship</option>
                <option value="National Scholarship Portal (NSP)">National Scholarship Portal (NSP)</option>
                <option value="State Scholarship Scheme">State Scholarship Scheme</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
              <select
                value={formData.academicYear || '2025-26'}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scholarship Amount (₹)</label>
              <input
                type="number"
                value={formData.amount || 0}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Status</label>
              <select
                value={formData.status || 'Pending'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Comments</label>
            <textarea
              rows={2}
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Enter any special remarks regarding the application..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
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
