export interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  profession: string;
  professionName: string;
  clientLabel: string;
  clientLabelPlural: string;
  sessionLabel: string;
  currency: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  slotMinutes: number;
  plan: 'TRIAL' | 'ACTIVE' | 'SOLO' | 'PRACTICE' | 'EXPIRED';
  trialEndsAt: string | null;
  trialDaysLeft: number;
  subscriptionEndsAt: string | null;
  expired: boolean;
  /** Days left in the trial or the paid period. */
  daysLeft: number;
  /** Profession pack modules switched on: PRESCRIPTIONS, PACKAGES, CASES, DEADLINES. */
  modules: PackModule[];
  practitionerTitle: string | null;
  registrationNumber: string | null;
}

export type PackModule = 'PRESCRIPTIONS' | 'PACKAGES' | 'CASES' | 'DEADLINES';

export interface RxItem {
  medicine: string;
  dose: string | null;
  frequency: string | null;
  timing: string | null;
  duration: string | null;
  notes: string | null;
}

export interface Prescription {
  id: number;
  clientId: number;
  clientName: string;
  appointmentId: number | null;
  vitals: string | null;
  complaints: string | null;
  diagnosis: string | null;
  advice: string | null;
  tests: string | null;
  followUpDate: string | null;
  items: RxItem[];
  authorName: string | null;
  createdAt: string;
}

export interface PrescriptionRequest {
  clientId: number;
  appointmentId: number | null;
  vitals: string;
  complaints: string;
  diagnosis: string;
  advice: string;
  tests: string;
  followUpDate: string | null;
  items: RxItem[];
}

export interface PackageTemplate {
  id: number;
  name: string;
  sessions: number;
  price: number;
  validityDays: number | null;
  serviceId: number | null;
  serviceName: string | null;
}

export interface ClientPackage {
  id: number;
  name: string;
  totalSessions: number;
  usedSessions: number;
  price: number;
  purchasedOn: string;
  expiresOn: string | null;
  status: 'ACTIVE' | 'USED_UP' | 'EXPIRED';
  serviceName: string | null;
  invoiceId: number | null;
}

export interface Hearing {
  id: number;
  caseId: number;
  caseTitle: string;
  caseNumber: string | null;
  court: string | null;
  clientId: number;
  clientName: string;
  hearingDate: string;
  purpose: string | null;
  outcome: string | null;
}

export interface LegalCase {
  id: number;
  clientId: number;
  clientName: string;
  title: string;
  caseNumber: string | null;
  court: string | null;
  oppositeParty: string | null;
  caseType: string | null;
  status: 'OPEN' | 'CLOSED';
  notes: string | null;
  nextHearing: string | null;
  lastHearing: string | null;
  hearingCount: number;
  hearings: Hearing[];
  createdAt: string;
}

export type DeadlineCategory = 'GST' | 'TDS' | 'ITR' | 'ADVANCE_TAX' | 'ROC' | 'AUDIT' | 'OTHER';
export type Recurrence = 'NONE' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface Deadline {
  id: number;
  clientId: number;
  clientName: string;
  title: string;
  category: DeadlineCategory;
  period: string | null;
  dueDate: string;
  status: 'PENDING' | 'DONE';
  doneOn: string | null;
  recurrence: Recurrence;
  notes: string | null;
  overdue: boolean;
}

/** A subscription plan; prices come from the database, always in INR (paise). */
export interface PricePlan {
  code: string;
  name: string;
  description: string | null;
  amountPaise: number;
  durationDays: number;
  intervalLabel: string;
  badge: string | null;
  features: string[];
  highlighted: boolean;
  /** What the customer pays. Equals amountPaise when prices include GST. */
  totalPaise: number;
  taxIncluded: boolean;
  gstRate: number;
}

export interface BillingDetails {
  name: string;
  address: string;
  stateCode: string;
  gstin: string;
}

export interface GstState { code: string; name: string; }

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string | null;
  jurisdictionCity: string | null;
  grievanceOfficer: string | null;
}

export interface InvoiceParty {
  name: string | null;
  address: string | null;
  gstin: string | null;
  stateCode: string | null;
  stateName: string;
}

export interface TaxInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  gstRegistered: boolean;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  placeOfSupply: string;
  sac: string | null;
  description: string;
  periodStart: string | null;
  periodEnd: string | null;
  taxablePaise: number;
  gstRate: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
  razorpayPaymentId: string | null;
  paymentMethod: string;
}

export interface Checkout {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  businessName: string;
  description: string;
  prefillName: string;
  prefillEmail: string;
  prefillContact: string;
}

export interface PaymentRecord {
  id: number;
  planName: string;
  amountPaise: number;
  status: string;
  razorpayPaymentId: string | null;
  createdAt: string;
  paidAt: string | null;
  periodEnd: string | null;
  invoiceNumber: string | null;
}

/** Signup result: no session yet, the email must be confirmed first. */
export interface RegisterResponse {
  verificationRequired: boolean;
  email: string;
  pendingToken: string;
  emailSent: boolean;
}

export interface Session {
  token: string;
  user: User;
  workspace: Workspace;
}

export interface Profession {
  code: string;
  name: string;
  clientLabel: string;
  clientLabelPlural: string;
  sessionLabel: string;
  sampleServices: string[];
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  workspaceName: string;
  profession: string;
  currency: string;
  timezone: string;
  sampleData: boolean;
  website: string;
}

export interface ServiceOffering {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  color: string;
  bookableOnline: boolean;
}

export type ServiceRequest = Omit<ServiceOffering, 'id'>;

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string | null;
  serviceId: number | null;
  serviceName: string;
  color: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  source: 'MANUAL' | 'ONLINE';
  price: number | null;
  notes: string | null;
  invoiced: boolean;
  packageName: string | null;
  packageUsed: number;
  packageTotal: number;
}

export interface AppointmentRequest {
  clientId: number | null;
  newClient: { fullName: string; phone: string; email: string } | null;
  serviceId: number | null;
  startAt: string;
  durationMinutes: number;
  price: number | null;
  notes: string;
  force: boolean;
}

export interface ClientSummary {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  tags: string | null;
  visits: number;
  lastVisit: string | null;
  nextVisit: string | null;
  createdAt: string;
}

export interface ClientRequest {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  tags: string;
}

export interface Note {
  id: number;
  body: string;
  authorName: string | null;
  createdAt: string;
  /** The visit this note was written for; null for a general note. */
  appointmentId: number | null;
}

/** A prescription, report, scan, contract, worksheet or photo on someone's record. */
export interface ClientDocument {
  id: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  appointmentId: number | null;
  uploadedBy: string | null;
  createdAt: string;
}

export interface PreviousVisit {
  appointment: Appointment;
  notes: Note[];
  documents: ClientDocument[];
  prescriptions: Prescription[];
}

export interface VisitRecord {
  appointmentId: number;
  visitNumber: number;
  notes: Note[];
  documents: ClientDocument[];
  previous: PreviousVisit | null;
  prescriptions: Prescription[];
}

export interface ClientDetail {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  tags: string | null;
  createdAt: string;
  totalPaid: number;
  visits: number;
  notes: Note[];
  documents: ClientDocument[];
  appointments: Appointment[];
  invoices: InvoiceSummary[];
  prescriptions: Prescription[];
  packages: ClientPackage[];
  cases: LegalCase[];
  deadlines: Deadline[];
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'VOID';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceSummary {
  id: number;
  number: string;
  clientId: number;
  clientName: string;
  issueDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  total: number;
  overdue: boolean;
}

export interface Party {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface InvoiceDetail {
  id: number;
  number: string;
  client: Party;
  practice: Party;
  currency: string;
  appointmentId: number | null;
  issueDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidDate: string | null;
  notes: string | null;
  overdue: boolean;
}

export interface InvoiceRequest {
  clientId: number;
  appointmentId: number | null;
  issueDate: string;
  dueDate: string | null;
  taxRate: number;
  items: InvoiceItem[];
  notes: string;
  status: InvoiceStatus;
}

export interface DashboardStats {
  todayCount: number;
  weekCount: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  outstanding: number;
  overdue: number;
  activeClients: number;
  newClientsThisMonth: number;
  noShowRate: number;
}

export interface MonthRevenue {
  label: string;
  year: number;
  amount: number;
}

export interface Dashboard {
  today: Appointment[];
  upcoming: Appointment[];
  stats: DashboardStats;
  revenue: MonthRevenue[];
  statusBreakdown: Record<AppointmentStatus, number>;
  pack: { upcomingHearings: Hearing[]; dueDeadlines: Deadline[] };
}

export interface WorkingHours {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface WorkspaceUpdate {
  name: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  timezone: string;
  clientLabel: string;
  clientLabelPlural: string;
  sessionLabel: string;
  slotMinutes: number;
  practitionerTitle: string;
  registrationNumber: string;
}

export interface PublicPractice {
  name: string;
  slug: string;
  professionName: string;
  clientLabel: string;
  sessionLabel: string;
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  services: ServiceOffering[];
  openDays: number[];
  today: string;
}

export interface BookingRequest {
  serviceId: number;
  date: string;
  time: string;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
  website: string;
}

export interface BookingConfirmation {
  id: number;
  practiceName: string;
  serviceName: string;
  startAt: string;
  endAt: string;
  clientName: string;
}
