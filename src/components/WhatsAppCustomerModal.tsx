import React, { useState, useMemo, useEffect } from 'react';
import { MessageSquare, Search, Check, X, Send, Copy, Sparkles, User, FileText, CheckCircle2 } from 'lucide-react';
import { Customer, CertificateApplication, ServiceTransaction, PANApplication, ScholarshipApplication } from '../types';

interface WhatsAppCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  certificates?: CertificateApplication[];
  transactions?: ServiceTransaction[];
  panApplications?: PANApplication[];
  scholarships?: ScholarshipApplication[];
  centreName?: string;
}

const COMMON_SERVICES = [
  'आय प्रमाण पत्र (Income Certificate)',
  'जाति प्रमाण पत्र (Caste Certificate)',
  'निवास प्रमाण पत्र (Domicile Certificate)',
  'नया पैन कार्ड (New PAN Card)',
  'पैन कार्ड संशोधन (PAN Correction)',
  'आधार अपडेट / ई-केवाईसी (Aadhaar Update)',
  'छात्रवृत्ति आवेदन (Scholarship Form)',
  'पीएम किसान ई-केवाईसी (PM Kisan eKYC)',
  'आयुष्मान भारत कार्ड (Ayushman Card)',
  'राशन कार्ड (Ration Card)',
  'पासपोर्ट आवेदन (Passport Application)'
];

export const WhatsAppCustomerModal: React.FC<WhatsAppCustomerModalProps> = ({
  isOpen,
  onClose,
  customers,
  certificates = [],
  transactions = [],
  panApplications = [],
  scholarships = [],
  centreName = 'Shaurya Jan Seva Kendra',
}) => {
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [customService, setCustomService] = useState<string>('');
  const [editedMessage, setEditedMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.fatherName && c.fatherName.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Get available/completed services for the selected customer dynamically
  const customerDynamicServices = useMemo(() => {
    if (!selectedCustomer) return [];
    const servicesList: string[] = [];

    // Search certificates
    certificates
      .filter((cert) => cert.mobile === selectedCustomer.mobile || cert.applicantName.toLowerCase() === selectedCustomer.name.toLowerCase())
      .forEach((cert) => {
        if (!servicesList.includes(cert.certificateType)) {
          servicesList.push(cert.certificateType);
        }
      });

    // Search transactions
    transactions
      .filter((tx) => tx.customerMobile === selectedCustomer.mobile || tx.customerName.toLowerCase() === selectedCustomer.name.toLowerCase())
      .forEach((tx) => {
        if (!servicesList.includes(tx.serviceName)) {
          servicesList.push(tx.serviceName);
        }
      });

    // Search PAN
    panApplications
      .filter((p) => p.mobile === selectedCustomer.mobile || p.applicantName.toLowerCase() === selectedCustomer.name.toLowerCase())
      .forEach((p) => {
        const title = `PAN Card (${p.applicationType})`;
        if (!servicesList.includes(title)) {
          servicesList.push(title);
        }
      });

    // Search Scholarships
    scholarships
      .filter((s) => s.mobile === selectedCustomer.mobile || s.studentName.toLowerCase() === selectedCustomer.name.toLowerCase())
      .forEach((s) => {
        const title = `Scholarship (${s.scheme})`;
        if (!servicesList.includes(title)) {
          servicesList.push(title);
        }
      });

    return servicesList;
  }, [selectedCustomer, certificates, transactions, panApplications, scholarships]);

  // Combined services list
  const availableServices = useMemo(() => {
    const combined = [...customerDynamicServices];
    COMMON_SERVICES.forEach((s) => {
      if (!combined.includes(s)) combined.push(s);
    });
    return combined;
  }, [customerDynamicServices]);

  // Determine active service title
  const activeServiceName = useMemo(() => {
    if (selectedService === 'Custom') return customService.trim() || 'प्रमाण पत्र / सेवा';
    return selectedService || 'आय / जाति / निवास प्रमाण पत्र';
  }, [selectedService, customService]);

  // Auto-generate Hindi message when customer or service changes
  const generatedMessage = useMemo(() => {
    if (!selectedCustomer) return '';
    const name = selectedCustomer.name.trim();
    const service = activeServiceName;
    const center = centreName.trim() || 'Shaurya Jan Seva Kendra';

    return `नमस्ते ${name} जी,\n\nआपका ${service} तैयार हो चुका है।\n\nकृपया इसे प्राप्त करने के लिए ${center} पर संपर्क करें।\n\nधन्यवाद।\nRegards,\n${center}`;
  }, [selectedCustomer, activeServiceName, centreName]);

  // Update editedMessage when generatedMessage updates
  useEffect(() => {
    if (generatedMessage) {
      setEditedMessage(generatedMessage);
    }
  }, [generatedMessage]);

  if (!isOpen) return null;

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    // Pre-select first dynamic service if available, else first common
    const dynamic = customerDynamicServices[0];
    if (dynamic) {
      setSelectedService(dynamic);
    } else {
      setSelectedService('आय प्रमाण पत्र (Income Certificate)');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!selectedCustomer) return;
    const cleanMobile = selectedCustomer.mobile.replace(/\D/g, '');
    let formattedPhone = cleanMobile;
    if (cleanMobile.length === 10) {
      formattedPhone = `91${cleanMobile}`;
    }

    const encodedText = encodeURIComponent(editedMessage);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <span>WhatsApp Customer Message</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold uppercase">
                  Hindi Auto-Gen
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Send completion updates directly to customer's WhatsApp mobile number
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* STEP 1: SELECT CUSTOMER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                <span>Step 1: Select Customer from Saved Database</span>
              </label>

              {selectedCustomer && (
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Change Selected Customer
                </button>
              )}
            </div>

            {!selectedCustomer ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by customer name or mobile number..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* Customer List */}
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white shadow-xs">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No saved customers found matching search.
                    </div>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="p-3 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{cust.name}</div>
                            <div className="text-[10px] text-slate-500">
                              Mob: <span className="font-mono text-slate-700">{cust.mobile}</span>
                              {cust.fatherName && ` • S/o: ${cust.fatherName}`}
                            </div>
                          </div>
                        </div>

                        <button className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-xs">
                          Select
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Selected Customer Card */
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                      <span>{selectedCustomer.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                        Selected Customer
                      </span>
                    </div>
                    <div className="text-xs text-emerald-800">
                      Mobile: <strong className="font-mono">{selectedCustomer.mobile}</strong>
                      {selectedCustomer.fatherName && ` • Father: ${selectedCustomer.fatherName}`}
                    </div>
                  </div>
                </div>

                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              </div>
            )}
          </div>

          {/* STEP 2: CHOOSE SERVICE / CERTIFICATE */}
          {selectedCustomer && (
            <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                <span>Step 2: Select Completed Service / Certificate</span>
              </label>

              {/* Dynamic Customer Services Badges if any */}
              {customerDynamicServices.length > 0 && (
                <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>Existing Work Records Found for {selectedCustomer.name}:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {customerDynamicServices.map((serviceTitle) => (
                      <button
                        key={serviceTitle}
                        onClick={() => setSelectedService(serviceTitle)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          selectedService === serviceTitle
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        ✓ {serviceTitle}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dropdown / List of Services */}
              <div className="space-y-2">
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>-- Select Service / Certificate --</option>
                  {availableServices.map((serviceTitle) => (
                    <option key={serviceTitle} value={serviceTitle}>
                      {serviceTitle}
                    </option>
                  ))}
                  <option value="Custom">Other Custom Service Name...</option>
                </select>

                {selectedService === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom service / certificate name..."
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 3: AUTO-GENERATED HINDI WHATSAPP MESSAGE */}
          {selectedCustomer && selectedService && (
            <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  <span>Step 3: Auto-Generated Hindi WhatsApp Message</span>
                </label>

                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={7}
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  className="w-full p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs font-medium text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Note: You can edit or customize the text above before sending.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            onClick={handleOpenWhatsApp}
            disabled={!selectedCustomer || !selectedService}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Open WhatsApp & Send Message</span>
          </button>
        </div>
      </div>
    </div>
  );
};
