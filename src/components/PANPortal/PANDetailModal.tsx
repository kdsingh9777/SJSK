import React from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CreditCard, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react';
import { PANApplication, ReceiptData } from '../../types';
import { printTableData } from '../../lib/excel';
import { createPANReceipt } from '../../lib/receiptHelper';

interface PANDetailModalProps {
  application: PANApplication | null;
  onClose: () => void;
  onViewReceipt?: (receipt: ReceiptData) => void;
  onUpdateStatus?: (id: string, newStatus: 'Pending' | 'Under Verification' | 'Completed' | 'Rejected', panNumber?: string) => void;
}

export const PANDetailModal: React.FC<PANDetailModalProps> = ({
  application,
  onClose,
  onViewReceipt,
  onUpdateStatus,
}) => {
  if (!application) return null;

  const handlePrintPANReceipt = () => {
    printTableData(
      `PAN Application Receipt - ${application.applicantName}`,
      `PAN Center Seva • Application Number: ${application.applicationNumber}`,
      ['Field', 'Information'],
      [
        ['Application Type', application.applicationType],
        ['Application Number', application.applicationNumber],
        ['Applicant Name', application.applicantName],
        ['Father Name', application.fatherName],
        ['Date of Birth (DOB)', application.dob],
        ['Mobile', application.mobile],
        ['Email', application.email || '-'],
        ['Address', application.address || '-'],
        ['PAN Number', application.panNumber || 'Pending'],
        ['Current Status', application.currentStatus],
        ['Application Date', application.date],
        ['Operator Name', application.operatorName],
        ['Remarks', application.remarks || '-'],
      ]
    );
  };

  const defaultTimeline = application.timeline || [
    { step: 'Application Submitted', date: application.date, completed: true, note: 'Submitted via CSC Portal' },
    { step: 'Document Verification', date: application.date, completed: true, note: 'Biometric e-KYC completed' },
    { step: 'Sent to NSDL / UTI', date: application.currentStatus === 'Completed' ? application.date : '', completed: application.currentStatus === 'Completed' || application.currentStatus === 'Under Verification' },
    { step: 'PAN Number Allocated', date: application.panNumber && application.panNumber !== 'Pending' ? application.date : '', completed: Boolean(application.panNumber && application.panNumber !== 'Pending') },
    { step: 'Card Printed & Dispatched', date: application.currentStatus === 'Completed' ? application.date : '', completed: application.currentStatus === 'Completed' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/80">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <span>{application.applicantName}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold">
                  {application.applicationNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {application.applicationType} • Date: {application.date}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onViewReceipt) {
                  onViewReceipt(createPANReceipt(application));
                } else {
                  handlePrintPANReceipt();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-sm"
              title="Print Customer Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Header Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            application.currentStatus === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            application.currentStatus === 'Rejected' ? 'bg-rose-50 border-rose-200 text-rose-800' :
            application.currentStatus === 'Under Verification' ? 'bg-sky-50 border-sky-200 text-sky-800' :
            'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider opacity-75">Application Status:</div>
              <div className="text-base font-bold flex items-center gap-2 mt-0.5">
                {application.currentStatus === 'Completed' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {application.currentStatus === 'Rejected' && <XCircle className="w-5 h-5 text-rose-600" />}
                {application.currentStatus === 'Under Verification' && <ShieldCheck className="w-5 h-5 text-sky-600" />}
                {application.currentStatus === 'Pending' && <Clock className="w-5 h-5 text-amber-600" />}
                <span>{application.currentStatus}</span>
              </div>
              <p className="text-xs mt-1">
                PAN Number: <span className="font-mono font-bold text-slate-900">{application.panNumber || 'Pending'}</span>
              </p>
            </div>

            {onUpdateStatus && (
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    const pan = prompt('Enter allocated PAN Number:', application.panNumber !== 'Pending' ? application.panNumber : 'CYPYA9988K');
                    if (pan) onUpdateStatus(application.id, 'Completed', pan);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition shadow-sm"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => onUpdateStatus(application.id, 'Under Verification')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold transition shadow-sm"
                >
                  Under Verification
                </button>
              </div>
            )}
          </div>

          {/* Applicant Info Grid */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Applicant Details</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Applicant Name:</span>
                <span className="font-bold text-slate-900">{application.applicantName}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Father Name:</span>
                <span className="font-bold text-slate-900">{application.fatherName}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Date of Birth:</span>
                <span className="font-bold text-slate-900">{application.dob}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Mobile:</span>
                <span className="font-bold text-slate-900">{application.mobile}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Email:</span>
                <span className="font-bold text-slate-900">{application.email || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Operator Name:</span>
                <span className="font-bold text-slate-900">{application.operatorName}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-xs">
              <span className="text-slate-500 block font-medium">Full Address:</span>
              <span className="text-slate-800 font-medium">{application.address || '-'}</span>
            </div>
          </div>

          {/* Status Timeline Section */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Status Timeline</span>
            </h4>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {defaultTimeline.map((step, idx) => (
                <div key={idx} className="relative flex items-start justify-between text-xs">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step.completed
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-400 border border-slate-300'
                    }`}
                  >
                    {step.completed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </div>
                  <div>
                    <div className={`font-bold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.step}
                    </div>
                    {step.note && <div className="text-[11px] text-slate-500 mt-0.5">{step.note}</div>}
                  </div>
                  {step.date && <div className="text-[10px] font-mono text-slate-500 font-medium">{step.date}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Remarks */}
          {application.remarks && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
              <span className="text-slate-500 font-bold block mb-1">Remarks:</span>
              <p className="text-slate-800">{application.remarks}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
