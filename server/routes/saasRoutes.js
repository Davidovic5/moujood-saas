/**
 * server/routes/saasRoutes.js
 * 
 * SaaS Platform Endpoints:
 * - Tenant Subscription & InstaPay payment submission
 * - Company Self-Service Onboarding (14-Day Free Trial)
 * - SaaS Owner "God Mode" Administration (MRR, Tenants, InstaPay Approvals)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { 
  PLANS, 
  Tenant, 
  SubscriptionPayment, 
  Employee, 
  Branch, 
  Title, 
  OfficeSettings 
} = require('../models');
const { JWT_SECRET } = require('../config/env');
const { 
  PLATFORM_PAYMENT_CONFIG, 
  resolveTenant 
} = require('../middleware/tenantSubscription');
const { connectToMongo } = require('../mongoAdapter');
const env = require('../config/env');
const { DEFAULT_ROLES, DEFAULT_BRANCH } = require('../../scripts/seed-clean');

// Ensure MongoDB is connected for all SaaS routes
router.use(async (req, res, next) => {
  try {
    await connectToMongo(env.MONGODB_URI);
  } catch (e) {
    console.error('SaaS routes DB connection error:', e);
  }
  next();
});

// Master SaaS God Mode Key from Environment (or default secure key)
const SAAS_ADMIN_KEY = process.env.SAAS_ADMIN_KEY || 'saas_god_mode_secret_key_2026';

/**
 * Middleware: Verify SaaS God Mode Admin
 */
function requireSaasOwner(req, res, next) {
  const masterKey = req.headers['x-saas-key'] || req.query.saas_key;
  const authHeader = req.headers.authorization;

  if (masterKey && masterKey === SAAS_ADMIN_KEY) {
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      if (decoded.isSaasOwner) {
        return next();
      }
    } catch (e) {}
  }

  return res.status(403).json({
    success: false,
    error: 'غير مصرح لك بالوصول إلى لوحة تحكم صاحب المنصة (SaaS God Mode).'
  });
}

/* =====================================================================
 * PUBLIC & TENANT SUBSCRIPTION ENDPOINTS
 * ===================================================================== */

// 1. Get Platform Plans & Payment Info
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: PLANS,
    paymentInfo: PLATFORM_PAYMENT_CONFIG
  });
});

// 2. Get Current Tenant Subscription Status
router.get('/subscription/status', resolveTenant, async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'الشركة غير موجودة' });
    }

    const employeeCount = await Employee.countDocuments({ 
      tenantId: tenant.tenantId, 
      isSuperAdmin: { $ne: true } 
    });
    const branchCount = await Branch.countDocuments({ 
      tenantId: tenant.tenantId, 
      isArchived: { $ne: true } 
    });

    const pendingPayment = await SubscriptionPayment.findOne({
      tenantId: tenant.tenantId,
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      tenant: {
        id: tenant.tenantId,
        slug: tenant.slug,
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
        trialEndsAt: tenant.trialEndsAt,
        subscriptionEndsAt: tenant.subscriptionEndsAt,
        maxEmployees: tenant.maxEmployees,
        maxBranches: tenant.maxBranches,
        employeeCount,
        branchCount
      },
      plans: PLANS,
      paymentInfo: PLATFORM_PAYMENT_CONFIG,
      pendingPayment: pendingPayment ? {
        id: pendingPayment.id,
        amount: pendingPayment.amount,
        plan: pendingPayment.plan,
        createdAt: pendingPayment.createdAt
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Submit InstaPay Payment Proof for Subscription
router.post('/subscription/pay-instapay', resolveTenant, async (req, res) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'الشركة غير موجودة' });
    }

    const { plan, billingCycle, amount, instapayReference, senderPhone, receiptImage } = req.body;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ success: false, error: 'يرجى اختيار باقة صالحة' });
    }
    if (!instapayReference && !receiptImage) {
      return res.status(400).json({ success: false, error: 'يرجى كتابة رقم العملية أو إرفاق صورة التحويل' });
    }

    const expectedAmount = billingCycle === 'yearly' ? PLANS[plan].priceYearly : PLANS[plan].priceMonthly;

    const paymentId = 'pay_' + Date.now();
    const newPayment = await SubscriptionPayment.create({
      id: paymentId,
      tenantId: tenant.tenantId,
      tenantSlug: tenant.slug,
      companyName: tenant.name,
      plan,
      billingCycle: billingCycle || 'monthly',
      amount: Number(amount) || expectedAmount,
      currency: 'EGP',
      paymentMethod: 'instapay',
      instapayReference: String(instapayReference || '').trim(),
      senderPhone: String(senderPhone || '').trim(),
      receiptImage: receiptImage || '',
      status: 'pending'
    });

    res.json({
      success: true,
      payment: newPayment,
      message: 'تم إرسال بيانات التحويل بنجاح! سيتم تفعيل اشتراككم فور مراجعة العملية.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Company Self-Registration (14-Day Free Trial Onboarding)
router.post('/register-company', async (req, res) => {
  try {
    const { 
      companyName, 
      slug, 
      adminName, 
      adminPhone, 
      adminPassword, 
      plan 
    } = req.body;

    // A. Validation
    if (!companyName || !String(companyName).trim()) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال اسم الشركة' });
    }

    const cleanSlug = String(slug || '').toLowerCase().trim();
    if (!cleanSlug || cleanSlug.length < 3) {
      return res.status(400).json({ success: false, error: 'يجب أن يتكون اسم الرابط الفرعي (Subdomain) من 3 أحرف على الأقل' });
    }

    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      return res.status(400).json({ success: false, error: 'الرابط الفرعي يجب أن يحتوي فقط على أحرف إنجليزية وأرقام وعلامة الشرطة (-)' });
    }

    const reserved = ['admin', 'api', 'www', 'app', 'default', 'saas', 'dashboard', 'root', 'login', 'signup'];
    if (reserved.includes(cleanSlug)) {
      return res.status(400).json({ success: false, error: 'هذا الرابط الفرعي محجوز، يرجى اختيار اسم آخر' });
    }

    const existingTenant = await Tenant.findOne({ slug: cleanSlug });
    if (existingTenant) {
      return res.status(400).json({ success: false, error: 'هذا الرابط الفرعي مستخدم بالفعل لشركة أخرى، يرجى اختيار اسم مختلف' });
    }

    const cleanPhone = String(adminPhone || '').trim();
    const cleanPassword = String(adminPassword || '').trim();
    if (!cleanPhone || !cleanPassword) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال رقم هاتف المدير وكلمة المرور' });
    }

    // B. Create Tenant with 14-Day Free Trial
    const chosenPlan = (plan && PLANS[plan]) ? plan : 'starter';
    const planConfig = PLANS[chosenPlan];
    const tenantId = `tenant_${cleanSlug}_${Date.now()}`;
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const newTenant = await Tenant.create({
      tenantId,
      slug: cleanSlug,
      name: String(companyName).trim(),
      timezone: 'Africa/Cairo',
      plan: chosenPlan,
      status: 'trial',
      trialEndsAt,
      subscriptionEndsAt: trialEndsAt,
      maxEmployees: planConfig.maxEmployees,
      maxBranches: planConfig.maxBranches,
      billingCycle: 'monthly',
      contactPhone: cleanPhone,
      adminName: String(adminName || 'المدير العام').trim(),
      branding: {
        companyName: String(companyName).trim(),
        logoUrl: '/brand/logo.svg'
      }
    });

    // C. Create Default Office Settings
    await OfficeSettings.create({
      tenantId,
      companyName: newTenant.name,
      shiftHours: 8,
      graceMinutes: 15,
      workStartTime: '09:00',
      workEndTime: '17:00'
    });

    // D. Seed Default Roles
    for (const r of DEFAULT_ROLES) {
      await Title.create({
        id: `title_${cleanSlug}_${r.code}`,
        tenantId,
        code: r.code,
        name: r.nameAr,
        title: r.title,
        nameAr: r.nameAr,
        nameEn: r.nameEn,
        level: r.level,
        isSystemAdmin: Boolean(r.isSystemAdmin),
        description: r.description,
        permissions: r.permissions
      });
    }

    // E. Seed Headquarters Branch
    const defaultBranchId = `branch_${cleanSlug}_main`;
    await Branch.create({
      id: defaultBranchId,
      tenantId,
      code: 'main',
      name: 'الفرع الرئيسي',
      city: 'القاهرة',
      sectorId: 'sector_main',
      sectorName: 'المركز الرئيسي',
      latitude: 30.0444,
      longitude: 31.2357,
      radiusMeters: 100,
      isActive: true,
      isArchived: false
    });

    // F. Create Super Admin Employee
    const adminUser = await Employee.create({
      id: `emp_${cleanSlug}_admin`,
      tenantId,
      name: String(adminName || 'المدير العام').trim(),
      phone: cleanPhone,
      password: cleanPassword,
      pin: '1234',
      sapNumber: '1001',
      titleCode: 'exec_dir',
      jobTitle: 'المدير التنفيذي',
      branchId: defaultBranchId,
      branchName: 'الفرع الرئيسي',
      isSuperAdmin: true,
      leaveBalance: 21,
      permissionsBalanceHours: 2,
      weeklyOffDays: ['friday', 'saturday'],
      permissions: DEFAULT_ROLES[0].permissions
    });

    // G. Generate Auth Token
    const token = jwt.sign(
      {
        userId: adminUser.id,
        phone: adminUser.phone,
        tenantId: newTenant.tenantId,
        titleCode: adminUser.titleCode,
        isSuperAdmin: true
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'تم تسجيل شركتك بنجاح! تم تفعيل فترة تجريبية مجانية لمدة 14 يوماً.',
      tenant: {
        id: newTenant.tenantId,
        slug: newTenant.slug,
        name: newTenant.name,
        plan: newTenant.plan,
        trialEndsAt: newTenant.trialEndsAt
      },
      user: {
        id: adminUser.id,
        name: adminUser.name,
        phone: adminUser.phone,
        jobTitle: adminUser.jobTitle
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


/* =====================================================================
 * SAAS OWNER "GOD MODE" MANAGEMENT ENDPOINTS
 * ===================================================================== */

// 5. SaaS Admin Login
router.post('/admin/login', (req, res) => {
  const { key, password } = req.body;
  if ((key && key === SAAS_ADMIN_KEY) || (password && password === SAAS_ADMIN_KEY)) {
    const token = jwt.sign(
      { isSaasOwner: true, role: 'platform_owner' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, error: 'مفتاح الدخول غير صحيح' });
});

// 6. Get Global SaaS Stats & MRR
router.get('/admin/stats', requireSaasOwner, async (req, res) => {
  try {
    const tenants = await Tenant.find({}).lean();
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const trialTenants = tenants.filter(t => t.status === 'trial').length;
    const pastDueTenants = tenants.filter(t => t.status === 'past_due').length;
    const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;

    // Calculate MRR (Monthly Recurring Revenue in EGP)
    let mrr = 0;
    for (const t of tenants) {
      if (t.status === 'active' && t.plan && PLANS[t.plan]) {
        mrr += PLANS[t.plan].priceMonthly;
      }
    }

    const totalEmployees = await Employee.countDocuments({ isSuperAdmin: { $ne: true } });
    const pendingPaymentsCount = await SubscriptionPayment.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      stats: {
        totalTenants,
        activeTenants,
        trialTenants,
        pastDueTenants,
        suspendedTenants,
        totalEmployees,
        mrr, // Target: 50,000 EGP
        pendingPaymentsCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Get All Companies / Tenants
router.get('/admin/tenants', requireSaasOwner, async (req, res) => {
  try {
    const tenants = await Tenant.find({}).sort({ createdAt: -1 }).lean();
    
    // Enrich with live employee counts
    const enriched = await Promise.all(
      tenants.map(async (t) => {
        const empCount = await Employee.countDocuments({ tenantId: t.tenantId, isSuperAdmin: { $ne: true } });
        const branchCount = await Branch.countDocuments({ tenantId: t.tenantId, isArchived: { $ne: true } });
        return {
          ...t,
          employeeCount: empCount,
          branchCount
        };
      })
    );

    res.json({ success: true, tenants: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Update Tenant Subscription (Extend, Activate, Suspend, Change Plan)
router.post('/admin/tenants/:id/subscription', requireSaasOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, status, durationMonths, maxEmployees, maxBranches, notes } = req.body;

    const tenant = await Tenant.findOne({ $or: [{ tenantId: id }, { slug: id }] });
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'الشركة غير موجودة' });
    }

    if (plan && PLANS[plan]) {
      tenant.plan = plan;
      tenant.maxEmployees = maxEmployees || PLANS[plan].maxEmployees;
      tenant.maxBranches = maxBranches || PLANS[plan].maxBranches;
    }

    if (status) {
      tenant.status = status;
    }

    if (durationMonths && Number(durationMonths) > 0) {
      const currentExpiry = tenant.subscriptionEndsAt && new Date(tenant.subscriptionEndsAt) > new Date()
        ? new Date(tenant.subscriptionEndsAt)
        : new Date();
      
      const newExpiry = new Date(currentExpiry.getTime() + Number(durationMonths) * 30 * 24 * 60 * 60 * 1000);
      tenant.subscriptionEndsAt = newExpiry;
      tenant.status = 'active';
    }

    if (notes !== undefined) {
      tenant.notes = notes;
    }

    await tenant.save();

    res.json({
      success: true,
      message: 'تم تحديث اشتراك الشركة بنجاح',
      tenant
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Get Pending / All InstaPay Payment Submissions
router.get('/admin/payments', requireSaasOwner, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const payments = await SubscriptionPayment.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Approve InstaPay Payment & Auto-Activate Company Subscription
router.post('/admin/payments/:id/approve', requireSaasOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const payment = await SubscriptionPayment.findOne({ id });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'العملية غير موجودة' });
    }

    payment.status = 'approved';
    payment.adminNote = adminNote || 'تم التحقق من تحويل إنستاباي بنجاح';
    payment.approvedAt = new Date();
    await payment.save();

    // Auto-extend tenant subscription
    const tenant = await Tenant.findOne({ tenantId: payment.tenantId });
    if (tenant) {
      tenant.plan = payment.plan;
      tenant.status = 'active';
      const planConfig = PLANS[payment.plan];
      if (planConfig) {
        tenant.maxEmployees = planConfig.maxEmployees;
        tenant.maxBranches = planConfig.maxBranches;
      }

      const daysToAdd = payment.billingCycle === 'yearly' ? 365 : 30;
      const currentExpiry = tenant.subscriptionEndsAt && new Date(tenant.subscriptionEndsAt) > new Date()
        ? new Date(tenant.subscriptionEndsAt)
        : new Date();
      
      tenant.subscriptionEndsAt = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      await tenant.save();
    }

    res.json({
      success: true,
      message: `تم اعتماد التحويل وتفعيل اشتراك شركة "${payment.companyName}" بنجاح!`,
      payment,
      tenant
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. Reject InstaPay Payment
router.post('/admin/payments/:id/reject', requireSaasOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await SubscriptionPayment.findOne({ id });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'العملية غير موجودة' });
    }

    payment.status = 'rejected';
    payment.adminNote = reason || 'لم يتم العثور على التحويل أو البيانات غير متطابقة';
    await payment.save();

    res.json({
      success: true,
      message: 'تم رفض العملية وتدوين الملاحظة',
      payment
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
