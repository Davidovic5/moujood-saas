/**
 * scripts/seed-clean.js
 * 
 * Idempotent Seed Script for Attendance SaaS Template
 * Initializes a fresh database with:
 *   1. 4 Generic Hierarchical Roles with 12-toggle RBAC
 *   2. 1 Default Headquarters Branch (الفرع الرئيسي)
 *   3. 1 Clean Super Admin Account (from env SEED_ADMIN_PHONE / SEED_ADMIN_PASSWORD)
 *   4. Default Multi-Tenant and Office Settings
 * 
 * Usage:
 *   node scripts/seed-clean.js
 */

const path = require('path');
const mongoose = require('mongoose');
const env = require('../server/config/env');
const {
  Tenant,
  OfficeSettings,
  Branch,
  Title,
  Employee
} = require('../server/models');

const TENANT_ID = process.env.DEFAULT_TENANT_ID || 'default';
const ADMIN_PHONE = (process.env.SEED_ADMIN_PHONE || '01000000000').trim();
const ADMIN_PASSWORD = (process.env.SEED_ADMIN_PASSWORD || 'Admin123!').trim();
const ADMIN_NAME = (process.env.SEED_ADMIN_NAME || 'المدير العام').trim();
const COMPANY_NAME = (process.env.COMPANY_NAME || 'اسم الشركة').trim();

const DEFAULT_ROLES = [
  {
    code: 'exec_dir',
    title: 'المدير التنفيذي',
    nameAr: 'المدير التنفيذي',
    nameEn: 'Executive Director',
    level: 1,
    isSystemAdmin: true,
    description: 'صلاحيات كاملة وغير مقيدة على كافة الفروع والإعدادات والموظفين والتقارير',
    permissions: {
      check_in_out: true,
      view_own_attendance: true,
      view_office_presence: true,
      request_leave: true,
      request_permission: true,
      approve_leaves_permissions: true,
      approve_early_checkout: true,
      manage_employees: true,
      manage_titles_permissions: true,
      manage_office_settings: true,
      view_reports: true,
      view_all_branches: true
    }
  },
  {
    code: 'area_manager',
    title: 'مدير قطاع / منطقة',
    nameAr: 'مدير قطاع / منطقة',
    nameEn: 'Area Manager',
    level: 2,
    isSystemAdmin: false,
    description: 'متابعة واعتماد طلبات فروع متعددة ضمن نطاق القطاع الجغرافي والاطلاع على تقاريرها',
    permissions: {
      check_in_out: true,
      view_own_attendance: true,
      view_office_presence: true,
      request_leave: true,
      request_permission: true,
      approve_leaves_permissions: true,
      approve_early_checkout: true,
      manage_employees: true,
      manage_titles_permissions: false,
      manage_office_settings: false,
      view_reports: true,
      view_all_branches: true
    }
  },
  {
    code: 'branch_manager',
    title: 'مدير فرع / مشرف',
    nameAr: 'مدير فرع / مشرف',
    nameEn: 'Branch Manager',
    level: 3,
    isSystemAdmin: false,
    description: 'إدارة حضور وموظفي الفرع المعين به واعتماد الأذونات والانصراف المبكر',
    permissions: {
      check_in_out: true,
      view_own_attendance: true,
      view_office_presence: true,
      request_leave: true,
      request_permission: true,
      approve_leaves_permissions: true,
      approve_early_checkout: true,
      manage_employees: true,
      manage_titles_permissions: false,
      manage_office_settings: false,
      view_reports: true,
      view_all_branches: false
    }
  },
  {
    code: 'employee',
    title: 'موظف',
    nameAr: 'موظف',
    nameEn: 'Employee',
    level: 4,
    isSystemAdmin: false,
    description: 'تسجيل الحضور والانصراف بالـ GPS وتقديم طلبات الإجازات والأذونات ومتابعة السجل الشخصي',
    permissions: {
      check_in_out: true,
      view_own_attendance: true,
      view_office_presence: false,
      request_leave: true,
      request_permission: true,
      approve_leaves_permissions: false,
      approve_early_checkout: false,
      manage_employees: false,
      manage_titles_permissions: false,
      manage_office_settings: false,
      view_reports: false,
      view_all_branches: false
    }
  }
];

const DEFAULT_BRANCH = {
  id: 'branch_main',
  name: 'الفرع الرئيسي',
  city: 'القاهرة',
  sector: 'المركز الرئيسي',
  latitude: 30.0444,
  longitude: 31.2357,
  radiusMeters: 100,
  isActive: true,
  isArchived: false
};

async function seedCleanDatabase() {
  console.log('====================================================');
  console.log('🚀 Running Attendance SaaS Clean Database Seeder');
  console.log('====================================================');

  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(` Connected to MongoDB successfully.\n`);

    // 1. Upsert Tenant
    console.log(`📦 [1/5] Ensuring Tenant [${TENANT_ID}]...`);
    await Tenant.findOneAndUpdate(
      { tenantId: TENANT_ID },
      {
        $set: {
          slug: TENANT_ID || 'default',
          name: COMPANY_NAME,
          status: 'active',
          plan: 'enterprise',
          maxEmployees: 999,
          maxBranches: 999,
          subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        $setOnInsert: {
          tenantId: TENANT_ID,
          timezone: 'Africa/Cairo',
          branding: {
            companyName: COMPANY_NAME,
            logoUrl: '/brand/logo.svg'
          },
          createdAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(` Tenant verified.\n`);

    // 2. Upsert Office Settings
    console.log(`⚙️ [2/5] Ensuring Default Office Settings...`);
    await OfficeSettings.findOneAndUpdate(
      { tenantId: TENANT_ID },
      {
        $setOnInsert: {
          tenantId: TENANT_ID,
          companyName: COMPANY_NAME,
          shiftHours: 8,
          graceMinutes: 15,
          workStartTime: '09:00',
          workEndTime: '17:00'
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(` Office settings verified.\n`);

    // 3. Upsert Roles / Titles
    console.log(`🛡️ [3/5] Seeding ${DEFAULT_ROLES.length} Generic Hierarchical Roles...`);
    for (const role of DEFAULT_ROLES) {
      const roleId = `title_${role.code}`;
      await Title.findOneAndUpdate(
        { tenantId: TENANT_ID, code: role.code },
        {
          $set: {
            id: roleId,
            name: role.nameAr,
            title: role.title,
            nameAr: role.nameAr,
            nameEn: role.nameEn,
            level: role.level,
            isSystemAdmin: Boolean(role.isSystemAdmin),
            description: role.description,
            permissions: role.permissions,
            updatedAt: new Date()
          },
          $setOnInsert: {
            tenantId: TENANT_ID,
            code: role.code,
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`   - Role [${role.code}]: ${role.nameAr} (${role.nameEn}) - Level ${role.level}`);
    }
    console.log(` Roles seeded successfully.\n`);

    // 4. Upsert Default Headquarters Branch
    console.log(`📍 [4/5] Ensuring Headquarters Branch [${DEFAULT_BRANCH.name}]...`);
    await Branch.findOneAndUpdate(
      { tenantId: TENANT_ID, id: DEFAULT_BRANCH.id },
      {
        $set: {
          name: DEFAULT_BRANCH.name,
          city: DEFAULT_BRANCH.city,
          sector: DEFAULT_BRANCH.sector,
          latitude: DEFAULT_BRANCH.latitude,
          longitude: DEFAULT_BRANCH.longitude,
          radiusMeters: DEFAULT_BRANCH.radiusMeters,
          isActive: DEFAULT_BRANCH.isActive,
          isArchived: DEFAULT_BRANCH.isArchived,
          updatedAt: new Date()
        },
        $setOnInsert: {
          tenantId: TENANT_ID,
          id: DEFAULT_BRANCH.id,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log(` Headquarters branch verified.\n`);

    // 5. Upsert Super Admin Account
    console.log(`👤 [5/5] Ensuring Super Admin Account (${ADMIN_PHONE})...`);
    const superAdminData = {
      id: 'admin_super',
      tenantId: TENANT_ID,
      name: ADMIN_NAME,
      phone: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      pin: '1234',
      sapNumber: '1001',
      titleCode: 'exec_dir',
      jobTitle: 'المدير التنفيذي',
      branchId: DEFAULT_BRANCH.id,
      branchName: DEFAULT_BRANCH.name,
      isSuperAdmin: true,
      leaveBalance: 21,
      permissionsBalanceHours: 2,
      weeklyOffDays: ['friday', 'saturday'],
      boundDeviceId: null,
      permissions: DEFAULT_ROLES[0].permissions,
      updatedAt: new Date()
    };

    const existingAdmin = await Employee.findOne({
      tenantId: TENANT_ID,
      $or: [{ phone: ADMIN_PHONE }, { isSuperAdmin: true }]
    });

    if (existingAdmin) {
      existingAdmin.name = ADMIN_NAME;
      existingAdmin.phone = ADMIN_PHONE;
      existingAdmin.password = ADMIN_PASSWORD;
      existingAdmin.titleCode = 'exec_dir';
      existingAdmin.jobTitle = 'المدير التنفيذي';
      existingAdmin.branchId = DEFAULT_BRANCH.id;
      existingAdmin.branchName = DEFAULT_BRANCH.name;
      existingAdmin.isSuperAdmin = true;
      existingAdmin.permissions = DEFAULT_ROLES[0].permissions;
      await existingAdmin.save();
      console.log(` Super Admin updated: ${existingAdmin.name} (${existingAdmin.phone})`);
    } else {
      await Employee.create(superAdminData);
      console.log(` Super Admin created: ${ADMIN_NAME} (${ADMIN_PHONE})`);
    }

    console.log('\n====================================================');
    console.log('🎉 Seed Completed Successfully!');
    console.log('====================================================');
    console.log(`Admin Login Credentials:`);
    console.log(`- Phone:    ${ADMIN_PHONE}`);
    console.log(`- Password: ${ADMIN_PASSWORD}`);
    console.log(`- Role:     المدير التنفيذي (Full Super Admin Access)`);
    console.log('====================================================\n');

  } catch (error) {
    console.error('❌ Seeder Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

if (require.main === module) {
  seedCleanDatabase();
}

module.exports = { seedCleanDatabase, DEFAULT_ROLES, DEFAULT_BRANCH };
