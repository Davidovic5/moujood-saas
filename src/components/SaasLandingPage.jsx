import React, { useState } from 'react';
import { 
  MapPin, 
  Shield, 
  Smartphone, 
  Clock, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowLeft, 
  Building2, 
  Users, 
  HelpCircle, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  CreditCard,
  Zap,
  Lock,
  PhoneCall
} from 'lucide-react';

export function SaasLandingPage({ onOpenRegister, onOpenGodMode, onGoToTenantLogin, onSandboxLogin }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [employeeCountSlider, setEmployeeCountSlider] = useState(25);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const handleSandboxClick = async () => {
    setSandboxLoading(true);
    try {
      const res = await api.sandboxLogin();
      if (res.success && onSandboxLogin) {
        onSandboxLogin(res);
      } else {
        alert(res.error || 'تعذر تشغيل وضع التجربة الحية');
      }
    } catch (e) {
      alert('خطأ أثناء تشغيل وضع التجربة');
    } finally {
      setSandboxLoading(false);
    }
  };

  // Pricing definitions (1000, 3000, 5000 EGP)
  const plans = [
    {
      id: 'starter',
      name: 'باقة البداية',
      tagline: 'مثالية للعيادات، الصيدليات والمكاتب الصغيرة',
      priceMonthly: 1000,
      priceYearly: 10000, // 2 months free
      badge: '',
      popular: false,
      features: [
        'حتى 15 موظف مسجل',
        'فرع واحد بنطاق جغرافي GPS',
        'تسجيل الحضور بالبصمة والوجه',
        'ربط جهاز واحد معتمد لكل موظف',
        'قفل الانصراف للـ 8 ساعات',
        'نظام طلبات الإجازات والأذونات',
        'تصدير كشف الحضور لـ Excel بضغطة زر',
        'دعم فني عبر الواتساب'
      ]
    },
    {
      id: 'growth',
      name: 'باقة النمو',
      tagline: 'الخيار الأفضل للشركات المتوسطة وسلاسل المتاجر والمطاعم',
      priceMonthly: 3000,
      priceYearly: 30000, // 2 months free
      badge: 'الأكثر طلباً 🌟',
      popular: true,
      features: [
        'حتى 50 موظف مسجل',
        'حتى 3 فروع جغرافية منفصلة',
        'كل مميزات باقة البداية بالكامل',
        'لوحة متابعة الحضور الحي لكل فرع',
        'نظام صلاحيات متعدد المستويات (RBAC)',
        'تخصيص ألوان وشعار شركتك',
        'تنبيهات فورية للمديرين',
        'دعم فني وتدريب أونلاين مباشر'
      ]
    },
    {
      id: 'enterprise',
      name: 'باقة المؤسسات',
      tagline: 'للشركات الكبرى والمصانع وسلاسل الفروع المتعددة',
      priceMonthly: 5000,
      priceYearly: 50000, // 2 months free
      badge: 'للمؤسسات الكبرى',
      popular: false,
      features: [
        'حتى 120 موظف مسجل',
        'فروع غير محدودة في جميع المحافظات',
        'كل مميزات باقة النمو بالكامل',
        'تصدير مخصص للرواتب متوافق مع البنوك',
        'تعديل حدود الـ GPS لكل فرع على حدة',
        'مدير حساب مخصص (VIP Support)',
        'سيرفرات فائقة السرعة وأولوية معالجة',
        'ضمان تشغيل بنسبة 99.9%'
      ]
    }
  ];

  // FAQs
  const faqs = [
    {
      q: 'هل أحتاج لشراء جهاز بصمة أو أسلاك أو راوتر مخصص؟',
      a: 'نهائياً! المنظومة تعمل بالكامل سحابياً من هواتف الموظفين الذكية (آيفون وأندرويد). لن تتكلف جنيهاً واحداً في شراء أو صيانة أي أجهزة بصمة أو بطاقات بلاستيكية.'
    },
    {
      q: 'كيف يمنع النظام تلاعب الموظفين أو تسجيل الحضور لبعضهم؟',
      a: 'المنظومة محمية بـ 3 طبقات أمان صارمة: أولاً، التحقق من التواجد الفعلي داخل محيط الفرع بالـ GPS. ثانياً، قفل الحساب على جهاز واحد معتمد فقط لكل موظف (مستحيل فتح الحساب من هاتف زميل). ثالثاً، دعم بصمة الوجه (Face ID) عبر تقنية WebAuthn العالمية.'
    },
    {
      q: 'كيف يعمل الدفع عبر تطبيق إنستاباي (InstaPay)؟',
      a: 'بكل سهولة وبدون أي عمولات بنكية! تختار الباقة بعد انتهاء الـ 14 يوم تجربة مجانية، فيظهر لك كود الحساب أو رقم التحويل، تحول من تطبيقك في ثانية، ويتم تفعيل باقتك فورياً.'
    },
    {
      q: 'هل يمكنني استخراج كشوف المرتبات والخصومات لـ Excel؟',
      a: 'نعم، بضغطة زر واحدة! كشف الحضور الشهري يصدر كاملاً بصيغة Excel (.xlsx / .csv) باللغة العربية السليمة مع حساب ساعات التأخير، الأذونات، والغياب لكل موظف بدقة.'
    },
    {
      q: 'كم يستغرق إعداد المنظومة وتشغيلها لشركتي؟',
      a: 'أقل من 3 دقائق! بمجرد كتابة اسم شركتك واختيار الرابط، تصبح منظومتك جاهزة فوراً، ويمكنك إضافة موظفيك وفروعك وبدء تسجيل الحضور في نفس اللحظة.'
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-['Cairo',sans-serif] selection:bg-amber-500 selection:text-black" dir="rtl">
      
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <MapPin className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-sm font-black text-amber-400 leading-tight block">موجود • Moujood</span>
              <span className="text-[10px] text-zinc-400 font-bold block">موچود.. موظفك في مكانه بالـ GPS وبدون أجهزة بصمة</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSandboxClick}
              disabled={sandboxLoading}
              className="text-xs bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 px-3.5 py-2 rounded-xl border border-purple-800 transition-colors font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{sandboxLoading ? 'جاري الفتح...' : 'تجربة حية فورية ⚡'}</span>
            </button>

            {onGoToTenantLogin && (
              <button
                onClick={onGoToTenantLogin}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3.5 py-2 rounded-xl border border-zinc-800 transition-colors font-bold"
              >
                دخول شركتي 🏢
              </button>
            )}

            <button
              onClick={() => onOpenRegister('growth')}
              className="text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-[0.98]"
            >
              جرب مجاناً (14 يوم) 🚀
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,184,0,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs text-amber-300 font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>موچود.. موظفك في مكانه بالـ GPS وبدون أجهزة بصمة</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.2] tracking-tight">
            سجل حضور موظفيك بالـ <span className="text-amber-400 underline decoration-amber-500/50">GPS وبصمة الوجه</span><br />
            من هواتفهم مباشرة وبأعلى دقة 📍
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-zinc-300 max-w-3xl mx-auto leading-relaxed">
            المنظومة السحابية الذكية لإدارة حضور وانصراف الشركات وسلاسل الفروع. لا تتطلب أي أجهزة مكلفة، مع قفل صارم لوردية الـ 8 ساعات، جهاز واحد معتمد لكل موظف، وإدارة أذونات وإجازات في ثوانٍ.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onOpenRegister('growth')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-base rounded-2xl shadow-xl shadow-amber-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>ابدأ التجربة المجانية لشركتك (14 يوم)</span>
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleSandboxClick}
              disabled={sandboxLoading}
              className="w-full sm:w-auto px-6 py-4 bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 border border-purple-800/80 font-black text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950/30"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{sandboxLoading ? 'جاري تهيئة التجربة الحية...' : 'جرّب الداشبورد فوراً بدون تسجيل (Sandbox) ⚡'}</span>
            </button>

            <a
              href="#pricing"
              className="w-full sm:w-auto px-5 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>الأسعار والدفع بـ InstaPay</span>
            </a>
          </div>

          {/* Feature Highlights Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-xs text-zinc-400">
            <div className="flex items-center justify-center gap-2 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>بدون أي أجهزة أو أسلاك</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>آيفون وأندرويد (PWA)</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>قفل جهاز الموظف (Anti-Cheat)</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>دفع إنستاباي مريح وبدون رسوم</span>
            </div>
          </div>

        </div>
      </section>

      {/* COMPARISON: Traditional Fingerprint vs Smart Attendance */}
      <section className="py-16 px-4 sm:px-6 bg-zinc-900/40 border-y border-zinc-800/80">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs text-amber-400 font-black tracking-wider uppercase">المقارنة الحاسمة</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">لماذا تتخلى كبرى الشركات عن أجهزة البصمة التقليدية؟</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Old Way */}
            <div className="bg-zinc-950 border border-red-900/40 p-6 rounded-3xl space-y-4 shadow-lg">
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-900">
                <div className="p-2 bg-red-950 text-red-400 rounded-xl">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">أجهزة البصمة التقليدية (الصينية)</h3>
                  <span className="text-xs text-red-400 font-bold">مكلفة، معطوبة دائماً، وسهلة التحايل</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-zinc-400 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold text-sm">✕</span>
                  <span>تكلفة شراء باهظة (4,000 إلى 8,000 ج.م لكل جهاز) غير مصاريف الفنيين والصيانة.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold text-sm">✕</span>
                  <span>طوابير الموظفين الصباحية وتعطل قارئ الأصابع مع الرطوبة أو الأوساخ.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold text-sm">✕</span>
                  <span>تلاعب الموظفين بتبادل الكروت أو التوقيع الورقي عند عطل الجهاز.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold text-sm">✕</span>
                  <span>سحب البيانات بفلاشة يدوية وضياع السجلات عند انقطاع الكهرباء.</span>
                </li>
              </ul>
            </div>

            {/* Smart SaaS Way */}
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/40 p-6 rounded-3xl space-y-4 shadow-xl relative">
              <div className="absolute -top-3 left-6 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-md">
                الجيل الحديث ⚡
              </div>

              <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-amber-400 text-base">منظومة الحضور الذكي بالـ GPS</h3>
                  <span className="text-xs text-emerald-400 font-bold">صفر تكاليف أجهزة • دقة 100% • تحكم كامل</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold text-sm">✓</span>
                  <span><b>حساب جغرافي دقيق بالـ GPS:</b> لا يمكن البصمة إلا والموظف داخل نطاق الفرع الفعلي بالأمتار.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold text-sm">✓</span>
                  <span><b>ربط الجهاز الوحيد (Device Lock):</b> حساب الموظف مقفل على هاتفه الشخصي، مستحيل حد يبصم لزميله!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold text-sm">✓</span>
                  <span><b>قفل الـ 8 ساعات الصارم:</b> عداد تنازلي وساعات عمل حقيقية تمنع الانصراف المبكر بدون إذن.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold text-sm">✓</span>
                  <span><b>تصدير فوري لكشوف المرتبات لـ Excel:</b> تقارير دقيقة جاهزة لحساب الساعات الإضافية والخصومات.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <span className="text-xs text-amber-400 font-black tracking-wider uppercase">إمكانيات لا محدودة</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">كل ما تحتاجه لإدارة حضور شركتك وفروعك في مكان واحد</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-base">النطاق الجغرافي بالـ GPS</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                حدد موقع كل فرع من فروعك على الخريطة وحدد نصف قطر السماح (مثلاً 100م). إذا كان الموظف خارج النطاق بـ 5 أمتار، يرفض النظام التسجيل فوراً.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-base">قفل الانصراف للـ 8 ساعات</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                زر الانصراف مغلق ومحمي تماماً، ويظهر للموظف عداد حي لساعات العمل. لا يُفتح زر الانصراف إلا بعد إتمام ورديته بالكامل أو بطلب إذن رسمي معتمد.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-base">حماية الجهاز الواحد (Anti-Cheat)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                يتم قفل حساب الموظف على المعرف الفرعي لهاتفه الشخصي في أول تسجيل. لا يمكنه تسجيل الدخول من هاتف آخر بدون مراجعة الإدارة لفك الارتباط.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-base">أذونات الساعتين والإجازات</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                نظام آلي متكامل لإدارة رصيد الإجازات السنوية، وطلب أذونات الساعتين (صباحي / مسائي)، مع اعتماد فوري من مديري الفروع ومنع الطلب في أيام العطلات.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-base">لوحة التواجد الحي في الفرع</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                تعرف في أي ثانية من المتواجد في مكتبك الآن مع توقيت الحضور، ومن في إجازة مرضية أو اعتيادية، ومن غائب بدون عذر مع زر للاتصال المباشر به.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-black text-white text-base">تصدير إكسل عربي منسق</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                تصدير كافة تقارير وسجلات الشهر إلى ملف Excel جاهز باللغة العربية السليمة بنظام UTF-8 BOM لحساب الرواتب والبدلات في ثوانٍ.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-zinc-900/30 border-t border-zinc-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-xs text-amber-400 font-black tracking-wider uppercase">باقات شفافة وعادلة</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">اختر الباقة المناسبة لحجم شركتك</h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              ابدأ الآن بـ 14 يوماً مجاناً بدون أي التزام أو دفع مسبق. يمكنك الترقية أو تغيير الباقة في أي وقت عبر تطبيق إنستاباي.
            </p>

            {/* Monthly / Yearly Switcher */}
            <div className="inline-flex items-center gap-1 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 text-xs font-bold mt-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-amber-500 text-black shadow-md font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                الدفع الشهري
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-amber-500 text-black shadow-md font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>الدفع السنوي</span>
                <span className="bg-emerald-500 text-black text-[10px] px-2 py-0.2 rounded-full font-black">
                  وفر شهرين مجاناً 🎁
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((p) => {
              const price = billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly;
              const perMonthEffective = billingCycle === 'yearly' ? Math.round(p.priceYearly / 12) : p.priceMonthly;

              return (
                <div
                  key={p.id}
                  className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                    p.popular
                      ? 'bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-amber-500 shadow-2xl shadow-amber-500/10'
                      : 'bg-zinc-900/70 border border-zinc-800'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black px-4 py-1 rounded-full shadow-md">
                      {p.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-white">{p.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{p.tagline}</p>
                    </div>

                    {/* Price */}
                    <div className="py-2 border-y border-zinc-800">
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-3xl sm:text-4xl font-black text-amber-400">
                          {price.toLocaleString('ar-EG')}
                        </span>
                        <span className="text-xs text-zinc-400 font-bold font-sans">
                          ج.م / {billingCycle === 'yearly' ? 'سنة كاملة' : 'شهرياً'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <div className="text-[11px] text-emerald-400 font-bold mt-1">
                          يعادل {perMonthEffective.toLocaleString('ar-EG')} ج.م / شهرياً فقط!
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 text-xs text-zinc-300">
                      {p.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => onOpenRegister(p.id)}
                      className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 ${
                        p.popular
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-500/25'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      <span>ابدأ التجربة المجانية (14 يوم)</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center mt-2">لا يلزم إدخال بطاقة بنكية</p>
                  </div>

                </div>
              );
            })}
          </div>

          {/* InstaPay Payment Guarantee Badge */}
          <div className="bg-zinc-950 border border-purple-900/40 p-6 rounded-3xl max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right shadow-xl shadow-purple-950/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-white text-sm">الدفع السريع والمباشر عبر InstaPay</h4>
                <p className="text-xs text-zinc-400 mt-0.5">تحويل فوري وآمن بدون عمولات بنكية من أي بنك أو محفظة في مصر مع تفعيل فوري لمنظومتك.</p>
              </div>
            </div>
            <a
              href="https://ipn.eg/S/davidovic/instapay/3BW08C"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/30 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>تحويل إنستاباي مباشر ⚡</span>
            </a>
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs text-amber-400 font-black tracking-wider uppercase">الأسئلة الشائعة</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">كل ما يدور بذهنك حول المنظومة</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-amber-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER & CTA */}
      <footer className="mt-auto bg-zinc-950 border-t border-zinc-800/80 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-white">موجود • Moujood SaaS</div>
              <div className="text-[11px] text-zinc-500">موچود.. موظفك في مكانه بالـ GPS وبدون أجهزة بصمة</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-400 font-bold">
            <button
              onClick={() => onOpenRegister('growth')}
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              تسجيل شركة جديدة
            </button>
            <span>•</span>
            <a href="#pricing" className="hover:text-white transition-colors">
              الأسعار
            </a>
            <span>•</span>
            {onOpenGodMode && (
              <button
                onClick={onOpenGodMode}
                className="hover:text-amber-400 transition-colors flex items-center gap-1"
                title="لوحة تحكم صاحب المنصة"
              >
                <span>👑 الإدارة العليا (God Mode)</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-zinc-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()} • جاهز للعمل والتسليم
          </div>

        </div>
      </footer>

    </div>
  );
}
