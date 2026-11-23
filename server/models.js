const mongoose = require('mongoose');

// SaaS Pricing Plans Definition
const PLANS = {
  starter: {
    code: 'starter',
    nameAr: 'باقة البداية (Starter)',
    priceMonthly: 1000,
    priceYearly: 10000,
    maxEmployees: 15,
    maxBranches: 1,
    description: 'مثالية للعيادات، الصيدليات، والمكاتب الصغيرة (حتى 15 موظف وفرع واحد)'
  },
  growth: {
    code: 'growth',
    nameAr: 'باقة النمو (Growth)',
    priceMonthly: 3000,
    priceYearly: 30000,
    maxEmployees: 50,
    maxBranches: 3,
    description: 'مثالية للشركات المتوسطة، سلاسل المطاعم، والمتاجر (حتى 50 موظف و3 فروع)'
  },
  enterprise: {
    code: 'enterprise',
    nameAr: 'باقة المؤسسات (Enterprise)',
    priceMonthly: 5000,
    priceYearly: 50000,
    maxEmployees: 120,
    maxBranches: 999,
    description: 'مثالية للمصانع وسلاسل المحلات الكبيرة (حتى 120 موظف وفروع غير محدودة)'
  }
};

// 0. Tenant Schema (Multi-Tenancy & SaaS Subscription)
const TenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  timezone: { type: String, default: 'Africa/Cairo' },
  plan: { 
    type: String, 
    enum: ['trial', 'starter', 'growth', 'enterprise'], 
    default: 'trial' 
  },
  status: { 
    type: String, 
    enum: ['trial', 'active', 'past_due', 'suspended', 'cancelled'], 
    default: 'trial',
    index: true 
  },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }, // 14 days free trial
  subscriptionEndsAt: { type: Date, default: null },
  maxEmployees: { type: Number, default: 15 },
  maxBranches: { type: Number, default: 1 },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  contactPhone: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  adminName: { type: String, default: '' },
  notes: { type: String, default: '' },
  branding: {
    companyName: { type: String, default: 'اسم الشركة' },
    logoUrl: { type: String, default: '/brand/logo.svg' },
    primaryColor: { type: String, default: '#F5B800' }
  },
  createdAt: { type: Date, default: Date.now }
});

// 1. Branch Schema
const BranchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, default: 'default', index: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radiusMeters: { type: Number, default: 100 },
  sectorId: { type: String, default: 'sector_main' },
  sectorName: { type: String, default: 'القطاع الرئيسي' },
  isArchived: { type: Boolean, default: false }
});
BranchSchema.index({ tenantId: 1, code: 1 });

// 2. Title & Permissions Schema
const TitleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, default: 'default', index: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  nameAr: { type: String, default: '' },
  nameEn: { type: String, default: '' },
  englishTitle: { type: String, default: '' },
  arabicTitle: { type: String, default: '' },
  description: { type: String, default: '' },
  level: { type: Number, default: 4 },
  order: { type: Number, default: 4 },
  color: { type: String, default: 'zinc' },
  isSystemAdmin: { type: Boolean, default: false },
  permissions: {
    check_in_out: { type: Boolean, default: true },
    view_own_attendance: { type: Boolean, default: true },
    view_office_presence: { type: Boolean, default: true },
    request_leave: { type: Boolean, default: true },
    request_permission: { type: Boolean, default: true },
    approve_leaves_permissions: { type: Boolean, default: false },
    approve_early_checkout: { type: Boolean, default: false },
    manage_employees: { type: Boolean, default: false },
    manage_titles_permissions: { type: Boolean, default: false },
    manage_office_settings: { type: Boolean, default: false },
    view_reports: { type: Boolean, default: false },
    view_all_branches: { type: Boolean, default: false },
    override_early_checkout: { type: Boolean, default: false },
    edit_employee_details: { type: Boolean, default: false }
  }
});
TitleSchema.index({ tenantId: 1, code: 1 });

// 3. Employee Schema
const EmployeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, default: 'default', index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  sapNumber: { type: String, trim: true, default: '', index: true },
  password: { type: String, required: true },
  pin: { type: String, default: '' },
  titleCode: { type: String, required: true, default: 'employee' },
  jobTitle: { type: String, default: 'موظف (Employee)' },
  branchId: { type: String, required: true, default: 'branch_main' },
  sectorId: { type: String, default: 'sector_main' },
  sectorName: { type: String, default: 'القطاع الرئيسي' },
  weeklyOffDays: { type: [String], default: ['friday', 'saturday'] },
  weeklyOffDaysLocked: { type: Boolean, default: false },
  avatar: { type: String, default: '' },
  leaveBalance: { type: Number, default: 21 },
  permissionsBalanceHours: { type: Number, default: 2 },
  boundDeviceId: { type: String, default: null },
  deviceInfo: { type: String, default: null },
  deviceBoundAt: { type: String, default: null },
  isSuperAdmin: { type: Boolean, default: false },
  isGhost: { type: Boolean, default: false },
  passkeys: { type: Array, default: [] },
  createdAt: { type: String, default: () => new Date().toISOString() }
});
EmployeeSchema.index({ tenantId: 1, branchId: 1 });
EmployeeSchema.index({ tenantId: 1, phone: 1 });

// 4. Attendance Record Schema
const AttendanceRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, default: 'default', index: true },
  employeeId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  branchId: { type: String, required: true },
  date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
  workDate: { type: String, index: true }, // Normalized YYYY-MM-DD
  checkInTime: { type: String, required: true },
  checkOutTime: { type: String, default: null },
  status: { type: String, default: 'in_office' }, // 'in_office' | 'checked_out'
  latitude: { type: Number },
  longitude: { type: Number },
  distanceMeters: { type: Number, default: 0 },
  accuracyMeters: { type: Number, default: 0 },
  checkOutLatitude: { type: Number },
  checkOutLongitude: { type: Number },
  checkOutDistanceMeters: { type: Number, default: 0 },
  checkOutAccuracyMeters: { type: Number, default: 0 },
  durationMinutes: { type: Number, default: 0 },
  completed8Hours: { type: Boolean, default: false },
  autoCheckedOut: { type: Boolean, default: false },
  checkOutNotes: { type: String, default: '' }
});
AttendanceRecordSchema.index({ tenantId: 1, employeeId: 1, workDate: 1 }, { unique: true });
AttendanceRecordSchema.index({ tenantId: 1, workDate: -1, branchId: 1 });
AttendanceRecordSchema.index({ tenantId: 1, branchId: 1, status: 1 });

// 5. Leave & Permission Request Schema
const RequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, default: 'default', index: true },
  employeeId: { type: String, required: true, index: true },
  branchId: { type: String, default: null },
  type: { type: String, required: true, enum: ['leave', 'permission', 'early_checkout'] },
  leaveType: { 
    type: String, 
    enum: [
      'sick', 
      'annual', 
      'casual', 
      'work_mission', 
      'weekly_rest_compensation', 
      'holiday_compensation', 
      'travel', 
      'weekly_off', 
      'other'
    ], 
    default: 'annual' 
  },
  startDate: { type: String },
  endDate: { type: String },
  date: { type: String },
  permissionType: { type: String, enum: ['morning', 'evening', 'midday'], default: 'morning' },
  permissionHours: { type: Number, default: 2 },
  startTime: { type: String, default: '09:00' },
  endTime: { type: String, default: '11:00' },
  reason: { type: String, required: true },
  attachmentName: { type: String, default: null },
  attachmentData: { type: String, default: null },
  missionBranchId: { type: String, default: null },
  missionBranchName: { type: String, default: null },
  missionDate: { type: String, default: null },
  compensationOffDate: { type: String, default: null },
  compensationWorkedDate: { type: String, default: null },
  holidayName: { type: String, default: null },
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  requestedAt: { type: String, default: () => new Date().toISOString() },
  reviewedBy: { type: String, default: null },
  reviewedAt: { type: String, default: null },
  reviewNote: { type: String, default: null }
});
RequestSchema.index({ tenantId: 1, branchId: 1, status: 1, createdAt: -1 });

// 6. Office Settings Schema
const OfficeSettingsSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, default: 'default', index: true },
  companyName: { type: String, default: 'اسم الشركة' },
  shiftHours: { type: Number, default: 8 },
  graceMinutes: { type: Number, default: 15 },
  workStartTime: { type: String, default: '09:00' },
  workEndTime: { type: String, default: '17:00' }
});

// 7. Push Notification Subscription Schema
const PushSubscriptionSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, default: 'default', index: true },
  employeeId: { type: String, required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  subscription: { type: Object, required: true },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// 8. WebAuthn Challenge Schema (5-minute TTL for serverless passkey flows)
const WebAuthnChallengeSchema = new mongoose.Schema({
  tenantId: { type: String, default: 'default' },
  challenge: { type: String, required: true, unique: true },
  userId: { type: String, default: '' },
  phone: { type: String, default: '' },
  type: { type: String, enum: ['registration', 'authentication'], default: 'authentication' },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

// 9. In-App Notification Schema
const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, default: 'default', index: true },
  recipientId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['request_created', 'request_reviewed', 'auto_checkout', 'system'], default: 'system' },
  relatedId: { type: String, default: '' },
  read: { type: Boolean, default: false },
  url: { type: String, default: '/?tab=leaves' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

// 10. Audit Log Schema
const AuditLogSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  actorId: { type: String, default: '' },
  actorName: { type: String, default: '' },
  action: { type: String, required: true },
  targetId: { type: String, default: '' },
  targetType: { type: String, default: '' },
  oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now, index: true }
});
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, targetId: 1, timestamp: -1 });

// 11. Subscription Payment Schema (InstaPay & Bank Transfers)
const SubscriptionPaymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, index: true },
  tenantSlug: { type: String, required: true },
  companyName: { type: String, required: true },
  plan: { type: String, required: true, enum: ['starter', 'growth', 'enterprise'] },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  amount: { type: Number, required: true }, // in EGP
  currency: { type: String, default: 'EGP' },
  paymentMethod: { type: String, enum: ['instapay', 'bank_transfer', 'cash', 'card'], default: 'instapay' },
  instapayReference: { type: String, default: '' },
  senderPhone: { type: String, default: '' },
  receiptImage: { type: String, default: '' }, // Data URL or Image URL
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  adminNote: { type: String, default: '' },
  approvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
});
SubscriptionPaymentSchema.index({ tenantId: 1, createdAt: -1 });

// 12. Advances & Bonuses Schema (السلف والمكافآت)
const AdvanceBonusSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, default: '' },
  type: { type: String, enum: ['advance', 'bonus'], required: true },
  amount: { type: Number, required: true },
  reason: { type: String, default: '' },
  splitMonths: { type: Number, enum: [1, 2], default: 1 },
  remainingAmount: { type: Number, default: 0 },
  deductionsSchedule: [{
    month: { type: String }, // 'YYYY-MM'
    amount: { type: Number },
    isDeducted: { type: Boolean, default: false }
  }],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending', index: true },
  approvedBy: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
AdvanceBonusSchema.index({ tenantId: 1, employeeId: 1, status: 1 });

// 13. Digital Payslip Schema (قسائم الرواتب الرقمية)
const PayslipSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, default: '' },
  month: { type: String, required: true }, // 'YYYY-MM'
  basicSalary: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  overtimeRate: { type: Number, default: 1.35 },
  overtimePay: { type: Number, default: 0 },
  bonusesTotal: { type: Number, default: 0 },
  grossEarnings: { type: Number, default: 0 },
  lateDeductions: { type: Number, default: 0 },
  leaveDeductions: { type: Number, default: 0 },
  advanceDeductions: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  publishedAt: { type: Date, default: Date.now }
});
PayslipSchema.index({ tenantId: 1, employeeId: 1, month: 1 }, { unique: true });

// 14. Multi-Stop Field Visits & Mileage (زيارات العملاء والمواقع وبدل البنزين)
const FieldVisitSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, default: '' },
  clientName: { type: String, required: true },
  locationName: { type: String, default: '' },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  checkInTime: { type: Date, default: Date.now },
  checkOutTime: { type: Date, default: null },
  durationMinutes: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  mileageKm: { type: Number, default: 0 },
  fuelAllowance: { type: Number, default: 0 },
  expenses: [{
    type: { type: String, default: 'transport' },
    amount: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    receiptUrl: { type: String, default: '' }
  }],
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
});
FieldVisitSchema.index({ tenantId: 1, employeeId: 1, checkInTime: -1 });

// 15. Shift Schedules & Visual Roster (جدول الشفتات والمناوبات)
const ShiftScheduleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, index: true },
  branchId: { type: String, default: '' },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, default: '' },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  startTime: { type: String, required: true }, // 'HH:mm'
  endTime: { type: String, required: true }, // 'HH:mm'
  shiftType: { type: String, enum: ['regular', 'overnight', 'split', 'on_call'], default: 'regular' },
  splitSecondStart: { type: String, default: '' },
  splitSecondEnd: { type: String, default: '' },
  isBiddingOpen: { type: Boolean, default: false },
  biddingMultiplier: { type: Number, default: 1.25 },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'swapped'], default: 'scheduled' }
});
ShiftScheduleSchema.index({ tenantId: 1, date: 1, employeeId: 1 });

// 16. HR Vault Schema (خزنة الموارد البشرية - انتهاء الإقامات والعقود وفترات الاختبار)
const HRVaultSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, default: '' },
  docType: { 
    type: String, 
    enum: ['probation_end', 'contract_renewal', 'national_id', 'residency', 'passport', 'medical'], 
    required: true 
  },
  title: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  reminderDaysBefore: { type: Number, default: 30 },
  notes: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  isResolved: { type: Boolean, default: false }
});
HRVaultSchema.index({ tenantId: 1, expiryDate: 1 });

// 17. 1-Tap Check-out Pulse & Weekly Mood (نبض الفريق ومؤشر المزاج)
const DailyPulseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, index: true },
  branchId: { type: String, default: '' },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  mood: { type: String, enum: ['happy', 'neutral', 'stressed'], required: true },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
DailyPulseSchema.index({ tenantId: 1, date: 1 });

// 18. Desk & Meeting Room Booking (حجز المكاتب وقاعات الاجتماعات)
const DeskBookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, default: '' },
  branchId: { type: String, default: '' },
  resourceType: { type: String, enum: ['desk', 'meeting_room'], default: 'desk' },
  resourceName: { type: String, required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, default: 'full_day' },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
});
DeskBookingSchema.index({ tenantId: 1, date: 1, resourceName: 1 });

// 19. Company Policy & Emergency Weather (اللوائح المخصصة وقوانين العمل وزر الطوارئ)
const CompanyPolicySchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true, index: true },
  gracePeriodMinutes: { type: Number, default: 15 },
  overtimeMultiplierDay: { type: Number, default: 1.35 },
  overtimeMultiplierNight: { type: Number, default: 1.70 },
  overtimeMultiplierHoliday: { type: Number, default: 2.00 },
  deductionCapPercent: { type: Number, default: 25 },
  monthlyOvertimeBudget: { type: Number, default: 50000 },
  hybridWeeklyDays: { type: Number, default: 3 },
  emergencyWeatherActive: { type: Boolean, default: false },
  emergencyWeatherNotes: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

// 20. Punctuality Rewards & Gamification (متجر نقاط الالتزام)
const PunctualityRewardSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, unique: true },
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  history: [{
    action: { type: String },
    points: { type: Number },
    date: { type: Date, default: Date.now }
  }]
});

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
const Branch = mongoose.models.Branch || mongoose.model('Branch', BranchSchema);
const Title = mongoose.models.Title || mongoose.model('Title', TitleSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const AttendanceRecord = mongoose.models.AttendanceRecord || mongoose.model('AttendanceRecord', AttendanceRecordSchema);
const Request = mongoose.models.Request || mongoose.model('Request', RequestSchema);
const OfficeSettings = mongoose.models.OfficeSettings || mongoose.model('OfficeSettings', OfficeSettingsSchema);
const PushSubscription = mongoose.models.PushSubscription || mongoose.model('PushSubscription', PushSubscriptionSchema);
const WebAuthnChallenge = mongoose.models.WebAuthnChallenge || mongoose.model('WebAuthnChallenge', WebAuthnChallengeSchema);
const InAppNotification = mongoose.models.InAppNotification || mongoose.model('InAppNotification', NotificationSchema);
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
const SubscriptionPayment = mongoose.models.SubscriptionPayment || mongoose.model('SubscriptionPayment', SubscriptionPaymentSchema);

const AdvanceBonus = mongoose.models.AdvanceBonus || mongoose.model('AdvanceBonus', AdvanceBonusSchema);
const Payslip = mongoose.models.Payslip || mongoose.model('Payslip', PayslipSchema);
const FieldVisit = mongoose.models.FieldVisit || mongoose.model('FieldVisit', FieldVisitSchema);
const ShiftSchedule = mongoose.models.ShiftSchedule || mongoose.model('ShiftSchedule', ShiftScheduleSchema);
const HRVault = mongoose.models.HRVault || mongoose.model('HRVault', HRVaultSchema);
const DailyPulse = mongoose.models.DailyPulse || mongoose.model('DailyPulse', DailyPulseSchema);
const DeskBooking = mongoose.models.DeskBooking || mongoose.model('DeskBooking', DeskBookingSchema);
const CompanyPolicy = mongoose.models.CompanyPolicy || mongoose.model('CompanyPolicy', CompanyPolicySchema);
const PunctualityReward = mongoose.models.PunctualityReward || mongoose.model('PunctualityReward', PunctualityRewardSchema);

module.exports = {
  PLANS,
  Tenant,
  Branch,
  Title,
  Employee,
  AttendanceRecord,
  Request,
  OfficeSettings,
  PushSubscription,
  WebAuthnChallenge,
  InAppNotification,
  AuditLog,
  SubscriptionPayment,
  AdvanceBonus,
  Payslip,
  FieldVisit,
  ShiftSchedule,
  HRVault,
  DailyPulse,
  DeskBooking,
  CompanyPolicy,
  PunctualityReward
};
