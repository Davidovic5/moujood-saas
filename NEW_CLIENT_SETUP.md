# 🚀 دليل إعداد وتخصيص عميل جديد في 5 دقائق (New Client Deployment Guide)

تم تصميم هذا القالب المعماري (**Smart GPS Attendance SaaS Master Template**) ليكون قابلاً للتخصيص وإعادة النشر لأي شركة أو مؤسسة جديدة خلال **5 دقائق فقط**، مع دعم كامل للـ White-labeling، وتعدد الفروع الجغرافية، ونظام الصلاحيات الديناميكي (12-Toggle RBAC).

---

## 📋 المتطلبات الأساسية (Prerequisites)
1. **Node.js** إصدار 18 أو أحدث (`node -v`).
2. **MongoDB Atlas Database Cluster** (أو قاعدة بيانات MongoDB محلية).
3. **حساب Vercel** (للنشر السحابي المجاني أو المدفوع) أو سيرفر Node.js (Docker / VPS).

---

## ⏱️ خطوات الإعداد (5-Minute Step-by-Step)

### الخطوة 1: تخصيص الهوية البصرية والعلامة التجارية (2 دقيقة)
افتح الملف المركزي الخاص بإعدادات الشركة:
👉 [src/config/company.config.ts](file:///Users/davidovic/.gemini/antigravity/scratch/attendance-saas-template/src/config/company.config.ts)

قم بتعديل القيم التالية لتلائم العميل الجديد:
```typescript
export const companyConfig: CompanyConfig = {
  // اسم الشركة أو المنشأة
  companyName: 'اسم شركة العميل',

  // المصطلحات المستخدمة في الواجهة (المقر، الفرع، المصنع، العيادة...)
  entitySingular: 'الفرع',
  entityPlural: 'الفروع',

  // مسارات الشعار والأيقونة في مجلد /public/brand/
  logoPath: '/brand/logo.svg',
  faviconPath: '/brand/favicon.svg',

  // الألوان الأساسية للمنظومة (CSS Custom Properties)
  theme: {
    primary: '#F5B800',       // اللون الرئيسي (أزرار، تابات نشطة، حدود)
    primaryHover: '#E5A700',  // لون التمرير والضغط
    contrastText: '#000000',  // لون النص على الزر الرئيسي
  },

  // الإعدادات الافتراضية
  defaults: {
    timezone: 'Africa/Cairo',
    shiftHours: 8,
    annualLeaveDays: 21,
    monthlyExcuseHours: 2,
    defaultRadiusMeters: 100,
  }
};
```
> [!TIP]
> لوضع شعار العميل الجديد، ضع ملف الشعار بصيغة SVG أو PNG في `public/brand/logo.svg` وسيتحدث تلقائياً في كافة شاشات تسجيل الدخول، والشريط العلوي، ومودال التنزيل.

---

### الخطوة 2: تهيئة متغيرات البيئة (`.env`) (1 دقيقة)
قم بنسخ ملف الإعدادات المرجعي `.env.example` إلى `.env`:
```bash
cp .env.example .env
```
وقم بملء البيانات المطلوبة:
```env
# 1. رابط قاعدة بيانات MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/client_attendance_db?retryWrites=true&w=majority

# 2. مفتاح تشفير JWT (32 حرف عشوائي)
JWT_SECRET=super_secret_jwt_random_client_key_32_chars

# 3. بيانات حساب المدير العام الأولي (Super Admin)
SEED_ADMIN_PHONE=01000000000
SEED_ADMIN_PASSWORD=ClientSecurePassword123!
SEED_ADMIN_NAME=المدير العام
```

> [!IMPORTANT]
> ملف `.env` و `.env.local` مدرجان في `.gitignore` ومحميان تماماً من الرفع على مستودع Git.

---

### الخطوة 3: تشغيل بذر قاعدة البيانات (Seed Clean Database) (30 ثانية)
قم بتشغيل السكربت الآمن المكرر (Idempotent):
```bash
npm run seed
```
**ماذا يُنشئ هذا السكربت تلقائياً؟**
1. **المستأجر الافتراضي (`Tenant`)** وإعدادات وردية العمل (8 ساعات، 15 دقيقة سماح).
2. **4 مسميات وظيفية قياسية (Generic RBAC Roles)** بمصفوفة الـ 12 صلاحية:
   - `المدير التنفيذي (Executive Director)`: كامل الصلاحيات والنظام.
   - `مدير قطاع / منطقة (Area Manager)`: متابعة واعتمادات متعددة الفروع والتقارير.
   - `مدير فرع / مشرف (Branch Manager)`: إدارة فرع واحد واعتمادات حضوره وأذوناته.
   - `موظف (Employee)`: تسجيل الحضور بالـ GPS وتقديم طلبات الإجازات والأذونات.
3. **الفرع الرئيسي الأولي (`الفرع الرئيسي`)**.
4. **حساب Super Admin نشط** مطابق للبيانات المحددة في `.env`.

---

### الخطوة 4: النشر السحابي على Vercel (1.5 دقيقة)
1. قم بربط مستودع Git الخاص بك بمشروع جديد على [Vercel](https://vercel.com).
2. في إعدادات المشروع (**Project Settings > Environment Variables**)، أضف:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. إعدادات البناء الافتراضية محددة مسبقاً في `vercel.json` ولا تتطلب أي ضبط إضافي:
   - **Framework Preset**: `Vite`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
   - **API Routes**: `api/index.js` يتولى تشغيل تطبيق Express كـ Serverless Functions تلقائياً.
4. اضغط **Deploy**! سيعمل التطبيق والـ PWA فورياً.

---

### الخطوة 5: تهيئة النظام لأول مرة من لوحة التحكم (Super Admin)
1. **تسجيل الدخول**: افتح رابط التطبيق وسجل دخولك برقم الهاتف وكلمة المرور المحددة في الخطوة 2.
2. **تبويب الفروع (`الفروع`)**:
   - اضغط **"إضافة فرع جديد"**.
   - أدخل اسم الفرع، المدينة، القطاع.
   - اضغط **"تعيين موقعي الحالي"** لجلب إحداثيات الـ GPS الجغرافية بدقة من متصفحك، أو أدخل خط العرض والطول يدوياً.
   - حدد النطاق المسموح به بالأمتار (مثلاً `100م`).
   - احذف أو عدل الفرع التجريبي الأولي.
3. **تبويب الصلاحيات (`الصلاحيات`)**:
   - راجع مصفوفة الـ 12 مفتاح تحكم (Toggles) لكل وظيفة.
   - يمكنك إضافة مسميات وظيفية جديدة، أو تعديل المسميات الحالية، أو إعادة ترتيب درجاتها.
4. **تبويب الموظفين (`الموظفين`)**:
   - أضف موظفي الشركة ووزعهم على الفروع والمسميات الوظيفية.
5. **تثبيت التطبيق على هواتف الموظفين (PWA)**:
   - **أندرويد (Chrome)**: القائمة (⋮) ثم **تثبيت التطبيق (Install App)**.
   - **آيفون (Safari)**: زر المشاركة (Share ⬆️) ثم **إضافة إلى الشاشة الرئيسية (Add to Home Screen)**.
   - يدعم التحديث التلقائي الفوري عبر الأثير (OTA Background Sync) بمجرد نشر أي تحسين على السيرفر.
