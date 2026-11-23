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
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';

export function CompanyRegistrationModal({ isOpen, onClose, onSuccess, initialPlan = 'growth' }) {
  const [step, setStep] = useState(1); // 1: Company details & plan, 2: Admin credentials, 3: Success
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
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
        plan,
        adminName: adminName.trim() || 'المدير العام',
        adminPhone: adminPhone.trim(),
        adminPassword: adminPassword.trim()
      });

      if (res.success) {
        setRegistrationResult(res);
        setStep(3);

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-['Cairo',sans-serif]" dir="rtl">
      <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative text-right text-zinc-100 animate-fade-in">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-gradient-to-b from-zinc-850 to-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-amber-400 leading-tight">
                ابدأ التجربة المجانية (14 يوماً مجاناً)
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">بدون بطاقة ائتمان • تفعيل فوري لمنظومة شركتك</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">

          {error && (
            <div className="bg-red-950/60 border border-red-800 p-3 rounded-2xl text-xs text-red-300 font-bold flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: COMPANY & SUBDOMAIN & PLAN */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>اسم الشركة أو المؤسسة:</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: شركة الأهرام للمقاولات، عيادات الشروق..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-sm text-white p-3 rounded-xl outline-none transition-colors"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>الرابط الفرعي المخصص لشركتك (Subdomain):</span>
                </label>
                <div className="relative flex items-center" dir="ltr">
                  <input
                    type="text"
                    placeholder="my-company"
                    value={slug}
                    onChange={handleSlugChange}
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-sm text-amber-400 font-mono p-3 pr-32 rounded-xl outline-none"
                    required
                  />
                  <span className="absolute right-3 text-xs text-zinc-500 font-mono pointer-events-none">
                    .attendance.app
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal" dir="rtl">
                  هذا هو الرابط الحصري الذي سيستخدمه موظفوك ومديرو فروعك لتسجيل الحضور.
                </p>
              </div>

              {/* Plan Picker */}
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">
                  اختر الباقة التجريبية للبدء:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'starter', name: 'البداية', price: '1,000 ج.م', cap: '15 موظف' },
                    { id: 'growth', name: 'النمو 🌟', price: '3,000 ج.م', cap: '50 موظف' },
                    { id: 'enterprise', name: 'المؤسسات', price: '5,000 ج.م', cap: '120 موظف' },
                  ].map(p => (
                    <div
                      key={p.id}
                      onClick={() => setPlan(p.id)}
                      className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                        plan === p.id
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-sm'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-black text-xs text-white">{p.name}</div>
                      <div className="text-[10px] text-amber-400 font-bold font-mono mt-0.5">{p.price}</div>
                      <div className="text-[9px] text-zinc-500 mt-0.5">{p.cap}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
              >
                <span>المتابعة إلى بيانات الحساب</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </form>
          )}

          {/* STEP 2: ADMIN CREDENTIALS */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">{companyName}</div>
                  <div className="text-[10px] text-amber-400 font-mono" dir="ltr">{slug}.attendance.app</div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-zinc-400 hover:text-white underline"
                >
                  تعديل
                </button>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>اسمك بالكامل (المدير العام):</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: م. أحمد خليل"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-sm text-white p-3 rounded-xl outline-none"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>رقم الهاتف (اسم المستخدم لتسجيل الدخول):</span>
                </label>
                <input
                  type="tel"
                  placeholder="مثال: 01012345678"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-sm text-white font-mono p-3 rounded-xl outline-none"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>كلمة المرور:</span>
                </label>
                <input
                  type="password"
                  placeholder="أدخل كلمة مرور قوية..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 text-sm text-white p-3 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl"
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'جاري تهيئة منظومتك...' : 'تفعيل الحساب والبدء فوراً 🚀'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS & LAUNCH */}
          {step === 3 && registrationResult && (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-black text-white">ألف مبروك! تم إنشاء منظومتك بنجاح 🎉</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  تم تفعيل فترة تجريبية مجانية لمدة 14 يوماً لشركة: <b className="text-amber-400">{companyName}</b>
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs space-y-2 text-right">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">الرابط المخصص لشركتك:</span>
                  <span className="font-mono text-amber-400 font-bold" dir="ltr">
                    {registrationResult.tenant.slug}.attendance.app
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">رقم الدخول (اسم المستخدم):</span>
                  <span className="font-mono text-white font-bold" dir="ltr">{adminPhone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">الصلاحيات:</span>
                  <span className="text-emerald-400 font-bold">المدير التنفيذي (Super Admin)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteAndLaunch}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm rounded-xl shadow-xl transition-all active:scale-[0.98]"
              >
                دخول لوحة التحكم والبدء في إضافة الموظفين والفروع 🚀
              </button>
            </div>
          )}

        </div>

        {/* Footer Guarantee */}
        <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>بياناتك مؤمنة بالكامل بتشفير SSL • لا يلزم إدخال فيزا أو بطاقة بنكية</span>
        </div>

      </div>
    </div>
  );
}
