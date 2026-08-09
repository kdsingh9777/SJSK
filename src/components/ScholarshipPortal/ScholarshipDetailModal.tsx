import React from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  UserCheck, 
  Building2, 
  CreditCard,
  Upload,
  Calendar,
  Share2
} from 'lucide-react';
import { ScholarshipApplication, ReceiptData } from '../../types';
import { printTableData } from '../../lib/excel';
import { createScholarshipReceipt } from '../../lib/receiptHelper';

interface ScholarshipDetailModalProps {
  application: ScholarshipApplication | null;
  onClose: () => void;
  onViewReceipt?: (receipt: ReceiptData) => void;
  onUpdateStatus?: (id: string, newStatus: 'Pending' | 'Approved' | 'Rejected', remarks?: string) => void;
}

export const ScholarshipDetailModal: React.FC<ScholarshipDetailModalProps> = ({
  application,
  onClose,
  onViewReceipt,
  onUpdateStatus,
}) => {
  if (!application) return null;

  const handlePrintSingle = () => {
    printTableData(
      `Scholarship Application - ${application.studentName}`,
      `Institution: ${application.institutionName} | Application No: ${application.applicationNo}`,
      ['Field', 'Detail'],
      [
        ['Application No', application.applicationNo],
        ['Student Name', application.studentName],
        ['Father Name', application.fatherName],
        ['Roll No', application.rollNo],
        ['Category', application.category],
        ['Mobile', application.mobile],
        ['Aadhaar No', application.aadhaar],
        ['Institution Name', application.institutionName],
        ['Course', application.course],
        ['Academic Year', application.academicYear],
        ['Scholarship Scheme', application.scheme],
        ['Scholarship Amount', `₹${application.amount.toLocaleString('en-IN')}`],
        ['Current Status', application.status],
        ['Application Date', application.applicationDate],
        ['Remarks', application.remarks || '-'],
      ]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              application.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80' :
              application.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-200/80' :
              'bg-amber-50 text-amber-600 border-amber-200/80'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <span>{application.studentName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
                  {application.applicationNo}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {application.scheme} • Year: {application.academicYear}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onViewReceipt && (
              <button
                onClick={() => onViewReceipt(createScholarshipReceipt(application))}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-sm"
                title="Print Duplicate Customer Receipt"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            )}
            <button
              onClick={handlePrintSingle}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              title="Print Table Record"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Badge Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            application.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
            application.status === 'Rejected' ? 'bg-rose-50 border-rose-200 text-rose-900' :
            'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              {application.status === 'Approved' && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />}
              {application.status === 'Rejected' && <XCircle className="w-6 h-6 text-rose-600 shrink-0" />}
              {application.status === 'Pending' && <Clock className="w-6 h-6 text-amber-600 shrink-0" />}
              <div>
                <div className="font-bold text-sm">
                  Application Status: {application.status === 'Approved' ? 'Approved' : application.status === 'Rejected' ? 'Rejected' : 'Pending Approval'}
                </div>
                <div className="text-xs opacity-80">
                  Scholarship Amount: ₹{application.amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {onUpdateStatus && (
              <div className="flex items-center gap-1.5">
                {application.status !== 'Approved' && (
                  <button
                    onClick={() => onUpdateStatus(application.id, 'Approved')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition"
                  >
                    Approve
                  </button>
                )}
                {application.status !== 'Rejected' && (
                  <button
                    onClick={() => onUpdateStatus(application.id, 'Rejected')}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition"
                  >
                    Reject
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Student Info Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>Student Details</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Student Name:</span>
                <span className="font-semibold text-slate-900">{application.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Father Name:</span>
                <span className="font-semibold text-slate-900">{application.fatherName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Roll No:</span>
                <span className="font-semibold text-slate-900 font-mono">{application.rollNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Category:</span>
                <span className="font-semibold text-slate-900">{application.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mobile Number:</span>
                <span className="font-semibold text-slate-900">{application.mobile || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Aadhaar Number:</span>
                <span className="font-semibold text-slate-900 font-mono">{application.aadhaar || '-'}</span>
              </div>
            </div>
          </div>

          {/* Institution & Course Info */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Institution & Course Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Institution/College Name:</span>
                <span className="font-semibold text-slate-900">{application.institutionName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Course/Class:</span>
                <span className="font-semibold text-slate-900">{application.course}</span>
              </div>
            </div>
          </div>

          {/* Documents Uploaded Section */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Uploaded Documents</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {application.documents && application.documents.length > 0 ? (
                application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">{doc.docName}</div>
                        {doc.fileSize && <div className="text-[10px] text-slate-500">{doc.fileSize}</div>}
                      </div>
                    </div>
                    {doc.isUploaded ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                        Uploaded
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-semibold border border-rose-200">
                        Pending
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic text-xs col-span-2">No documents uploaded</p>
              )}
            </div>
          </div>

          {/* Remarks */}
          {application.remarks && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs">
              <span className="text-slate-500 font-bold block mb-1">Departmental Remarks:</span>
              <p className="text-slate-700">{application.remarks}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
