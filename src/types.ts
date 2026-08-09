export interface ImportantLink {
  id: string;
  title: string;
  url: string;
  category: 'CSC Portal' | 'Certificates' | 'PAN & Aadhaar' | 'Scholarship' | 'Govt Portal' | 'Utility Services' | 'Custom';
  description: string;
  badgeText?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';
export type WorkStatus = 'Pending' | 'In Progress' | 'Completed' | 'Delivered';
export type CertificateType = 'Income Certificate' | 'Caste Certificate' | 'Domicile Certificate' | 'Disability Certificate' | 'Encumbrance Certificate' | 'Other';

export interface CustomerDocument {
  id: string;
  name: string;
  type: 'Aadhaar' | 'PAN' | 'Photo' | 'Marksheet' | 'RationCard' | 'Other';
  fileData: string; // Base64 data or mock URL
  fileName: string;
  fileSize?: string;
  uploadDate: string;
  isLocked: boolean;
}

export interface Customer {
  id: string;
  name: string;
  fatherName?: string;
  mobile: string;
  aadhaar: string; // 12 digit Aadhaar
  address: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  documents: CustomerDocument[];
  notes?: string;
}

export interface ServiceTransaction {
  id: string;
  receiptNo: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAadhaar?: string;
  serviceName: string;
  category?: string;
  fee: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  workStatus: WorkStatus;
  orderDate: string; // ISO date YYYY-MM-DD
  deliveryDate: string; // ISO date YYYY-MM-DD
  notes?: string;
  createdAt: string;
  isSync: boolean;
}

export interface CertificateApplication {
  id: string;
  applicationNo: string; // e.g. 240010010101
  customerId?: string;
  applicantName: string;
  fatherName: string;
  address: string;
  mobile: string;
  aadhaar?: string;
  certificateType: CertificateType;
  paymentStatus: 'Paid' | 'Unpaid';
  deliveryStatus: 'Delivered' | 'Not Delivered';
  fee: number;
  applicationDate: string;
  targetDeliveryDate: string;
  notes?: string;
  incomeAmount?: number;
  casteCategory?: string;
  subCaste?: string;
  residingYears?: number;
  createdAt: string;
}

// ================= SCHOLARSHIP PORTAL TYPES =================
export type ScholarshipStatus = 'Pending' | 'Approved' | 'Rejected';
export type ScholarshipScheme = 
  | 'Pre-Matric Scholarship'
  | 'Post-Matric Scholarship'
  | 'Merit-cum-Means'
  | 'Higher Education'
  | 'National Scholarship Portal (NSP)'
  | 'State Scholarship Scheme';

export interface ScholarshipDocumentItem {
  id: string;
  docName: string;
  isUploaded: boolean;
  uploadDate?: string;
  fileSize?: string;
}

export interface ScholarshipApplication {
  id: string;
  applicationNo: string;
  studentName: string;
  fatherName: string;
  rollNo: string;
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'Minority';
  mobile: string;
  email?: string;
  aadhaar: string;
  institutionName: string;
  course: string;
  academicYear: string; // e.g. '2025-26', '2024-25'
  scheme: ScholarshipScheme;
  amount: number;
  status: ScholarshipStatus;
  applicationDate: string;
  approvalDate?: string;
  remarks?: string;
  documents: ScholarshipDocumentItem[];
  createdAt: string;
}

export interface ScholarshipActivity {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

// ================= PAN CENTER PORTAL TYPES =================
export type PANApplicationType = 'New PAN Card' | 'PAN Correction' | 'PAN Reprint';
export type PANStatus = 'Pending' | 'Under Verification' | 'Completed' | 'Rejected';

export interface PANTimelineStep {
  step: string;
  date: string;
  completed: boolean;
  note?: string;
}

export interface PANApplication {
  id: string;
  applicantName: string;
  fatherName: string;
  dob: string;
  mobile: string;
  email: string;
  address: string;
  applicationNumber: string; // e.g. N2026100234
  panNumber: string; // e.g. ABCDE1234F or 'Pending'
  applicationType: PANApplicationType;
  currentStatus: PANStatus;
  date: string;
  operatorName: string;
  remarks: string;
  timeline?: PANTimelineStep[];
  createdAt: string;
}

// ================= EXCEL IMPORT SYSTEM TYPES =================
export interface ExcelImportReport {
  totalRows: number;
  successfulRows: number;
  rejectedRows: Array<{
    rowNumber: number;
    data: Record<string, any>;
    reason: string;
  }>;
  detectedColumns: string[];
  importedAt: string;
}

export interface ReceiptData {
  receiptNo: string;
  date: string;
  customerName: string;
  customerMobile: string;
  customerAadhaar?: string;
  customerAddress?: string;
  fatherName?: string;
  serviceCategory: string;
  serviceName: string;
  additionalDetails?: { label: string; value: string }[];
  fee: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  notes?: string;
  isDuplicate?: boolean;
}

export interface CSCConfig {
  centreName: string;
  operatorName: string;
  vleId: string;
  address: string;
  mobile: string;
  email: string;
  adminPin: string;
  autoCloudBackup: boolean;
}

export interface CloudBackupPayload {
  lastUpdated: string;
  cscConfig: CSCConfig;
  customers: Customer[];
  transactions: ServiceTransaction[];
  certificates: CertificateApplication[];
  scholarships?: ScholarshipApplication[];
  panApplications?: PANApplication[];
  importantLinks?: ImportantLink[];
}

