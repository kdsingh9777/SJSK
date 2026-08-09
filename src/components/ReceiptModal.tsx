import React, { useRef, useState, useMemo } from 'react';
import { Printer, Share2, Building2, X, CheckCircle, Edit2, Save, FileCheck, Tag } from 'lucide-react';
import { ServiceTransaction, CSCConfig, ReceiptData } from '../types';

interface ReceiptModalProps {
  receipt?: ReceiptData | ServiceTransaction | null;
  transaction?: ServiceTransaction | null; // Backwards compatibility
  config: CSCConfig;
  onSaveConfig?: (updatedConfig: CSCConfig) => void;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  transaction,
  config,
  onSaveConfig,
  onClose
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Normalize input (accepts either receipt prop or transaction prop)
  const inputData = receipt || transaction;

  const initialReceiptData: ReceiptData | null = useMemo(() => {
    if (!inputData) return null;
    if ('serviceName' in inputData && 'receiptNo' in inputData && !('serviceCategory' in inputData)) {
      const tx = inputData as ServiceTransaction;
      return {
        receiptNo: tx.receiptNo,
        date: tx.orderDate,
        customerName: tx.customerName,
        customerMobile: tx.customerMobile,
        customerAadhaar: tx.customerAadhaar,
        serviceCategory: tx.category || 'General CSC Service',
        serviceName: tx.serviceName,
        fee: tx.fee,
        amountPaid: tx.amountPaid,
        balanceDue: tx.balanceDue,
        paymentStatus: tx.paymentStatus,
        notes: tx.notes,
        isDuplicate: true,
      };
    }
    return inputData as ReceiptData;
  }, [inputData]);

  const [isDuplicate, setIsDuplicate] = useState<boolean>(initialReceiptData?.isDuplicate ?? true);
  const [isEditingShop, setIsEditingShop] = useState<boolean>(false);

  // Shop Edit Local State
  const [centreName, setCentreName] = useState(config.centreName || '');
  const [address, setAddress] = useState(config.address || '');
  const [operatorName, setOperatorName] = useState(config.operatorName || '');
  const [vleId, setVleId] = useState(config.vleId || '');
  const [mobile, setMobile] = useState(config.mobile || '');

  if (!initialReceiptData) return null;

  const handleSaveShopDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CSCConfig = {
      ...config,
      centreName: centreName.trim(),
      address: address.trim(),
      operatorName: operatorName.trim(),
      vleId: vleId.trim(),
      mobile: mobile.trim(),
    };
    if (onSaveConfig) {
      onSaveConfig(updated);
    }
    setIsEditingShop(false);
  };

  const handlePrint = () => {
    const printElement = document.getElementById('printable-receipt');
    if (!printElement) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${isDuplicate ? 'Duplicate Receipt' : 'Receipt'} - ${initialReceiptData.receiptNo}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 15px;
                  background: #ffffff;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body class="bg-white text-slate-900 p-4 font-sans">
            <div style="max-width: 600px; margin: 0 auto;">
              ${printElement.outerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 400);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    } else {
      window.print();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*${config.centreName}* ${isDuplicate ? '(DUPLICATE RECEIPT)' : ''}\n` +
      `Address: ${config.address}\n` +
      `Receipt No: ${initialReceiptData.receiptNo}\n` +
      `Customer: ${initialReceiptData.customerName}\n` +
      `Service: ${initialReceiptData.serviceName}\n` +
      `Fee Amount: ₹${initialReceiptData.fee}\n` +
      `Paid Amount: ₹${initialReceiptData.amountPaid}\n` +
      `Balance Due: ₹${initialReceiptData.balanceDue}\n` +
      `Payment Status: ${initialReceiptData.paymentStatus}\n` +
      `Thank you! VLE: ${config.operatorName} (${config.mobile})`
    );
    const phone = initialReceiptData.customerMobile ? `91${initialReceiptData.customerMobile}` : '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
        {/* Modal Top Navigation */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isDuplicate ? 'Duplicate Customer Receipt' : 'Official Customer Receipt'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingShop(!isEditingShop)}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-300 transition"
              title="Edit Shop / Centre Name & Address"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{isEditingShop ? 'Cancel Edit' : 'Edit Shop Details'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg font-bold hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inline Shop Profile Form if editing */}
        {isEditingShop && (
          <form onSubmit={handleSaveShopDetails} className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 space-y-3 text-xs print:hidden">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Update Shop / CSC Centre Profile</span>
              </h4>
              <span className="text-[10px] text-amber-700">Appears on all printed receipts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-bold mb-0.5">Shop / Centre Name *</label>
                <input
                  type="text"
                  required
                  value={centreName}
                  onChange={(e) => setCentreName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-0.5">Centre Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-0.5">Operator (VLE) Name *</label>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-0.5">VLE ID / CSC ID</label>
                <input
                  type="text"
                  value={vleId}
                  onChange={(e) => setVleId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-0.5">Contact Mobile *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Shop Details</span>
              </button>
            </div>
          </form>
        )}

        {/* Duplicate Toggle Bar */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700">Receipt Print Format:</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
            <input
              type="checkbox"
              checked={isDuplicate}
              onChange={(e) => setIsDuplicate(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
            />
            <span className={isDuplicate ? 'text-amber-700 font-extrabold' : 'text-slate-600'}>
              Print as DUPLICATE RECEIPT
            </span>
          </label>
        </div>

        {/* Printable Receipt Card Body */}
        <div
          ref={receiptRef}
          className="p-6 border-2 border-slate-900 rounded-xl bg-white text-slate-900 space-y-4 print:border-none print:p-0 print:m-0 relative"
          id="printable-receipt"
        >
          {/* Duplicate Watermark / Header Badge if Duplicate */}
          {isDuplicate && (
            <div className="text-center py-1 bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs uppercase tracking-widest rounded-md mb-2">
              ★ DUPLICATE RECEIPT ★
            </div>
          )}

          {/* CSC Centre Branding Header */}
          <div className="text-center border-b-2 border-slate-800 pb-3 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="w-6 h-6 text-amber-600" />
              <h2 className="text-xl font-extrabold tracking-wide text-slate-900 uppercase">
                {config.centreName || 'Jan Seva Kendra'}
              </h2>
            </div>
            <p className="text-xs text-slate-700 font-medium">{config.address}</p>
            <p className="text-[11px] text-slate-500 font-mono">
              VLE Name: {config.operatorName} • VLE ID: {config.vleId} • Mobile: {config.mobile}
            </p>
          </div>

          {/* Receipt Info & Customer Details */}
          <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-200 pb-3">
            <div>
              <span className="text-slate-400 block font-medium text-[10px]">Receipt / Ref No.</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{initialReceiptData.receiptNo}</span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block font-medium text-[10px]">Date & Time</span>
              <span className="font-mono font-semibold text-slate-800">
                {initialReceiptData.date} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 mt-1">
              <div>
                <span className="text-slate-500 text-[10px] block">Customer / Applicant:</span>
                <p className="font-bold text-slate-900 text-xs">{initialReceiptData.customerName}</p>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">Contact Mobile:</span>
                <p className="font-semibold text-slate-800 text-xs">{initialReceiptData.customerMobile}</p>
              </div>

              {initialReceiptData.fatherName && (
                <div>
                  <span className="text-slate-500 text-[10px] block">Father / Guardian:</span>
                  <p className="font-semibold text-slate-800 text-xs">{initialReceiptData.fatherName}</p>
                </div>
              )}

              {initialReceiptData.customerAadhaar && (
                <div>
                  <span className="text-slate-500 text-[10px] block">Aadhaar Number:</span>
                  <p className="font-mono text-xs text-slate-700">
                    XXXX-XXXX-{initialReceiptData.customerAadhaar.slice(-4)}
                  </p>
                </div>
              )}

              {initialReceiptData.customerAddress && (
                <div className="col-span-2">
                  <span className="text-slate-500 text-[10px] block">Address:</span>
                  <p className="text-xs text-slate-700">{initialReceiptData.customerAddress}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service & Fee Breakdown */}
          <div className="space-y-2">
            <div className="bg-slate-100 p-2 border border-slate-300 rounded font-bold text-xs flex justify-between text-slate-800">
              <span>Service Description ({initialReceiptData.serviceCategory})</span>
              <span>Amount</span>
            </div>

            <div className="p-3 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{initialReceiptData.serviceName}</h4>
                  {initialReceiptData.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">Notes: {initialReceiptData.notes}</p>
                  )}
                </div>
                <span className="font-extrabold text-slate-900 text-sm">₹{initialReceiptData.fee}</span>
              </div>

              {/* Additional Key-Value Details */}
              {initialReceiptData.additionalDetails && initialReceiptData.additionalDetails.length > 0 && (
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  {initialReceiptData.additionalDetails.map((detail, idx) => (
                    <div key={idx} className="bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-slate-400 block font-medium text-[9px]">{detail.label}</span>
                      <span className="font-semibold text-slate-800">{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Fee Math */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between text-slate-700">
                <span>Total Service Fee:</span>
                <span>₹{initialReceiptData.fee}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span>₹{initialReceiptData.amountPaid}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1">
                <span>Balance Due:</span>
                <span>₹{initialReceiptData.balanceDue}</span>
              </div>
            </div>
          </div>

          {/* Status & Official Stamp */}
          <div className="flex items-end justify-between pt-4 border-t-2 border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-medium">Payment Status:</span>
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                    initialReceiptData.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}
                >
                  {initialReceiptData.paymentStatus === 'Paid' ? '✓ Paid in Full' : '✗ Unpaid / Partial'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                * Computer-generated receipt. Contact VLE for assistance.
              </p>
            </div>

            {/* Stamp / Signature Seal Box */}
            <div className="text-center space-y-1">
              <div className="w-28 h-16 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center p-1 bg-indigo-50/30">
                {isDuplicate ? (
                  <span className="text-[10px] text-amber-700 font-black uppercase tracking-wider">
                    [ DUPLICATE SEAL ]
                  </span>
                ) : (
                  <span className="text-[10px] text-indigo-500 font-bold uppercase italic">
                    [ Official Stamp ]
                  </span>
                )}
                <span className="text-[8px] text-slate-400 mt-0.5">CSC Digital Portal</span>
              </div>
              <p className="text-[10px] font-bold text-slate-700">{config.operatorName}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons BELOW the Bill */}
        <div className="pt-2 border-t border-slate-200 space-y-3 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print {isDuplicate ? 'Duplicate' : ''} Receipt</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Send on WhatsApp</span>
            </button>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Close Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
