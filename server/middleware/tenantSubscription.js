/**
 * server/middleware/tenantSubscription.js
 * 
 * SaaS Multi-Tenant Resolution & Subscription Protection Gate
 * - Extracts tenant from subdomain, header, query, or token
 * - Enforces subscription validity & grace periods (Anti-Piracy Gate)
 * - Enforces Plan limits (Max Employees & Max Branches)
 */

const { Tenant, Employee, Branch, PLANS } = require('../models');
const { DEFAULT_TENANT_ID } = require('../config/env');

// Platform-level InstaPay details for client payments
const PLATFORM_PAYMENT_CONFIG = {
  instapayUsername: process.env.SAAS_INSTAPAY_USERNAME || 'davidovic',
  instapayUrl: 'https://ipn.eg/S/davidovic/instapay/3BW08C',
  instapayPhone: process.env.SAAS_INSTAPAY_PHONE || 'https://ipn.eg/S/davidovic/instapay/3BW08C',
  bankName: 'إنستاباي مصر (InstaPay IPN)',
  accountName: 'David / منصة موجود Moujood SaaS',
  notes: 'يمكنك التحويل بنقرة واحدة عبر الرابط المباشر، أو التحويل لمعرف davidovic وكتابة اسم شركتك في الملاحظات'
};

/**
 * 1. Resolve Tenant from Host, Subdomain, Header, or Query
 */
async function resolveTenant(req, res, next) {
  try {
    let slug = null;

    // A. Check explicit header from frontend (sent by subdomain detection)
    if (req.headers['x-tenant-slug']) {
      slug = String(req.headers['x-tenant-slug']).trim().toLowerCase();
    }

    // B. Check query parameter (?tenant=slug) or body
    if (!slug && req.query && req.query.tenant) {
      slug = String(req.query.tenant).trim().toLowerCase();
    }
    if (!slug && req.body && req.body.tenantSlug) {
      slug = String(req.body.tenantSlug).trim().toLowerCase();
    }

    // C. Check Host header (e.g. acme.attendance.com -> acme)
    if (!slug) {
      const host = req.get('host') || '';
      const cleanHost = host.split(':')[0].toLowerCase();
      if (cleanHost.endsWith('.vercel.app')) {
        const hostParts = cleanHost.split('.');
        if (hostParts.length > 3 && hostParts[0] !== 'www' && hostParts[0] !== 'api') {
          slug = hostParts[0].toLowerCase();
        }
      } else {
        const hostParts = cleanHost.split('.');
        if (hostParts.length > 2 && hostParts[0] !== 'www' && hostParts[0] !== 'api') {
          slug = hostParts[0].toLowerCase();
        }
      }
    }

    // D. Check authenticated token tenantId if still not resolved
    let tenant = null;
    if (slug && slug !== 'default') {
      tenant = await Tenant.findOne({ slug });
    }

    // Fallback: look up by req.user.tenantId or DEFAULT_TENANT_ID
    if (!tenant && req.user && req.user.tenantId) {
      tenant = await Tenant.findOne({ tenantId: req.user.tenantId });
    }

    if (!tenant) {
      tenant = await Tenant.findOne({ $or: [{ slug: DEFAULT_TENANT_ID }, { tenantId: DEFAULT_TENANT_ID }] });
    }

    // Attach resolved tenant to request
    req.tenant = tenant;
    req.tenantId = tenant ? tenant.tenantId : DEFAULT_TENANT_ID;
    req.tenantSlug = tenant ? tenant.slug : 'default';

    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    next();
  }
}

/**
 * 2. Subscription Protection Guard (Anti-Piracy Gate)
 * Blocks expired or suspended companies from performing operational actions
 */
async function checkSubscription(req, res, next) {
  const tenant = req.tenant;

  // If no tenant or it's the root default tenant with active enterprise, pass
  if (!tenant || tenant.slug === 'default' || tenant.tenantId === 'default') {
    return next();
  }

  // Exempt public and subscription-related routes
  const path = req.path;
  const isExempt = 
    path.startsWith('/auth/') || 
    path.startsWith('/saas/') || 
    path.startsWith('/subscription/') ||
    path === '/health' ||
    path === '/branding';

  if (isExempt) {
    return next();
  }

  // 1. Check if Suspended
  if (tenant.status === 'suspended') {
    return res.status(402).json({
      success: false,
      code: 'SUBSCRIPTION_SUSPENDED',
      error: 'تم إيقاف حساب الشركة مؤقتاً من قبل إدارة المنصة.',
      paymentInfo: PLATFORM_PAYMENT_CONFIG,
      plans: PLANS
    });
  }

  const now = new Date();

  // 2. Check Trial Expiration
  if (tenant.status === 'trial') {
    const trialEnd = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
    if (trialEnd && now > trialEnd) {
      // Update tenant status to past_due
      tenant.status = 'past_due';
      await tenant.save().catch(() => {});

      return res.status(402).json({
        success: false,
        code: 'TRIAL_EXPIRED',
        error: 'انتهت الفترة التجريبية المجانية (14 يوماً). يرجى الاشتراك للمتابعة.',
        trialEndedAt: trialEnd,
        paymentInfo: PLATFORM_PAYMENT_CONFIG,
        plans: PLANS
      });
    }
  }

  // 3. Check Active Subscription Expiration (with 2-day grace period)
  if (tenant.status === 'active' || tenant.status === 'past_due') {
    if (tenant.subscriptionEndsAt) {
      const subEnd = new Date(tenant.subscriptionEndsAt);
      const gracePeriodEnd = new Date(subEnd.getTime() + 2 * 24 * 60 * 60 * 1000); // +2 days grace

      if (now > gracePeriodEnd) {
        if (tenant.status !== 'past_due') {
          tenant.status = 'past_due';
          await tenant.save().catch(() => {});
        }

        return res.status(402).json({
          success: false,
          code: 'SUBSCRIPTION_EXPIRED',
          error: 'انتهت صلاحية اشتراك شركتكم وفترة السماح. يرجى تجديد الاشتراك عبر إنستاباي للاستمرار.',
          expiredAt: subEnd,
          paymentInfo: PLATFORM_PAYMENT_CONFIG,
          plans: PLANS
        });
      }
    }
  }

  next();
}

/**
 * 3. Enforce Max Employees Limit per Plan
 */
async function enforceEmployeeLimit(req, res, next) {
  try {
    let tenant = req.tenant;
    const tenantId = req.tenantId || req.tenant?.tenantId;
    if (!tenant && tenantId) {
      tenant = await Tenant.findOne({ tenantId });
    }
    if (!tenant) return next();

    const maxAllowed = tenant.maxEmployees || 15;
    const currentCount = await Employee.countDocuments({ 
      tenantId: tenant.tenantId, 
      isSuperAdmin: { $ne: true } 
    });

    if (currentCount >= maxAllowed) {
      return res.status(400).json({
        success: false,
        code: 'EMPLOYEE_LIMIT_REACHED',
        error: `لقد وصلت إلى الحد الأقصى للموظفين المسموح به في باقتك الحالية (${maxAllowed} موظف). يرجى ترقية باقتك لإضافة المزيد من الموظفين.`
      });
    }

    next();
  } catch (error) {
    console.error('Error enforcing employee limit:', error);
    next();
  }
}

/**
 * 4. Enforce Max Branches Limit per Plan
 */
async function enforceBranchLimit(req, res, next) {
  try {
    const tenant = req.tenant;
    if (!tenant) return next();

    const maxAllowed = tenant.maxBranches || 1;
    const currentCount = await Branch.countDocuments({ 
      tenantId: req.tenantId, 
      isArchived: { $ne: true } 
    });

    if (currentCount >= maxAllowed) {
      return res.status(400).json({
        success: false,
        code: 'BRANCH_LIMIT_REACHED',
        error: `لقد وصلت إلى الحد الأقصى للفروع المسموح به في باقتك (${maxAllowed} فرع). يرجى الترقية لإضافة فروع جديدة.`
      });
    }

    next();
  } catch (error) {
    console.error('Error enforcing branch limit:', error);
    next();
  }
}

module.exports = {
  PLATFORM_PAYMENT_CONFIG,
  resolveTenant,
  checkSubscription,
  enforceEmployeeLimit,
  enforceBranchLimit
};
