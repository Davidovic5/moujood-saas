import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  Check, 
  X, 
  ArrowLeft, 
  User, 
  Phone, 
  Lock, 
  Globe, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../api';
import { compressImage } from '../utils/imageCompressor';
import { updateAppBranding } from '../utils/appBranding';

export function CompanyRegistrationModal({ isOpen, onClose, onSuccess, initialPlan = 'growth' }) {
  const [step, setStep] = useState(1); // 1: Company details & plan, 2: Admin credentials, 3: Success
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [plan, setPlan] = useState(initialPlan);
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationResult, setRegistrationResult] = useState(null);

  if (!isOpen) return null;

  const handleSlugChange = (e) => {
    // Only allow alphanumeric and hyphens, lowercase
    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(clean);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 300, 0.85);
        setLogoUrl(compressed);
      } catch (err) {
        setError(err.message || 'فشل معالجة صورة الشعار');
      }
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim()) {
      setError('يرجى إدخال اسم شركتك أو مؤسستك');
      return;
    }

    if (!slug.trim() || slug.trim().length < 3) {
      setError('يرجى إدخال رابط فرعي صالح لا يقل عن 3 أحرف');
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!adminPhone.trim() || adminPhone.trim().length < 10) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    if (!adminPassword || adminPassword.length < 4) {
      setError('يرجى إدخال كلمة مرور قوية لا تقل عن 4 خانات');
      return;
    }

    setLoading(true);

    try {
      const res = await api.registerCompany({
        companyName: companyName.trim(),
        slug: slug.trim(),
        logoUrl: logoUrl || '/brand/logo.svg',
        plan,
        adminName: adminName.trim() || 'المدير العام',
        adminPhone: adminPhone.trim(),
        adminPassword: adminPassword.trim()
      });

      if (res.success) {
        setRegistrationResult(res);
        setStep(3);

        // Update document title, favicon, and app branding dynamically
        updateAppBranding(companyName.trim(), logoUrl || '/brand/logo.svg');

        // Store tokens & tenant slug in browser
        if (res.token) {
          localStorage.setItem('office_auth_token', res.token);
        }
        if (res.user) {
          localStorage.setItem('office_auth_user', JSON.stringify(res.user));
        }
        if (res.tenant?.slug) {
          localStorage.setItem('saas_tenant_slug', res.tenant.slug);
        }
      } else {
        setError(res.error || 'فشل التسجيل، يرجى مراجعة البيانات');
      }
    } catch (err) {
      setError(err.message || 'فشل الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAndLaunch = () => {
    if (onSuccess && registrationResult) {
      onSuccess(registrationResult);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-['Cairo',sans-serif]" dir="rtl">
      <div className="bg-white border border-zinc-200/90 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative text-right text-zinc-900 animate-fade-in max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 bg-zinc-50/80 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-black shadow-xs">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-950 leading-tight">
                ابدأ التجربة المجانية (14 يوماً مجاناً)
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">بدون بطاقة ائتمان • تفعيل فوري لمنظومة شركتك</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200/80 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">

          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: COMPANY & SUBDOMAIN & LOGO & PLAN */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>اسم الشركة أو المؤسسة:</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: شركة الأهرام للمقاولات، عيادات الشروق..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-950 text-sm text-zinc-950 p-3 rounded-xl outline-none transition-all placeholder:text-zinc-400 font-medium"
                  autoFocus
                  required
                />
              </div>

              {/* Company Logo Upload */}
              <div>
                <label className="block text-zinc-700 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>شعار الشركة (اللوجو):</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">اختياري (يمكن إضافته لاحقاً)</span>
                </label>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="شعار الشركة" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs cursor-pointer border border-zinc-200 transition-all">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{logoUrl ? 'تغيير الشعار' : 'رفع لوجو الشركة'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="mr-2 text-[11px] text-rose-500 hover:text-rose-700 underline font-medium cursor-pointer"
                      >
                        حذف
                      </button>
                    )}
                    <p className="text-[10px] text-zinc-400 mt-1">
                      سيظهر اللوجو كأيقونة رسمية للبرنامج وعنوان المتصفح
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Preview of App Title & Branding */}
              {companyName && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 block">معاينة اسم وأيقونة التطبيق:</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                    <div className="w-5 h-5 rounded bg-zinc-900 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                      <img src={logoUrl || '/brand/logo.svg'} alt="" className="w-full h-full object-contain" />
                    </div>
                    <span>{companyName.trim()} - Office Attendance</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الرابط الفرعي المخصص لشركتك (Subdomain):</span>
                </label>
                <div className="relative flex items-center" dir="ltr">
                  <input
                    type="text"
                    placeholder="my-company"
                    value={slug}
                    onChange={handleSlugChange}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-950 text-sm text-zinc-950 font-mono p-3 pr-32 rounded-xl outline-none transition-all"
                    required
                  />
                  <span className="absolute right-3 text-xs text-zinc-400 font-mono pointer-events-none">
                    .attendance.app
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal" dir="rtl">
                  هذا هو الرابط الحصري الذي سيستخدمه موظفوك ومديرو فروعك لتسجيل الحضور.
                </p>
              </div>

              {/* Plan Picker */}
              <div>
                <label className="block text-zinc-700 font-bold mb-1.5">
                  اختر الباقة التجريبية للبدء:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'starter', name: 'الانطلاق', price: '349 ج.م', cap: '15 موظف • فرع 1' },
                    { id: 'growth', name: 'النمو ⭐️', price: '849 ج.م', cap: '50 موظف • 5 فروع' },
                    { id: 'enterprise', name: 'المؤسسات', price: '1,599 ج.م', cap: '100 موظف • غير محدود' },
                  ].map(p => (
                    <div
                      key={p.id}
                      onClick={() => setPlan(p.id)}
                      className={`p-3 rounded-2xl border cursor-pointer text-center transition-all ${
                        plan === p.id
                          ? 'bg-zinc-950 border-zinc-950 text-white shadow-md'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100/80'
                      }`}
                    >
                      <div className={`font-black text-xs ${plan === p.id ? 'text-white' : 'text-zinc-900'}`}>{p.name}</div>
                      <div className={`text-[11px] font-bold font-mono mt-0.5 ${plan === p.id ? 'text-emerald-400' : 'text-emerald-600'}`}>{p.price}</div>
                      <div className={`text-[9px] mt-0.5 ${plan === p.id ? 'text-zinc-300' : 'text-zinc-500'}`}>{p.cap}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>المتابعة إلى بيانات الحساب</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </form>
          )}

          {/* STEP 2: ADMIN CREDENTIALS */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={logoUrl || '/brand/logo.svg'} alt="" className="w-full h-full object-contain p-0.5" />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 text-xs">{companyName}</div>
                    <div className="text-[11px] text-emerald-700 font-mono font-bold" dir="ltr">{slug}.attendance.app</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer font-bold"
                >
                  تعديل
                </button>
              </div>

              <div>
                <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>اسمك بالكامل (المدير العام):</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: م. أحمد خليل"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-950 text-sm text-zinc-950 p-3 rounded-xl outline-none transition-all placeholder:text-zinc-400 font-medium"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>رقم الهاتف (اسم المستخدم لتسجيل الدخول):</span>
                </label>
                <input
                  type="tel"
                  placeholder="مثال: 01012345678"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-950 text-sm text-zinc-950 font-mono p-3 rounded-xl outline-none transition-all"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>كلمة المرور:</span>
                </label>
                <input
                  type="password"
                  placeholder="أدخل كلمة مرور قوية..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-950 text-sm text-zinc-950 p-3 rounded-xl outline-none transition-all"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'جاري تهيئة منظومتك...' : 'تفعيل الحساب والبدء فوراً'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS & LAUNCH */}
          {step === 3 && registrationResult && (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-500 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-black text-zinc-950">ألف مبروك! تم إنشاء منظومتك بنجاح 🎉</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  تم تفعيل فترة تجريبية مجانية لمدة 14 يوماً لشركة: <b className="text-zinc-900">{companyName}</b>
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl text-xs space-y-2.5 text-right">
                <div className="flex justify-between items-center border-b border-zinc-200/80 pb-2">
                  <span className="text-zinc-500">اسم وهوية التطبيق:</span>
                  <div className="flex items-center gap-2 font-bold text-zinc-900">
                    <img src={logoUrl || '/brand/logo.svg'} alt="" className="w-4 h-4 object-contain" />
                    <span>{companyName} - Office Attendance</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-200/80 pb-2">
                  <span className="text-zinc-500">الرابط المخصص لشركتك:</span>
                  <span className="font-mono text-emerald-700 font-bold" dir="ltr">
                    {registrationResult.tenant.slug}.attendance.app
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-200/80 pb-2">
                  <span className="text-zinc-500">رقم الدخول (اسم المستخدم):</span>
                  <span className="font-mono text-zinc-900 font-bold" dir="ltr">{adminPhone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">الصلاحيات:</span>
                  <span className="text-emerald-700 font-bold">المدير التنفيذي (Super Admin)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteAndLaunch}
                className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                دخول لوحة التحكم والبدء في إضافة الموظفين والفروع 🚀
              </button>
            </div>
          )}

        </div>

        {/* Footer Guarantee */}
        <div className="p-3.5 bg-zinc-50 border-t border-zinc-100 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>بياناتك مؤمنة بالكامل بتشفير SSL • لا يلزم إدخال فيزا أو بطاقة بنكية</span>
        </div>

      </div>
    </div>
  );
}
