import { CertificateApplication, ScholarshipApplication, PANApplication, ServiceTransaction, ReceiptData } from '../types';

export function createCertificateReceipt(cert: CertificateApplication): ReceiptData {
  return {
    receiptNo: cert.applicationNo || cert.id,
    date: cert.applicationDate || cert.createdAt,
    customerName: cert.applicantName,
    customerMobile: cert.mobile,
    customerAadhaar: cert.aadhaar,
    customerAddress: cert.address,
    fatherName: cert.fatherName,
    serviceCategory: 'Certificate Services',
    serviceName: cert.certificateType,
    additionalDetails: [
      { label: 'Application No', value: cert.applicationNo },
      { label: 'Delivery Status', value: cert.deliveryStatus },
      { label: 'Target Delivery', value: cert.targetDeliveryDate || '3 Working Days' }
    ],
    fee: cert.fee || 150,
    amountPaid: cert.paymentStatus === 'Paid' ? (cert.fee || 150) : 0,
    balanceDue: cert.paymentStatus === 'Paid' ? 0 : (cert.fee || 150),
    paymentStatus: cert.paymentStatus,
    notes: cert.notes,
    isDuplicate: true,
  };
}

export function createScholarshipReceipt(sch: ScholarshipApplication): ReceiptData {
  return {
    receiptNo: sch.applicationNo || sch.id,
    date: sch.applicationDate || sch.createdAt,
    customerName: sch.studentName,
    customerMobile: sch.mobile,
    customerAadhaar: sch.aadhaar,
    fatherName: sch.fatherName,
    serviceCategory: 'Scholarship Portal',
    serviceName: `${sch.scheme} (${sch.course})`,
    additionalDetails: [
      { label: 'Roll / Reg No', value: sch.rollNo || 'N/A' },
      { label: 'Category', value: sch.category || 'N/A' },
      { label: 'Institution', value: sch.institutionName || 'N/A' },
      { label: 'Academic Year', value: sch.academicYear || 'N/A' },
      { label: 'Approved Amount', value: sch.amount ? `₹${sch.amount.toLocaleString('en-IN')}` : 'Pending' }
    ],
    fee: 100,
    amountPaid: 100,
    balanceDue: 0,
    paymentStatus: 'Paid',
    notes: `Scholarship Application Status: ${sch.status}`,
    isDuplicate: true,
  };
}

export function createPANReceipt(pan: PANApplication): ReceiptData {
  return {
    receiptNo: pan.applicationNumber || pan.id,
    date: pan.date || pan.createdAt,
    customerName: pan.applicantName,
    customerMobile: pan.mobile,
    customerAddress: pan.address,
    fatherName: pan.fatherName,
    serviceCategory: 'PAN Center Portal',
    serviceName: `${pan.applicationType} - ${pan.panNumber !== 'Pending' ? pan.panNumber : 'New Application'}`,
    additionalDetails: [
      { label: 'Application No', value: pan.applicationNumber },
      { label: 'PAN Number', value: pan.panNumber || 'Pending' },
      { label: 'DOB', value: pan.dob },
      { label: 'Current Status', value: pan.currentStatus }
    ],
    fee: 120,
    amountPaid: 120,
    balanceDue: 0,
    paymentStatus: 'Paid',
    notes: pan.remarks || 'PAN Application Filed Successfully',
    isDuplicate: true,
  };
}

export function createTransactionReceipt(tx: ServiceTransaction): ReceiptData {
  return {
    receiptNo: tx.receiptNo,
    date: tx.orderDate,
    customerName: tx.customerName,
    customerMobile: tx.customerMobile,
    customerAadhaar: tx.customerAadhaar,
    serviceCategory: tx.category || 'General Service',
    serviceName: tx.serviceName,
    fee: tx.fee,
    amountPaid: tx.amountPaid,
    balanceDue: tx.balanceDue,
    paymentStatus: tx.paymentStatus,
    notes: tx.notes,
    isDuplicate: true,
  };
}
