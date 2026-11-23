import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Building2, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  Key, 
  RefreshCw, 
  TrendingUp, 
  CreditCard,
  ChevronRight,
  Eye,
  Check,
  X,
  Lock,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export function SaasGodModeDashboard({ onExit }) {
  const [saasKey, setSaasKey] = useState(() => {
    return sessionStorage.getItem('saas_master_key') || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard Data
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'payments'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Tenant Action Modal
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [actionMonths, setActionMonths] = useState(1);
  const [actionPlan, setActionPlan] = useState('');
  const [actionStatus, setActionStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // InstaPay Approval / Rejection Modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  // Target Revenue Goal: 50,000 EGP / month
  const TARGET_MRR = 50000;

  useEffect(() => {
    if (saasKey) {
      loadDashboardData(saasKey);
    }
  }, [saasKey]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setLoading(true);
    setAuthError('');

    try {
      const res = await api.saasAdminLogin(keyInput.trim());
      if (res.success) {
        sessionStorage.setItem('saas_master_key', keyInput.trim());
        setSaasKey(keyInput.trim());
        setIsAuthenticated(true);
        loadDashboardData(keyInput.trim());
      } else {
        setAuthError(res.error || 'مفتاح غير صحيح');
      }
    } catch (err) {
      setAuthError('فشل التحقق من المفتاح');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (key) => {
    setLoading(true);
    try {
      const [statsRes, tenantsRes, paymentsRes] = await Promise.all([
        api.getSaasStats(key),
        api.getSaasTenants(key),
        api.getSaasPayments(key)
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        setIsAuthenticated(true);
      }
      if (tenantsRes.success) {
        setTenants(tenantsRes.tenants);
      }
      if (paymentsRes.success) {
        setPayments(paymentsRes.payments);
      }
    } catch (err) {
      console.error('Failed to load SaaS data:', err);
      if (!isAuthenticated) setAuthError('مفتاح الدخول منتهي أو غير مصرح');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTenantSubscription = async () => {
    if (!selectedTenant) return;
    setActionLoading(true);
    try {
      const payload = {
        plan: actionPlan || selectedTenant.plan,
        status: actionStatus || selectedTenant.status,
        durationMonths: Number(actionMonths) || 0
      };

      const res = await api.updateTenantSubscription(selectedTenant.tenantId, payload, saasKey);
      if (res.success) {
        await loadDashboardData(saasKey);
        setSelectedTenant(null);
      } else {
        alert(res.error || 'حدث خطأ أثناء التحديث');
      }
    } catch (err) {
      alert(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    if (!confirm('هل أنت متأكد من استلام التحويل وتفعيل اشتراك الشركة تلقائياً؟')) return;
    setPaymentActionLoading(true);
    try {
      const res = await api.approveSaasPayment(paymentId, adminNote, saasKey);
      if (res.success) {
        await loadDashboardData(saasKey);
        setSelectedPayment(null);
      } else {
        alert(res.error || 'حدث خطأ في الاعتماد');
      }
    } catch (err) {
      alert(err.message || 'فشل الاتصال');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    const reason = prompt('يرجى كتابة سبب رفض التحويل:');
    if (!reason) return;
    setPaymentActionLoading(true);
    try {
      const res = await api.rejectSaasPayment(paymentId, reason, saasKey);
      if (res.success) {
        await loadDashboardData(saasKey);
        setSelectedPayment(null);
      } else {
        alert(res.error || 'حدث خطأ');
      }
    } catch (err) {
      alert(err.message || 'فشل الاتصال');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('saas_master_key');
    setSaasKey('');
    setIsAuthenticated(false);
  };

  // Filter Tenants
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.contactPhone && t.contactPhone.includes(searchQuery));
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  const pendingPayments = payments.filter(p => p.status === 'pending');

  // Progress to 50K Target
  const mrr = stats?.mrr || 0;
  const targetPercent = Math.min(Math.round((mrr / TARGET_MRR) * 100), 100);

  // 1. Password Prompt Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 font-['Cairo',sans-serif]" dir="rtl">
        <div className="bg-zinc-900 border border-emerald-500/30 p-8 rounded-3xl max-w-md w-full shadow-2xl relative text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-emerald-400 mb-1">لوحة تحكم صاحب المنصة (God Mode)</h2>
          <p className="text-xs text-zinc-400 mb-6">يرجى إدخال المفتاح السري للوصول إلى إدارة الشركات والإيرادات</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="أدخل مفتاح الإدارة السري..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 text-white p-3 rounded-xl text-center text-sm outline-none transition-colors"
                autoFocus
              />
            </div>

            {authError && (
              <div className="text-xs text-red-400 bg-red-950/50 border border-red-800 p-2.5 rounded-xl font-bold">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
            </button>

            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="w-full text-xs text-zinc-400 hover:text-white pt-2 transition-colors"
              >
                العودة للتطبيق الرئيسي
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // 2. Full God Mode Dashboard Screen
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-['Cairo',sans-serif]" dir="rtl">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-emerald-500/20 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-emerald-400">منظومة موجود • لوحة الإدارة العليا (Moujood SaaS)</h1>
                <span className="text-[10px] bg-emerald-500 text-black font-black px-2 py-0.5 rounded-full">
                  GOD MODE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">متابعة الاشتراكات، الإيرادات الشهرية، وتأكيدات إنستاباي</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadDashboardData(saasKey)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            {onExit && (
              <button
                onClick={onExit}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded-xl border border-zinc-700 transition-colors"
              >
                عرض التطبيق
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-xs bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800 px-3 py-2 rounded-xl transition-colors font-bold"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        
        {/* Radar & Financial Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: MRR & Target 50,000 EGP */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/30 p-5 rounded-3xl relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400">الدخل الشهري المتكرر (MRR)</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mb-1">
              {mrr.toLocaleString('ar-EG')} <span className="text-xs font-normal text-zinc-400">ج.م / شهرياً</span>
            </div>
            
            {/* Progress to 50k goal */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>الهدف الشهري: 50,000 ج.م</span>
                <span className="font-bold text-emerald-400">{targetPercent}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${targetPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Total Companies */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400">إجمالي الشركات المسجلة</span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono mb-2">
              {stats?.totalTenants || 0}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-md font-bold">
                {stats?.activeTenants || 0} نشط
              </span>
              <span className="bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-md font-bold">
                {stats?.trialTenants || 0} تجريبي
              </span>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-md font-bold">
                {stats?.pastDueTenants || 0} متأخر
              </span>
            </div>
          </div>

          {/* Card 3: Total Active Employees */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400">إجمالي الموظفين المسجلين</span>
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono mb-1">
              {stats?.totalEmployees || 0}
            </div>
            <p className="text-[10px] text-zinc-400">مقعد مستخدم عبر كافة الشركات</p>
          </div>

          {/* Card 4: Pending InstaPay Approvals */}
          <div 
            onClick={() => setActiveTab('payments')}
            className={`cursor-pointer border p-5 rounded-3xl shadow-lg transition-all ${
              pendingPayments.length > 0
                ? 'bg-gradient-to-br from-emerald-950/40 to-zinc-900 border-emerald-500 hover:border-amber-400'
                : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400">تحويلات إنستاباي بانتظار الاعتماد</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {pendingPayments.length}
              </span>
              {pendingPayments.length > 0 && (
                <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded-full font-black animate-pulse">
                  مطلوب مراجعتها الآن ⚡
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 mt-2">اضغط هنا لعرض تفاصيل التحويلات</p>
          </div>

        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tenants'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            🏢 الشركات والمستأجرين ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            💳 طلبات الدفع عبر إنستاباي
            {pendingPayments.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingPayments.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: TENANTS MANAGEMENT */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الرابط الفرعي أو الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 text-xs text-white pr-9 pl-3 py-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'active', label: 'نشط 🟢' },
                  { id: 'trial', label: 'تجريبي 🔵' },
                  { id: 'past_due', label: 'متأخر 🟡' },
                  { id: 'suspended', label: 'معلق 🔴' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                      statusFilter === f.id
                        ? 'bg-zinc-800 text-emerald-400 font-bold border border-emerald-500/40'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tenants Table / Cards */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-bold">
                    <tr>
                      <th className="p-3.5">الشركة والرابط الفرعي</th>
                      <th className="p-3.5">الباقة</th>
                      <th className="p-3.5">الموظفين والفروع</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5">تاريخ الانتهاء</th>
                      <th className="p-3.5">هاتف التواصل</th>
                      <th className="p-3.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-zinc-500">
                          لا توجد شركات مطابقة لمعايير البحث.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map((t) => (
                        <tr key={t.tenantId} className="hover:bg-zinc-850/50 transition-colors">
                          <td className="p-3.5">
                            <div className="font-black text-white text-sm">{t.name}</div>
                            <div className="text-[11px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1" dir="ltr">
                              <span>{t.slug}.attendance.app</span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className="bg-zinc-800 text-zinc-200 border border-zinc-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
                              {t.plan === 'enterprise' ? 'المؤسسات (5000)' : t.plan === 'growth' ? 'النمو (3000)' : 'البداية (1000)'}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono">
                            <div>👥 {t.employeeCount || 0} / {t.maxEmployees} موظف</div>
                            <div className="text-zinc-400 text-[10px]">📍 {t.branchCount || 0} / {t.maxBranches} فرع</div>
                          </td>

                          <td className="p-3.5">
                            {t.status === 'active' && (
                              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-md font-bold">
                                نشط مدفوع
                              </span>
                            )}
                            {t.status === 'trial' && (
                              <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-md font-bold">
                                تجريبي (14 يوم)
                              </span>
                            )}
                            {t.status === 'past_due' && (
                              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-md font-bold">
                                منتهي / متأخر
                              </span>
                            )}
                            {t.status === 'suspended' && (
                              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-md font-bold">
                                معلق
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-zinc-300 font-mono">
                            {t.subscriptionEndsAt 
                              ? new Date(t.subscriptionEndsAt).toLocaleDateString('ar-EG')
                              : t.trialEndsAt 
                                ? new Date(t.trialEndsAt).toLocaleDateString('ar-EG')
                                : '—'}
                          </td>

                          <td className="p-3.5 text-zinc-400 font-mono" dir="ltr">
                            {t.contactPhone || '—'}
                          </td>

                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                setSelectedTenant(t);
                                setActionPlan(t.plan);
                                setActionStatus(t.status);
                                setActionMonths(1);
                              }}
                              className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold transition-colors"
                            >
                              إدارة الاشتراك
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSTAPAY PAYMENTS QUEUE */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg p-4">
              <h3 className="text-sm font-black text-emerald-400 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>سجل تحويلات إنستاباي وتأكيدات الدفع</span>
              </h3>

              {payments.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  لم يتم تسجيل أي عمليات تحويل إنستاباي بعد.
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map(p => (
                    <div 
                      key={p.id}
                      className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">{p.companyName}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">({p.tenantSlug})</span>
                          {p.status === 'pending' && (
                            <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.2 rounded font-black">
                              بانتظار التأكيد ⚡
                            </span>
                          )}
                          {p.status === 'approved' && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.2 rounded font-bold">
                              معتمد ومفعل ✅
                            </span>
                          )}
                          {p.status === 'rejected' && (
                            <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.2 rounded font-bold">
                              مرفوض ❌
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-zinc-400 flex items-center gap-4 flex-wrap">
                          <span>الباقة: <b>{p.plan}</b></span>
                          <span>المبلغ: <b className="text-emerald-400">{p.amount} ج.م</b> ({p.billingCycle === 'yearly' ? 'سنوي' : 'شهري'})</span>
                          {p.instapayReference && (
                            <span>رقم العملية: <b className="font-mono text-zinc-200">{p.instapayReference}</b></span>
                          )}
                          {p.senderPhone && (
                            <span>رقم المحول: <b className="font-mono text-zinc-200">{p.senderPhone}</b></span>
                          )}
                        </div>

                        <div className="text-[10px] text-zinc-500">
                          تاريخ الإرسال: {new Date(p.createdAt).toLocaleString('ar-EG')}
                          {p.adminNote && <span className="mr-2 text-zinc-400">• ملاحظة: {p.adminNote}</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {p.receiptImage && (
                          <a
                            href={p.receiptImage}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl border border-zinc-700 flex items-center gap-1 font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض الإيصال</span>
                          </a>
                        )}

                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprovePayment(p.id)}
                              disabled={paymentActionLoading}
                              className="text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold px-3 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>اعتماد وتفعيل</span>
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p.id)}
                              disabled={paymentActionLoading}
                              className="text-xs bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>رفض</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ================= MODAL: EDIT TENANT SUBSCRIPTION ================= */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-emerald-500/30 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-black text-emerald-400">إدارة اشتراك: {selectedTenant.name}</h3>
              <button onClick={() => setSelectedTenant(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-bold">الباقة الحالية</label>
                <select
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none"
                >
                  <option value="starter">باقة البداية (1,000 ج.م / 15 موظف)</option>
                  <option value="growth">باقة النمو (3,000 ج.م / 50 موظف)</option>
                  <option value="enterprise">باقة المؤسسات (5,000 ج.م / 120 موظف)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">حالة الاشتراك</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white p-2.5 rounded-xl outline-none"
                >
                  <option value="active">نشط مدفوع 🟢</option>
                  <option value="trial">فترة تجريبية 🔵</option>
                  <option value="past_due">متأخر عن التجديد 🟡</option>
                  <option value="suspended">معلق / موقوف 🔴</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">تمديد الاشتراك (إضافة أشهر)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setActionMonths(m)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        actionMonths === m
                          ? 'bg-emerald-500 text-black border-emerald-500'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      +{m} {m === 1 ? 'شهر' : m === 3 ? 'شهور' : 'سنة (12 شهر)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleUpdateTenantSubscription}
                disabled={actionLoading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black py-2.5 rounded-xl transition-all disabled:opacity-50"
              >
                {actionLoading ? 'جاري الحفظ...' : 'حفظ وتحديث الاشتراك'}
              </button>
              <button
                onClick={() => setSelectedTenant(null)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 px-4 rounded-xl font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
