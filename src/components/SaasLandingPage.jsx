import React, { useState } from 'react';
import { 
  MapPin, 
  Shield, 
  Smartphone, 
  Clock, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Building2, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Lock, 
  Check, 
  Zap, 
  PhoneCall, 
  Compass, 
  Activity, 
  ScanFace, 
  Fingerprint, 
  Layers, 
  ArrowUpRight,
  TrendingUp,
  Download,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../api';

export function SaasLandingPage({ onOpenRegister, onOpenGodMode, onGoToTenantLogin, onSandboxLogin }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [activeTelemetryTab, setActiveTelemetryTab] = useState('radar'); // 'radar' | 'security' | 'shifts' | 'payroll'
  
  // Interactive ROI Calculator State
  const [employeeCount, setEmployeeCount] = useState(25);
  const [branchesCount, setBranchesCount] = useState(2);

  // ROI Calculations based on Egyptian market averages
  // Traditional hardware cost: ~5,500 EGP per biometric device + 1,500 EGP/year maintenance
  const hardwareCostPerBranch = 5500;
  const hardwareAnnualMaintenance = 1500;
  const totalHardwareYearOne = (branchesCount * hardwareCostPerBranch) + (branchesCount * hardwareAnnualMaintenance);
  
  // Buddy punching & tardiness leakage: ~25 mins lost per employee/month = ~220 EGP lost per employee/month
  const monthlyLeakagePerEmployee = 220;
  const annualLeakage = employeeCount * monthlyLeakagePerEmployee * 12;
  
  // Moujood cost (Growth tier 849/mo = 8490/yr)
  const moujoodAnnualCost = employeeCount <= 15 ? 3490 : employeeCount <= 50 ? 8490 : 15990;
  const netAnnualSavings = Math.max(0, (totalHardwareYearOne + annualLeakage) - moujoodAnnualCost);

  const handleSandboxClick = async () => {
    setSandboxLoading(true);
    try {
      if (api && api.sandboxLogin) {
        const res = await api.sandboxLogin();
        if (res.success && onSandboxLogin) {
          onSandboxLogin(res);
        } else {
          alert(res.error || 'تعذر تشغيل وضع التجربة الحية');
        }
      } else {
        alert('ميزة التجربة الحية متاحة فوراً');
      }
    } catch (e) {
      alert('خطأ أثناء تشغيل وضع التجربة الحية');
    } finally {
      setSandboxLoading(false);
    }
  };

  const plans = [
    {
      id: 'starter',
      name: 'باقة الانطلاق',
      subtitle: 'مثالية للشركات الناشئة، المكاتب الفردية والعيادات',
      priceMonthly: 349,
      priceYearly: 3490, // 2 months free
      badge: null,
      popular: false,
      recommended: false,
      pills: ['15 موظف مسجل', 'فرع واحد GPS', 'قفل الجهاز'],
      features: [
        'تسجيل الحضور بالـ GPS وبصمة الوجه',
        'تأمين الجهاز المعتمد لكل موظف (Device Lock)',
        'قفل وردية الـ 8 ساعات ومنع الانصراف المبكر',
        'نظام طلبات الإجازات والأذونات الساعية',
        'تصدير كشف الحضور لـ Excel بضغطة زر',
        'تثبيت فوري خفيف جداً على iPhone & Android',
        'دعم فني عبر الواتساب'
      ]
    },
    {
      id: 'growth',
      name: 'باقة النمو',
      subtitle: 'الخيار الأفضل للشركات المتوسطة وسلاسل الفروع والمتاجر',
      priceMonthly: 849,
      priceYearly: 8490, // 2 months free
      badge: 'الأكثر طلباً للشركات ⭐️',
      popular: true,
      recommended: true,
      pills: ['50 موظف مسجل', 'حتى 5 فروع جغرافية', 'متابعة حية للمديرين'],
      features: [
        'كل ما في باقة الانطلاق بالكامل',
        'رادار التواجد الميداني الحي لكل فرع لحظياً',
        'نظام صلاحيات إدارية متعدد المستويات (RBAC)',
        'إدارة مأموريات العمل والزيارات الخارجية',
        'تخصيص الهوية وشعار شركتك على النظام',
        'تنبيهات فورية للمديرين عند التأخير أو الغياب',
        'جلسة إعداد وتدريب مباشرة لفريق الإدارة'
      ]
    },
    {
      id: 'enterprise',
      name: 'باقة المؤسسات',
      subtitle: 'للشركات الكبرى، المصانع وسلاسل التوزيع المتعددة',
      priceMonthly: 1599,
      priceYearly: 15990, // 2 months free
      badge: 'للمؤسسات والشركات الكبرى',
      popular: false,
      recommended: false,
      pills: ['100 موظف مسجل', 'فروع غير محدودة', 'تصدير رواتب متقدم'],
      features: [
        'كل ما في باقة النمو بالكامل',
        'فروع جغرافية غير محدودة في جميع المحافظات',
        'تصدير مسير رواتب مخصص متوافق مع البنوك وأنظمة ERP',
        'خزينة وثائق الموظفين المشفرة (HR Vault)',
        'تعديل حدود الـ GPS ومؤشرات التسامح لكل فرع',
        'مدير حساب خاص وأولوية معالجة فورية (VIP)',
        'ضمان تشغيل بنسبة 99.9% (SLA)'
      ]
    }
  ];

  const faqs = [
    {
      q: 'هل أحتاج لشراء جهاز بصمة صيني أو أسلاك شبكات وتوصيلات؟',
      a: 'نهائياً! منظومة «موجود» تلغي أجهزة البصمة تماماً وتعتمد بنسبة 100% على هواتف الموظفين الذكية (آيفون وأندرويد). بدون أسلاك، بدون فنيين صيانة، وبدون طوابير أمام جهاز معطوب.'
    },
    {
      q: 'كيف يمنع النظام تحايل الموظفين أو البصمة من المنازل عبر برامج Fake GPS؟',
      a: 'المنظومة محمية بـ 3 طبقات ردع صارمة: 1) فحص الأقمار الصناعية عالي الدقة (GPS Satellite Geofencing) المباشر من هاتف الموظف. 2) كشف وتجريم برامج الموقع الوهمي (Mock Location Injections). 3) قفل حساب الموظف على معرّف عتاد هاتفه الشخصي (Hardware Fingerprint Lock)، مستحيل موظف يبصم لزميله أو يفتح حسابه من جهاز آخر.'
    },
    {
      q: 'كيف يتم سداد الاشتراك عبر تطبيق إنستاباي (InstaPay)؟',
      a: 'بكل بساطة وبدون أي عمولات أو بطاقات ائتمانية. بعد تجربة المنظومة مجاناً لمدة 14 يوماً، يمكنك تحويل قيمة الاشتراك السنوي أو الشهري مباشرة عبر إنستاباي (InstaPay IPN) إلى حساب الإدارة، ويتم تفعيل حساب شركتك فورياً.'
    },
    {
      q: 'هل يمكن استخراج كشوف الحضور والرواتب لبرنامج Excel؟',
      a: 'نعم بنقرة زر واحدة! الكشوف تصدر بصيغة Excel (.xlsx / .csv) منسقة باللغة العربية مع مراعاة ترميز UTF-8 الصحيح، شاملة حساب ساعات العمل، الإضافي (Overtime)، التأخيرات، والغياب التلقائي.'
    },
    {
      q: 'كم يستغرق إعداد النظام وبدء تسجيل حضور شركتنا؟',
      a: 'أقل من دقيقتين! تسجل اسم شركتك ورابطها الخاص، تضيف فروعك على الخريطة، وترسل رابط التفعيل لموظفيك لبدء تسجيل الحضور في نفس اليوم.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 flex flex-col font-['Cairo',sans-serif] selection:bg-emerald-500 selection:text-white antialiased" dir="rtl">
      
      {/* ================= CLEAN LIGHT HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-8 py-3.5 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-black shadow-sm group">
              <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center text-zinc-950 font-black text-xs">
                <MapPin className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-zinc-950">موجود</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  MOUJOOD
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-medium block">
                حضور وانصراف ذكي بالـ GPS والتحقق البيومتري
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSandboxClick}
              disabled={sandboxLoading}
              className="text-xs px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="دخول فوري لتجربة الداشبورد"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{sandboxLoading ? 'جاري الفتح...' : 'تجربة حية (Sandbox)'}</span>
              <span className="sm:hidden">{sandboxLoading ? '...' : 'تجربة'}</span>
            </button>

            {onGoToTenantLogin && (
              <button
                onClick={onGoToTenantLogin}
                className="text-xs px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>دخول شركتي</span>
              </button>
            )}

            <button
              onClick={() => onOpenRegister('growth')}
              className="text-xs font-black px-4 sm:px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>ابدأ التجربة المجانية</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="pt-14 sm:pt-20 pb-16 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>الجيل السحابي الأحدث: وداعاً لأعطال وتكاليف أجهزة البصمة</span>
            <span className="text-emerald-300">|</span>
            <span className="font-mono text-[11px] text-emerald-700">بدقة GPS ±3 متر</span>
          </div>

          {/* Main Title */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-950 tracking-tight leading-[1.2]">
              سجل حضور موظفيك وفروعك<br />
              <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-8">
                بالـ GPS وبصمة الوجه
              </span>
              {' '}مباشرة من هواتفهم
            </h1>
            <p className="text-sm sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed font-normal">
              المنظومة السحابية الذكية لإدارة حضور وانصراف الشركات وسلاسل الفروع. لا تتطلب أي أجهزة مكلفة، مع قفل صارم لوردية الـ 8 ساعات، جهاز واحد معتمد لكل موظف، وإدارة أذونات وإجازات في ثوانٍ.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => onOpenRegister('growth')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm sm:text-base shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>سجل شركتك الآن (14 يوم تجربة مجانية)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleSandboxClick}
              disabled={sandboxLoading}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>{sandboxLoading ? 'جاري تحضير البيئة...' : 'جرّب الداشبورد الحية (Sandbox)'}</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-zinc-600 font-semibold">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>صفر أجهزة بصمة أو أسلاك</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>قفل الهاتف (Device Anti-Cheat)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تثبيت فوري على iPhone & Android</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>دفع InstaPay بدون عمولات</span>
            </div>
          </div>

          {/* ================= INTERACTIVE TELEMETRY CARD (LIGHT MODE) ================= */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="rounded-3xl bg-white border border-zinc-200/90 shadow-xl overflow-hidden text-right">
              
              {/* Card Header & Tabs */}
              <div className="bg-zinc-50/80 border-b border-zinc-200 p-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-mono font-bold text-zinc-700">moujood-core / telemetry-feed</span>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-zinc-200 shadow-2xs w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setActiveTelemetryTab('radar')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTelemetryTab === 'radar'
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    رادار الفروع
                  </button>
                  <button
                    onClick={() => setActiveTelemetryTab('security')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTelemetryTab === 'security'
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    درع الأجهزة
                  </button>
                  <button
                    onClick={() => setActiveTelemetryTab('shifts')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTelemetryTab === 'shifts'
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    وردية الـ 8 ساعات
                  </button>
                  <button
                    onClick={() => setActiveTelemetryTab('payroll')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      activeTelemetryTab === 'payroll'
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    كشف الرواتب
                  </button>
                </div>
              </div>

              {/* Dynamic Content */}
              <div className="p-5 sm:p-6 bg-white">
                {activeTelemetryTab === 'radar' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80 space-y-1">
                        <span className="text-[11px] text-zinc-500 font-bold block">دقة الأقمار الصناعية (GPS)</span>
                        <span className="text-xl font-black font-mono text-emerald-600">± 2.4 متر</span>
                      </div>
                      <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80 space-y-1">
                        <span className="text-[11px] text-zinc-500 font-bold block">مانع التزييف (Anti-Mock)</span>
                        <span className="text-xl font-black text-zinc-950">نشط ومشفر 100%</span>
                      </div>
                      <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80 space-y-1">
                        <span className="text-[11px] text-zinc-500 font-bold block">نسبة الحضور المكتمل</span>
                        <span className="text-xl font-black font-mono text-zinc-950">96.8%</span>
                      </div>
                    </div>

                    <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-100 text-right">
                      <div className="p-3 bg-zinc-50 text-[11px] font-bold text-zinc-500 flex justify-between">
                        <span>سجل البصمات اللحظي للفروع</span>
                        <span className="font-mono">تحديث مباشر</span>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-zinc-900">أحمد مصطفى الشريف</div>
                          <div className="text-[11px] text-zinc-500">مهندس موقع • فرع التجمع الخامس</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                          داخل النطاق (14م) ✓
                        </span>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-zinc-900">سارة هشام عادل</div>
                          <div className="text-[11px] text-zinc-500">مدير حسابات • فرع المعادي</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                          داخل النطاق (8م) ✓
                        </span>
                      </div>
                      <div className="p-3 flex items-center justify-between bg-rose-50/40">
                        <div>
                          <div className="font-bold text-zinc-900">محمد طارق إبراهيم</div>
                          <div className="text-[11px] text-zinc-500">مشرف مبيعات • فرع الشيخ زايد</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
                          مرفوض: خارج النطاق (320م) ✕
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTelemetryTab === 'security' && (
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3 text-right text-xs">
                    <div className="flex items-center gap-2 text-zinc-950 font-black text-sm">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span>قفل حساب الموظف على معرّف هاتفه الشخصي (Device Lock)</span>
                    </div>
                    <p className="text-zinc-600 leading-relaxed">
                      يتم توليد بصمة عتادية فريدة للجهاز (Hardware UUID) في أول تسجيل دخول. لا يمكن للموظف تسجيل الدخول من هاتف زميله للبصمة نيابة عنه، ولا يمكن فك الارتباط إلا بإذن رسمي من مسؤول النظام.
                    </p>
                    <div className="flex gap-2 font-mono text-[11px]">
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-zinc-200 font-bold text-emerald-700">SHA-256 Secure Enclave</span>
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-zinc-200 font-bold text-zinc-700">Apple Face ID / WebAuthn</span>
                    </div>
                  </div>
                )}

                {activeTelemetryTab === 'shifts' && (
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3 text-right text-xs">
                    <div className="flex items-center gap-2 text-zinc-950 font-black text-sm">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>قفل الانصراف المبكر لـ 8 ساعات عمل حقيقية</span>
                    </div>
                    <p className="text-zinc-600 leading-relaxed">
                      عداد زمني دقيق يبدأ فور البصمة داخل الفرع. زر الانصراف يظل مغلقاً حتى استكمال ساعات الوردية بالكامل، مع إمكانية تقديم طلب إذن ساعتين طارئ يُعتمد بضغطة زر من مدير الفرع.
                    </p>
                  </div>
                )}

                {activeTelemetryTab === 'payroll' && (
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3 text-right text-xs">
                    <div className="flex items-center gap-2 text-zinc-950 font-black text-sm">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>تصدير كشوف المرتبات لـ Excel باللغة العربية</span>
                    </div>
                    <p className="text-zinc-600 leading-relaxed">
                      حساب آلي فوري لساعات العمل الفعلية، ساعات الإضافي (Overtime)، أيام الغياب، والأذونات. الملفات تصدر بصيغة UTF-8 BOM المعتمدة للبنوك والبرامج المحاسبية.
                    </p>
                  </div>
                )}

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ================= INTERACTIVE ROI CALCULATOR ================= */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y border-zinc-200/80">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              حاسبة الوفر والتسرب المالي
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950">
              كم توفر شركتك سنوياً بالاستغناء عن أجهزة البصمة؟
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto">
              حرّك المؤشرات وشاهد التكلفة المهدورة التي تستردها شركتك من اليوم الأول.
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-zinc-200 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Sliders (7 Cols) */}
            <div className="md:col-span-7 space-y-6 text-right">
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-700">عدد موظفي شركتك:</span>
                  <span className="font-mono font-black text-sm text-zinc-950 bg-white px-3 py-1 rounded-xl border border-zinc-200">
                    {employeeCount} موظف
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-700">عدد الفروع أو مواقع العمل:</span>
                  <span className="font-mono font-black text-sm text-zinc-950 bg-white px-3 py-1 rounded-xl border border-zinc-200">
                    {branchesCount} فروع
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={branchesCount}
                  onChange={(e) => setBranchesCount(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-white p-3 rounded-xl border border-zinc-200/80">
                  <span className="text-zinc-500 block text-[11px]">تكلفة شراء وصيانة الأجهزة:</span>
                  <span className="font-mono font-bold text-rose-600 text-xs">
                    {totalHardwareYearOne.toLocaleString('en-US')} ج.م / سنة
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-zinc-200/80">
                  <span className="text-zinc-500 block text-[11px]">هدر الرواتب من التأخير:</span>
                  <span className="font-mono font-bold text-rose-600 text-xs">
                    {annualLeakage.toLocaleString('en-US')} ج.م / سنة
                  </span>
                </div>
              </div>

            </div>

            {/* Savings Callout (5 Cols) */}
            <div className="md:col-span-5 bg-white border-2 border-emerald-500/50 rounded-2xl p-6 text-center space-y-3 shadow-sm">
              <span className="text-xs font-bold text-emerald-700">
                صافي الوفر السنوي التقديري
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-zinc-950">
                {netAnnualSavings.toLocaleString('en-US')}
              </div>
              <span className="text-xs text-zinc-500 font-bold block">
                جنيه مصري سنوياً 💰
              </span>
              <button
                onClick={() => onOpenRegister('growth')}
                className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                وفّر هذا المبلغ وابدأ مجاناً
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ================= PRICING SECTION (CLEAN COMPETITIVE TIERS) ================= */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              باقات شفافة وعادلة
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950">
              اختر الباقة المناسبة لحجم شركتك
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto">
              ابدأ تجربتك المجانية لمدة 14 يوماً بكامل الصلاحيات. بدون أي بطاقات بنكية وبسداد مريح عبر InstaPay.
            </p>

            {/* Monthly / Yearly Segmented Switcher */}
            <div className="inline-flex items-center gap-1 bg-zinc-100 p-1 rounded-2xl border border-zinc-200 text-xs font-bold mt-2 shadow-2xs">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                الدفع الشهري
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <span>الدفع السنوي</span>
                <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  وفر شهرين مجاناً 🎁
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((p) => {
              const price = billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly;
              const perMonthEffective = billingCycle === 'yearly' ? Math.round(p.priceYearly / 12) : p.priceMonthly;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all relative ${
                    p.recommended
                      ? 'border-2 border-emerald-500 shadow-xl'
                      : 'border border-zinc-200/90 shadow-sm'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-zinc-950 text-white text-[11px] font-black px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                      {p.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-zinc-950">{p.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{p.subtitle}</p>
                    </div>

                    {/* Price */}
                    <div className="py-2 border-y border-zinc-100">
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-3xl sm:text-4xl font-black text-zinc-950">
                          {price.toLocaleString('en-US')}
                        </span>
                        <span className="text-xs text-zinc-500 font-bold font-sans">
                          ج.م / {billingCycle === 'yearly' ? 'سنة كاملة' : 'شهر'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <div className="text-[11px] text-emerald-600 font-bold mt-0.5 font-mono">
                          يعادل {perMonthEffective.toLocaleString('en-US')} ج.م / شهرياً فقط!
                        </div>
                      )}
                    </div>

                    {/* Quick Limit Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.pills.map((pill, idx) => (
                        <span
                          key={idx}
                          className="bg-zinc-100 text-zinc-700 text-[11px] font-bold px-3 py-1 rounded-full"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2.5 text-xs text-zinc-600 pt-2">
                      {p.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => onOpenRegister(p.id)}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                        p.recommended
                          ? 'bg-zinc-950 hover:bg-zinc-800 text-white'
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                      }`}
                    >
                      <span>ابدأ التجربة المجانية (14 يوم)</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-zinc-400 text-center mt-2">لا يشترط بطاقة ائتمانية</p>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Dotted Custom Enterprise Plan Card */}
          <div className="border-2 border-dashed border-zinc-300 bg-white p-6 sm:p-8 rounded-3xl max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-100 text-zinc-800 rounded-2xl shrink-0">
                <MessageCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-black text-zinc-950 text-base">هل تحتاج باقة مخصصة لشركتك؟</h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  إذا كان عدد موظفيك أكثر من 100 موظف أو لديك متطلبات ربط خاصة بالأنظمة المحاسبية، تواصل معنا وسنصمم لك عرضاً مخصصاً.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/201010046078?text=مرحباً،%20أرغب%20في%20الاستفسار%20عن%20باقة%20مخصصة%20لمنصة%20موجود"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 px-5 py-3 rounded-xl font-bold whitespace-nowrap shadow-2xs transition-all active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>تواصل مع الإدارة</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* InstaPay VIP Direct Integration Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-5 sm:p-6 rounded-3xl max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-950 text-sm">دفع فوري وآمن داخل مصر عبر InstaPay</h4>
                <p className="text-[11px] text-zinc-600 mt-0.5">تحويل فوري بدون أي عمولات بنكية من أي تطبيق بنكي أو محفظة ذكية.</p>
              </div>
            </div>
            <a
              href="https://ipn.eg/S/davidovic/instapay/3BW08C"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold whitespace-nowrap shadow-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <span>سداد بـ InstaPay ⚡</span>
            </a>
          </div>

        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="py-16 px-4 sm:px-6 bg-white border-t border-zinc-200/80">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              الأسئلة الشائعة
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950">
              كل ما يدور بذهنك حول المنظومة
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-[#F8FAFC] border border-zinc-200 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 text-sm font-bold text-zinc-900 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 text-xs text-zinc-600 leading-relaxed border-t border-zinc-200/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="mt-auto bg-zinc-950 text-zinc-400 py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-sm font-black text-white">موجود • Moujood SaaS Platform</div>
              <div className="text-[11px] text-zinc-500">حضور وانصراف ذكي بالـ GPS والتحقق البيومتري للشركات</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <button
              onClick={() => onOpenRegister('growth')}
              className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              تسجيل شركة جديدة
            </button>
            <span className="text-zinc-600">•</span>
            <a href="#pricing" className="hover:text-white transition-colors">
              الأسعار
            </a>
          </div>

          <div className="text-[11px] text-zinc-500 font-mono">
            جميع الحقوق محفوظة © {new Date().getFullYear()} • منصة موجود
          </div>

        </div>
      </footer>

    </div>
  );
}
