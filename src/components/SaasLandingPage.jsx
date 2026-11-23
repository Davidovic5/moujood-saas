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
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';

export function SaasLandingPage({ onOpenRegister, onOpenGodMode, onGoToTenantLogin, onSandboxLogin }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [activeTelemetryTab, setActiveTelemetryTab] = useState('radar'); // 'radar' | 'security' | 'shifts' | 'payroll'
  
  // Interactive ROI Calculator State
  const [employeeCount, setEmployeeCount] = useState(35);
  const [branchesCount, setBranchesCount] = useState(2);

  // ROI Calculations based on Egyptian market averages
  // Traditional hardware cost: ~6,000 EGP per biometric device + 1,800 EGP/year maintenance
  const hardwareCostPerBranch = 6000;
  const hardwareAnnualMaintenance = 1800;
  const totalHardwareYearOne = (branchesCount * hardwareCostPerBranch) + (branchesCount * hardwareAnnualMaintenance);
  
  // Buddy punching & tardiness leakage: ~25 mins lost per employee/month = ~240 EGP lost per employee/month
  const monthlyLeakagePerEmployee = 240;
  const annualLeakage = employeeCount * monthlyLeakagePerEmployee * 12;
  
  // Moujood cost (Growth tier approx 3000/mo = 30000/yr)
  const moujoodAnnualCost = employeeCount <= 15 ? 10000 : employeeCount <= 50 ? 30000 : 50000;
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
      name: 'باقة البداية',
      subtitle: 'للشركات الناشئة، المكاتب الفردية والعيادات',
      priceMonthly: 1000,
      priceYearly: 10000,
      badge: null,
      popular: false,
      recommended: false,
      limits: 'حتى 15 موظف • فرع واحد',
      features: [
        'تسجيل الحضور بالـ GPS وبصمة الوجه',
        'تأمين الجهاز المعتمد لكل موظف (Device Lock)',
        'قفل وردية الـ 8 ساعات ومنع الانصراف المبكر',
        'نظام طلبات الإجازات والأذونات الساعية',
        'تصدير كشف الحضور الشهري لـ Excel بنقرة واحدة',
        'تطبيق خفيف جداً يثبت في 5 ثوانٍ (iOS & Android)',
        'دعم فني عبر الواتساب'
      ]
    },
    {
      id: 'growth',
      name: 'باقة النمو المؤسسي',
      subtitle: 'الخيار المعتمد للشركات المتوسطة وسلاسل الفروع',
      priceMonthly: 3000,
      priceYearly: 30000,
      badge: 'الأكثر طلباً للشركات ⭐️',
      popular: true,
      recommended: true,
      limits: 'حتى 50 موظف • حتى 3 فروع',
      features: [
        'كل ما في باقة البداية بالكامل',
        'رادار التواجد الميداني الحي لكل فرع لحظياً',
        'نظام الصلاحيات الإدارية متعدد المستويات (RBAC)',
        'إدارة مأموريات العمل والزيارات الخارجية',
        'تخصيص الهوية والشعار باسم شركتك',
        'تنبيهات فورية للمديرين عبر الهاتف والواتساب',
        'جلسة إعداد وتدريب مباشرة لفريق الموارد البشرية'
      ]
    },
    {
      id: 'enterprise',
      name: 'باقة المؤسسات الكبرى',
      subtitle: 'للشركات الكبرى، المصانع وسلاسل التوزيع',
      priceMonthly: 5000,
      priceYearly: 50000,
      badge: 'للمؤسسات والشركات الكبرى',
      popular: false,
      recommended: false,
      limits: 'حتى 120 موظف • فروع غير محدودة',
      features: [
        'كل ما في باقة النمو بالكامل',
        'فروع جغرافية غير محدودة في جميع المحافظات',
        'تصدير مخصص للرواتب متوافق مع البنوك وأنظمة ERP',
        'خزينة وثائق الموظفين المشفرة (HR Vault)',
        'تعديل حدود الـ GPS ومؤشرات التسامح لكل فرع',
        'مدير حساب خاص وأولوية معالجة فورية (VIP)',
        'اتفاقية مستوى الخدمة (SLA 99.9%)'
      ]
    }
  ];

  const faqs = [
    {
      q: 'هل أحتاج لشراء جهاز بصمة صيني أو أسلاك شبكات وتوصيلات؟',
      a: 'نهائياً! منظومة "موجود" تلغي أجهزة البصمة تماماً وتعتمد بنسبة 100% على هواتف الموظفين الذكية (آيفون وأندرويد). بدون أسلاك، بدون فنيين صيانة، وبدون طوابير أمام جهاز واحد معطوب.'
    },
    {
      q: 'كيف يمنع النظام تحايل الموظفين أو البصمة من المنازل عبر برامج Fake GPS؟',
      a: 'المنظومة محمية بـ 3 طبقات ردع صارمة: 1) فحص الأقمار الصناعية عالي الدقة (GPS Satellite Geofencing) المباشر من هاتف الموظف. 2) كشف وتجريم برامج الموقع الوهمي (Mock Location Injections). 3) قفل حساب الموظف على معرّف عتاد هاتفه الشخصي (Hardware Fingerprint Lock)، مستحيل موظف يبصم لزميله أو يفتح حسابه من جهاز آخر.'
    },
    {
      q: 'كيف يعمل تطبيق الموظفين على آيفون وأندرويد؟',
      a: 'التطبيق مبني بتقنية PWA فائقة السرعة مع ملف تثبيت مخصص لـ iOS (Apple MobileConfig). الموظف يضغط رابط شركتكم ويظهر التطبيق على الشاشة الرئيسية مباشرة في 5 ثوانٍ، خفيف جداً (أقل من 2 ميجابايت) ولا يستهلك باقة الإنترنت إطلاقاً.'
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
    <div className="min-h-screen bg-[#08090C] text-zinc-100 flex flex-col font-['Cairo',sans-serif] selection:bg-emerald-500 selection:text-black antialiased relative overflow-x-hidden" dir="rtl">
      
      {/* Background Ambient Lighting (Linear-style deep glass mesh) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-emerald-500/[0.07] via-emerald-500/[0.02] to-transparent rounded-full blur-[120px]" />
        <div className="absolute top-[35%] right-[-10%] w-[600px] h-[450px] bg-teal-500/[0.03] rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[140px]" />
        {/* Subtle engineering grid */}
        <div 
          className="absolute inset-0 opacity-[0.035]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }} 
        />
      </div>

      {/* ================= STICKY EXECUTIVE HEADER ================= */}
      <header className="sticky top-0 z-50 bg-[#08090C]/85 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0E121A] border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 group">
              <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-black text-xs transition-transform group-hover:scale-105">
                <MapPin className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">موجود</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  MOUJOOD SAAS
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium block">
                منظومة الحضور الذكي بالـ GPS والتحقق البيومتري للشركات
              </span>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSandboxClick}
              disabled={sandboxLoading}
              className="text-xs px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] transition-all font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="دخول فوري لتجربة الداشبورد بحساب تجريبي"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{sandboxLoading ? 'جاري الفتح...' : 'تجربة حية (Sandbox)'}</span>
              <span className="sm:hidden">{sandboxLoading ? '...' : 'تجربة'}</span>
            </button>

            {onGoToTenantLogin && (
              <button
                onClick={onGoToTenantLogin}
                className="text-xs px-3.5 py-2 rounded-xl bg-[#0F131C] hover:bg-[#151B27] text-zinc-200 border border-white/[0.08] transition-all font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>دخول شركتي</span>
              </button>
            )}

            <button
              onClick={() => onOpenRegister('growth')}
              className="text-xs font-black px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#052e16] shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>ابدأ التجربة المجانية</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          
          {/* Precision Status Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0E121A] border border-white/[0.08] shadow-inner text-xs font-semibold text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>الجيل السحابي الأحدث: وداعاً لأعطال وتكاليف أجهزة البصمة</span>
            <span className="text-zinc-500">|</span>
            <span className="text-emerald-400 font-mono text-[11px]">بدقة GPS ±3 متر</span>
          </div>

          {/* Master Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18]">
              تحكم كامل في حضور موظفيك وفروعك<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-teal-300 to-emerald-200">
                بالـ GPS والذكاء البيومتري
              </span>
              {' '}مباشرة من هواتفهم
            </h1>
            <p className="text-sm sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
              منظومة سحابية متطورة تلغي أجهزة البصمة الصينية نهائياً. قفل صارم لهواتف الموظفين، عداد وردية الـ 8 ساعات الفعلي، وإدارة الإجازات والأذونات بكشوف Excel متوافقة مع البنوك في ثوانٍ.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenRegister('growth')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#052e16] font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>سجل شركتك الآن (14 يوم تجربة مجانية)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleSandboxClick}
              disabled={sandboxLoading}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#0E121A] hover:bg-[#151B27] text-zinc-200 border border-white/[0.08] font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{sandboxLoading ? 'جاري تحضير البيئة التجريبية...' : 'جرّب لوحة الإدارة الحية (Live Sandbox)'}</span>
            </button>
          </div>

          {/* Trust Value Ribbons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-zinc-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>صفر أجهزة بصمة أو أسلاك</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>قفل الجهاز الواحد (Device Anti-Cheat)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تثبيت PWA فوري على iPhone & Android</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>دفع مباشر بـ InstaPay بدون عمولات</span>
            </div>
          </div>

          {/* ================= INTERACTIVE LIVE TELEMETRY RADAR WIDGET ================= */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="rounded-3xl bg-[#0B0D13] border border-white/[0.08] shadow-2xl shadow-black/80 overflow-hidden text-right">
              
              {/* Window Titlebar & Telemetry Tabs */}
              <div className="bg-[#0E1118] border-b border-white/[0.06] p-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 ml-3">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400">
                    <span className="text-emerald-400">moujood-core</span>
                    <span>/</span>
                    <span className="text-zinc-300">live-telemetry</span>
                  </div>
                </div>

                {/* Segmented Switcher */}
                <div className="flex items-center gap-1 bg-[#08090C] p-1 rounded-xl border border-white/[0.06] w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setActiveTelemetryTab('radar')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTelemetryTab === 'radar'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>رادار الفروع الحي</span>
                  </button>

                  <button
                    onClick={() => setActiveTelemetryTab('security')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTelemetryTab === 'security'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>درع قفل الأجهزة</span>
                  </button>

                  <button
                    onClick={() => setActiveTelemetryTab('shifts')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTelemetryTab === 'shifts'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>قفل وردية الـ 8 ساعات</span>
                  </button>

                  <button
                    onClick={() => setActiveTelemetryTab('payroll')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTelemetryTab === 'payroll'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>تصدير الرواتب Excel</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Telemetry Stage */}
              <div className="p-5 sm:p-8 bg-[#08090C]/60">
                {activeTelemetryTab === 'radar' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Metric Card 1 */}
                      <div className="bg-[#0E1118] p-4 rounded-2xl border border-white/[0.06] space-y-1">
                        <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                          <span>دقة التموضع الجغرافي</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        </div>
                        <div className="text-2xl font-black font-mono text-emerald-400">± 2.4 متر</div>
                        <div className="text-[11px] text-zinc-500">متصل بـ 9 أقمار صناعية GPS نشطة</div>
                      </div>

                      {/* Metric Card 2 */}
                      <div className="bg-[#0E1118] p-4 rounded-2xl border border-white/[0.06] space-y-1">
                        <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                          <span>حماية الموقع الوهمي (Anti-Mock)</span>
                          <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black text-white">درع نشط 100%</div>
                        <div className="text-[11px] text-zinc-500">تم حظر 0 محاولات تزييف اليوم</div>
                      </div>

                      {/* Metric Card 3 */}
                      <div className="bg-[#0E1118] p-4 rounded-2xl border border-white/[0.06] space-y-1">
                        <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                          <span>نسبة الحضور المكتمل</span>
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black font-mono text-white">96.8%</div>
                        <div className="text-[11px] text-zinc-500">من إجمالي قوة العمل بجميع الفروع</div>
                      </div>

                    </div>

                    {/* Simulated Radar Live Feed */}
                    <div className="bg-[#0E1118] rounded-2xl border border-white/[0.06] overflow-hidden">
                      <div className="p-3.5 bg-zinc-900/60 border-b border-white/[0.06] flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-200 flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          سجل البصمات اللحظي للفروع (Live Stream)
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">تحديث تلقائي كل 3 ثوانٍ</span>
                      </div>

                      <div className="divide-y divide-white/[0.04] text-xs">
                        
                        <div className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                              أم
                            </div>
                            <div>
                              <div className="font-bold text-white">أحمد مصطفى الشريف</div>
                              <div className="text-[11px] text-zinc-400">مهندس موقع • فرع التجمع الخامس (الرئيسي)</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-zinc-400">08:58:22 ص</span>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>داخل النطاق (14م)</span>
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">
                              سه
                            </div>
                            <div>
                              <div className="font-bold text-white">سارة هشام عادل</div>
                              <div className="text-[11px] text-zinc-400">مدير مالي • فرع المعادي</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-zinc-400">09:04:10 ص</span>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>داخل النطاق (8م)</span>
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 flex items-center justify-between gap-3 bg-rose-500/[0.03]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center font-bold text-rose-400">
                              مح
                            </div>
                            <div>
                              <div className="font-bold text-white">محمد طارق إبراهيم</div>
                              <div className="text-[11px] text-zinc-400">مشرف مبيعات • فرع الشيخ زايد</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-zinc-400">09:12:44 ص</span>
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[11px] flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              <span>مرفوض: خارج النطاق (320م)</span>
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {activeTelemetryTab === 'security' && (
                  <div className="space-y-6 animate-fade-in text-right">
                    <div className="bg-[#0E1118] p-6 rounded-2xl border border-white/[0.06] space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">بروتوكول حماية الجهاز المعتمد (Device Hardware Lock)</h4>
                            <p className="text-xs text-zinc-400">يمنع منعاً باتاً تسجيل الموظف لحضور زميله أو فتح الحساب من جهاز غير معتمد</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                          ACTIVE_ENFORCED
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="bg-[#08090C] p-3.5 rounded-xl border border-white/[0.04]">
                          <span className="text-zinc-500 block mb-1">المعرف الفريد للجهاز</span>
                          <span className="font-mono text-emerald-400 font-bold">SHA-256 (Secure Enclave)</span>
                        </div>
                        <div className="bg-[#08090C] p-3.5 rounded-xl border border-white/[0.04]">
                          <span className="text-zinc-500 block mb-1">تسجيل الدخول من جهاز آخر</span>
                          <span className="font-bold text-rose-400">محظور بدون إذن الإدارة</span>
                        </div>
                        <div className="bg-[#08090C] p-3.5 rounded-xl border border-white/[0.04]">
                          <span className="text-zinc-500 block mb-1">التحقق البيومتري المباشر</span>
                          <span className="font-bold text-white">Apple Face ID / Touch ID</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTelemetryTab === 'shifts' && (
                  <div className="space-y-6 animate-fade-in text-right">
                    <div className="bg-[#0E1118] p-6 rounded-2xl border border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-3 max-w-md">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                          <Lock className="w-3.5 h-3.5" />
                          <span>قفل الانصراف المبكر الصارم</span>
                        </div>
                        <h4 className="text-base font-black text-white">
                          لا يمكن لأي موظف تسجيل انصرافه قبل استكمال 8 ساعات عمل فعلية
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          عداد زمني تنازلي محكم يُظهر للموظف دقائق عمله الفعلية داخل الفرع. وفي الحالات الطارئة، يرسل الموظف طلب إذن ساعتين رسمي يُعتمد بضغطة زر من مدير الفرع في الداشبورد.
                        </p>
                      </div>

                      <div className="bg-[#08090C] border border-white/[0.06] p-6 rounded-2xl text-center min-w-[220px]">
                        <span className="text-[11px] text-zinc-500 font-bold block mb-1">عداد الوردية الحية</span>
                        <div className="text-3xl font-black font-mono text-emerald-400 tracking-wider">
                          07:44:18
                        </div>
                        <div className="text-[11px] text-zinc-400 font-bold mt-2 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
                          متبقي 15 دقيقة على فتح زر الانصراف
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTelemetryTab === 'payroll' && (
                  <div className="space-y-6 animate-fade-in text-right">
                    <div className="bg-[#0E1118] p-6 rounded-2xl border border-white/[0.06] space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm">تصدير مسير الرواتب المعتمد إلى Excel بنقرة واحدة</h4>
                          <p className="text-xs text-zinc-400">حساب آلي دقيق لساعات العمل الفعلية، ساعات الإضافي (Overtime)، والغياب بدون تدخل يدوي</p>
                        </div>
                        <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#052e16] font-bold text-xs flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل نموذج (.xlsx)</span>
                        </button>
                      </div>

                      <div className="bg-[#08090C] rounded-xl border border-white/[0.06] overflow-x-auto text-xs font-mono">
                        <table className="w-full text-right divide-y divide-white/[0.04]">
                          <thead>
                            <tr className="text-zinc-500 bg-white/[0.02]">
                              <th className="p-3">كود الموظف</th>
                              <th className="p-3 font-sans">اسم الموظف</th>
                              <th className="p-3 font-sans">الفرع</th>
                              <th className="p-3">أيام الحضور</th>
                              <th className="p-3">ساعات العمل</th>
                              <th className="p-3">إضافي (س)</th>
                              <th className="p-3 font-sans">الحالة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                            <tr>
                              <td className="p-3 text-emerald-400">EMP-104</td>
                              <td className="p-3 font-sans font-bold text-white">أحمد الشريف</td>
                              <td className="p-3 font-sans">التجمع الخامس</td>
                              <td className="p-3">22 يوم</td>
                              <td className="p-3">176 ساعة</td>
                              <td className="p-3 text-emerald-400">+8 س</td>
                              <td className="p-3 font-sans text-emerald-400">مكتمل 100%</td>
                            </tr>
                            <tr>
                              <td className="p-3 text-emerald-400">EMP-105</td>
                              <td className="p-3 font-sans font-bold text-white">سارة هشام</td>
                              <td className="p-3 font-sans">المعادي</td>
                              <td className="p-3">21 يوم</td>
                              <td className="p-3">168 ساعة</td>
                              <td className="p-3 text-emerald-400">+4 س</td>
                              <td className="p-3 font-sans text-emerald-400">إذن معتمد</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ================= INTERACTIVE ROI CALCULATOR ================= */}
      <section className="py-20 px-4 sm:px-6 relative z-10 bg-[#0A0D14]/80 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
              حاسبة الوفر السنوي والتسرب المالي
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              كم توفر شركتك سنوياً بالاستغناء عن أجهزة البصمة التقليدية؟
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              حرّك المؤشرات وشاهد بالأرقام الحقيقية كيف تمنع منصة "موجود" الهدر في الرواتب وتوفر تكاليف الأجهزة والصيانة.
            </p>
          </div>

          <div className="bg-[#0D111A] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Sliders Area (7 Cols) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Employee Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-200">عدد موظفي شركتك:</span>
                  <span className="font-mono font-black text-base text-emerald-400 bg-[#08090C] px-3 py-1 rounded-xl border border-white/[0.08]">
                    {employeeCount} موظف
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                  <span>5 موظفين</span>
                  <span>50</span>
                  <span>100</span>
                  <span>150 موظف</span>
                </div>
              </div>

              {/* Branches Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-200">عدد فروع أو مواقع العمل:</span>
                  <span className="font-mono font-black text-base text-emerald-400 bg-[#08090C] px-3 py-1 rounded-xl border border-white/[0.08]">
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
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                  <span>فرع واحد</span>
                  <span>3 فروع</span>
                  <span>6 فروع</span>
                  <span>10 فروع</span>
                </div>
              </div>

              {/* Leakage Breakdown List */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#08090C] p-3.5 rounded-2xl border border-white/[0.04] space-y-1">
                  <span className="text-zinc-500 block">تكلفة شراء وصيانة أجهزة البصمة القديمة:</span>
                  <span className="font-mono font-black text-rose-400 text-sm">
                    {totalHardwareYearOne.toLocaleString('ar-EG')} ج.م / سنة
                  </span>
                </div>
                <div className="bg-[#08090C] p-3.5 rounded-2xl border border-white/[0.04] space-y-1">
                  <span className="text-zinc-500 block">هدر الرواتب من دقائق التأخير والتلاعب:</span>
                  <span className="font-mono font-black text-rose-400 text-sm">
                    {annualLeakage.toLocaleString('ar-EG')} ج.م / سنة
                  </span>
                </div>
              </div>

            </div>

            {/* Savings Callout Card (5 Cols) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[#111622] to-[#0A0D14] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl shadow-emerald-500/10 relative overflow-hidden">
              <div className="text-xs text-emerald-400 font-bold tracking-wider">
                صافي الوفر المالي التقديري لشركتك
              </div>

              <div className="space-y-1">
                <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                  {netAnnualSavings.toLocaleString('ar-EG')}
                </div>
                <div className="text-xs text-emerald-400 font-bold">
                  جنيه مصري / سنوياً 💰
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                هذا المبلغ يمثل التكلفة الصافية التي تستردها شركتك من اليوم الأول بإلغاء الأجهزة المعطوبة ومنع التلاعب بدقائق التأخير.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onOpenRegister('growth')}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#052e16] font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>وفّر هذا المبلغ وابدأ مجاناً الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================= BENTO GRID FEATURE ARCHITECTURE ================= */}
      <section className="py-24 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto space-y-14">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
              بنية النظام والهندسة المعمارية
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              مصمم خصيصاً ليناسب بيئة العمل الحقيقية في مصر والخليج
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1 (Span 2) */}
            <div className="md:col-span-2 bg-[#0E121A] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                رادار النطاق الجغرافي الذكي (Dual Geofencing)
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                حدد فروع شركتك بدقة سنتيمترية على الخريطة مع تحديد نصف قطر النطاق المسموح (مثلاً 80م أو 150م). إذا كان الموظف خارج النطاق بـ 5 أمتار فقط، يرفض التطبيق تسجيل الحضور فوراً ويظهر له المسافة المتبقية بالأمتار. كما يدعم فروع المأموريات المعتمدة تلقائياً.
              </p>
              <div className="pt-4 flex flex-wrap gap-2 text-xs font-mono text-zinc-400">
                <span className="px-3 py-1 rounded-lg bg-[#08090C] border border-white/[0.06]">دقة GPS عالية</span>
                <span className="px-3 py-1 rounded-lg bg-[#08090C] border border-white/[0.06]">تعدد الفروع والمحافظات</span>
                <span className="px-3 py-1 rounded-lg bg-[#08090C] border border-white/[0.06]">تتبع المأموريات</span>
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="bg-[#0E121A] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4 hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">
                قفل الهاتف المعتمد (Anti-Cheat)
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                يتم ربط حساب الموظف بالمعرّف الفريد لهاتفه الشخصي (Hardware UUID) في أول تسجيل دخول. لن يتمكن أي موظف من تسجيل الحضور لزميله أو فتح الحساب من هاتف آخر بدون إذن الإدارة.
              </p>
              <div className="pt-2 text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>حماية كاملة من تبادل الهواتف</span>
              </div>
            </div>

            {/* Bento Card 3 */}
            <div className="bg-[#0E121A] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4 hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center text-yellow-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">
                تثبيت فوري في 5 ثوانٍ بدون متجر
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ملفات تثبيت وتكوين مخصصة لآبل آيفون (Apple MobileConfig) وأندرويد PWA. بدون الدخول للمتجر وبدون تحميل تطبيقات ثقيلة، يفتح الموظف الرابط ويثبت الأيقونة بضغطة زر واحدة.
              </p>
              <div className="pt-2 text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>حجم أقل من 2 ميجابايت وسرعة خارقة</span>
              </div>
            </div>

            {/* Bento Card 4 (Span 2) */}
            <div className="md:col-span-2 bg-[#0E121A] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden hover:border-emerald-500/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                محرك الرواتب والتقارير المالية التلقائية
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                بضغطة زر واحدة بنهاية كل شهر، تصدر كشوف الحضور والغياب والإضافي باللغة العربية متوافقة مع Excel وبرامج الحسابات ودفاتر الرواتب. لا داعي لقضاء أيام في تفريغ الفلاشات وحساب الخصومات يدوياً.
              </p>
              <div className="pt-4 flex flex-wrap gap-2 text-xs font-mono text-zinc-400">
                <span className="px-3 py-1 rounded-lg bg-[#08090C] border border-white/[0.06]">تصدير عربي UTF-8 BOM</span>
                <span className="px-3 py-1 rounded-lg bg-[#08090C] border border-white/[0.06]">حساب دقيق للإضافي والتأخير</span>
                <span className="px-3 py-1 rounded-lg bg-[#08090C] border border-white/[0.06]">سجل أذونات الساعتين</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================= PRICING SECTION ================= */}
      <section id="pricing" className="py-24 px-4 sm:px-6 relative z-10 bg-[#0A0D14]/80 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
              باقات عادلة وشفافة
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              استثمر بذكاء في نمو شركتك بدون أي التزامات مسبقة
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              ابدأ تجربتك المجانية لمدة 14 يوماً بكامل الصلاحيات. بدون بطاقات بنكية، ويمكنك السداد في أي وقت عبر إنستاباي.
            </p>

            {/* Billing Toggle Switcher */}
            <div className="inline-flex items-center gap-1 bg-[#0E121A] p-1.5 rounded-2xl border border-white/[0.08] text-xs font-bold mt-4 shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-emerald-500 text-[#052e16] font-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                الدفع الشهري
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-emerald-500 text-[#052e16] font-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>الدفع السنوي</span>
                <span className="bg-[#052e16] text-emerald-300 text-[10px] px-2 py-0.5 rounded-md font-mono font-bold">
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
                  className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                    p.recommended
                      ? 'bg-gradient-to-b from-[#111724] to-[#0A0D14] border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/10'
                      : 'bg-[#0E121A] border border-white/[0.08]'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-[#052e16] text-[11px] font-black px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                      {p.badge}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl font-black text-white">{p.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{p.subtitle}</p>
                    </div>

                    <div className="py-1 px-3 rounded-xl bg-[#08090C] border border-white/[0.04] text-xs font-mono text-emerald-400 font-bold inline-block">
                      {p.limits}
                    </div>

                    {/* Price Display */}
                    <div className="py-3 border-y border-white/[0.06]">
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-3xl sm:text-4xl font-black text-white">
                          {price.toLocaleString('ar-EG')}
                        </span>
                        <span className="text-xs text-zinc-400 font-bold font-sans">
                          ج.م / {billingCycle === 'yearly' ? 'سنة' : 'شهر'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <div className="text-[11px] text-emerald-400 font-bold mt-1 font-mono">
                          يعادل {perMonthEffective.toLocaleString('ar-EG')} ج.م / شهرياً فقط
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 text-xs text-zinc-300">
                      {p.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => onOpenRegister(p.id)}
                      className={`w-full py-3.5 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                        p.recommended
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-[#052e16] shadow-emerald-500/25'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      <span>ابدأ التجربة المجانية (14 يوم)</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center mt-2">لا يشترط وجود بطاقة بنكية</p>
                  </div>

                </div>
              );
            })}
          </div>

          {/* InstaPay VIP Direct Integration Banner */}
          <div className="bg-[#0E121A] border border-emerald-500/30 p-6 sm:p-8 rounded-3xl max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-500/5">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl shrink-0 border border-emerald-500/20">
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-white text-base">دفع فوري وآمن عبر إنستاباي (InstaPay IPN)</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  سداد مباشر بدون عمولات بنكية من أي تطبيق بنكي أو محفظة إلكترونية داخل مصر، مع تفعيل حساب شركتك فورياً.
                </p>
              </div>
            </div>
            <a
              href="https://ipn.eg/S/davidovic/instapay/3BW08C"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-emerald-500 hover:bg-emerald-400 text-[#052e16] px-5 py-3 rounded-xl font-black whitespace-nowrap shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>دفع عبر InstaPay ⚡</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="py-24 px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
              الأسئلة المتكررة
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              كل ما تحتاج لمعرفته قبل بدء تشغيل منظومتك
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-[#0E121A] border border-white/[0.06] rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 text-xs text-zinc-300 leading-relaxed border-t border-white/[0.04]">
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
      <footer className="mt-auto bg-[#050608] border-t border-white/[0.06] py-12 px-4 sm:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="text-sm font-black text-white">موجود • Moujood SaaS Platform</div>
              <div className="text-[11px] text-zinc-500">حضور وانصراف ذكي بالـ GPS والتحقق البيومتري</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-400 font-bold">
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
            <span className="text-zinc-600">•</span>
            {onOpenGodMode && (
              <button
                onClick={onOpenGodMode}
                className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                title="لوحة تحكم صاحب المنصة"
              >
                <span>👑 إدارة المنصة (God Mode)</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-zinc-500 font-mono">
            جميع الحقوق محفوظة © {new Date().getFullYear()} • منصة موجود
          </div>

        </div>
      </footer>

    </div>
  );
}
