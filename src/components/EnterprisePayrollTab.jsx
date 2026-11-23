import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Download, 
  TrendingUp, 
  Calendar,
  Gift,
  Clock,
  Send,
  Printer
} from 'lucide-react';
import { api } from '../api';

export default function EnterprisePayrollTab({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('payslips'); // 'payslips' | 'advances' | 'radar'
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  
  // Data states
  const [payslips, setPayslips] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [radar, setRadar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Advance Request Form
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [splitMonths, setSplitMonths] = useState(1);
  const [submittingAdvance, setSubmittingAdvance] = useState(false);

  // Bonus Form (Manager)
  const [bonusEmpId, setBonusEmpId] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');

  const isManager = currentUser?.role?.permissions?.canManageEmployees || currentUser?.role?.isSystemAdmin;

  useEffect(() => {
    loadData();
  }, [activeSubTab, month]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'payslips') {
        const res = await api.getPayslips({ month });
        if (res.success) setPayslips(res.payslips || []);
      } else if (activeSubTab === 'advances') {
        const res = await api.getAdvances();
        if (res.success) setAdvances(res.items || []);
      } else if (activeSubTab === 'radar') {
        const res = await api.getOvertimeRadar();
        if (res.success) setRadar(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!window.confirm(`هل أنت متأكد من توليد قسائم رواتب شهر ${month} لجميع الموظفين؟`)) return;
    setLoading(true);
    try {
      const res = await api.generatePayroll({ month });
      if (res.success) {
        setMessage(`✅ ${res.message}`);
        loadData();
      } else {
        alert(res.error || 'فشل التوليد');
      }
    } catch (e) {
      alert('خطأ أثناء التوليد');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAdvance = async (e) => {
    e.preventDefault();
    if (!advanceAmount || Number(advanceAmount) <= 0) return alert('يرجى كتابة مبلغ صحيح');
    setSubmittingAdvance(true);
    try {
      const res = await api.requestAdvance({
        amount: Number(advanceAmount),
        reason: advanceReason,
        splitMonths: Number(splitMonths)
      });
      if (res.success) {
        setMessage('✅ تم إرسال طلب السلفة للإدارة بنجاح!');
        setAdvanceAmount('');
        setAdvanceReason('');
        loadData();
      } else {
        alert(res.error || 'فشل إرسال الطلب');
      }
    } catch (e) {
      alert('حدث خطأ');
    } finally {
      setSubmittingAdvance(false);
    }
  };

  const handleApproveAdvance = async (id) => {
    try {
      const res = await api.approveAdvance(id);
      if (res.success) {
        setMessage('✅ تمت الموافقة على السلفة!');
        loadData();
      }
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  const handleExportWPS = () => {
    window.open(`/api/enterprise/payroll/payroll/export-wps?month=${month}`, '_blank');
  };

  return (
    <div className="space-y-6 text-zinc-100 font-['Cairo',sans-serif]" dir="rtl">
      
      {/* Header Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">الماليات، الرواتب والسلف (Digital Payroll)</h2>
            <p className="text-xs text-zinc-400 mt-0.5">قسائم الرواتب الذكية، رادار ميزانية الأوفرتايم، وإدارة السلف والمكافآت التلقائية</p>
          </div>
        </div>

        {/* Sub-tabs switch */}
        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('payslips')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'payslips' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>قسائم الرواتب</span>
          </button>
          <button
            onClick={() => setActiveSubTab('advances')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'advances' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>السلف والمكافآت</span>
          </button>
          <button
            onClick={() => setActiveSubTab('radar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'radar' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>رادار الأوفرتايم ⚠️</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-emerald-300 text-sm font-bold flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-xs text-emerald-400 hover:underline">إغلاق</button>
        </div>
      )}

      {/* VIEW 1: DIGITAL PAYSLIPS */}
      {activeSubTab === 'payslips' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-bold">شهر الكشف:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-white font-mono text-xs px-3 py-1.5 rounded-xl outline-none"
              />
            </div>

            {isManager && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportWPS}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير ملف البنوك (WPS)</span>
                </button>
                <button
                  onClick={handleGeneratePayroll}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>توليد قسائم الشهر بضغطة واحدة</span>
                </button>
              </div>
            )}
          </div>

          {/* Payslips Table / Cards */}
          {payslips.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-12 text-center rounded-3xl space-y-3">
              <FileText className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-zinc-300">لا توجد قسائم رواتب منشورة لشهر {month}</h3>
              {isManager && (
                <p className="text-xs text-zinc-500">اضغط على زر "توليد قسائم الشهر" لحساب المرتبات والخصومات والأوفرتايم آلياً</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payslips.map((p) => (
                <div key={p.id} className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-lg hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <h4 className="font-black text-white text-base">{p.employeeName}</h4>
                      <span className="text-[11px] text-zinc-400 font-mono">شهر: {p.month}</span>
                    </div>
                    <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2.5 py-1 rounded-full font-bold">
                      صافي: {p.netSalary?.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>الراتب الأساسي:</span>
                      <span className="font-mono text-zinc-200">{p.basicSalary?.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>الأوفرتايم ({p.overtimeHours} س @ {p.overtimeRate}x):</span>
                      <span className="font-mono">+{p.overtimePay?.toLocaleString()} ج.م</span>
                    </div>
                    {p.bonusesTotal > 0 && (
                      <div className="flex justify-between text-amber-400 font-bold">
                        <span>المكافآت التقديرية:</span>
                        <span className="font-mono">+{p.bonusesTotal?.toLocaleString()} ج.م</span>
                      </div>
                    )}
                    <div className="border-t border-zinc-800/60 my-1"></div>
                    {p.lateDeductions > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>خصومات التأخير:</span>
                        <span className="font-mono">-{p.lateDeductions?.toLocaleString()} ج.م</span>
                      </div>
                    )}
                    {p.advanceDeductions > 0 && (
                      <div className="flex justify-between text-purple-400">
                        <span>قسط سلفة مستقطع:</span>
                        <span className="font-mono">-{p.advanceDeductions?.toLocaleString()} ج.م</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono">الإجمالي: {p.grossEarnings?.toLocaleString()} ج.م</span>
                    <button 
                      onClick={() => window.print()}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة القسيمة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ADVANCES & BONUSES */}
      {activeSubTab === 'advances' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Form */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-3xl space-y-4 h-fit shadow-lg">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>طلب سلفة جديدة</span>
            </h3>
            <p className="text-xs text-zinc-400">
              تُخصم السلفة تلقائياً من قسيمة راتب الشهر القادم، أو تُقسم على شهرين بالتساوي بموافقة الإدارة.
            </p>

            <form onSubmit={handleRequestAdvance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">المبلغ المطلوب (ج.م):</label>
                <input
                  type="number"
                  placeholder="مثال: 2000"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white font-mono text-sm p-2.5 rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">نظام الاستقطاع:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitMonths(1)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      splitMonths === 1 
                        ? 'bg-amber-500 text-black border-amber-400 font-black' 
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    شهر واحد (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMonths(2)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      splitMonths === 2 
                        ? 'bg-amber-500 text-black border-amber-400 font-black' 
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    على شهرين (50% / 50%)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">السبب أو الملاحظات:</label>
                <textarea
                  placeholder="ظرف طارئ أو مصاريف مدرسية..."
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white text-xs p-2.5 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAdvance}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال طلب السلفة</span>
              </button>
            </form>
          </div>

          {/* Advances Queue */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-black text-white text-base">سجل السلف والمكافآت</h3>
            {advances.length === 0 ? (
              <div className="bg-zinc-900/40 border border-zinc-800 p-8 text-center rounded-2xl text-zinc-500 text-xs">
                لا توجد طلبات سلف أو مكافآت مسجلة حالياً
              </div>
            ) : (
              <div className="space-y-2.5">
                {advances.map((adv) => (
                  <div key={adv.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${adv.type === 'bonus' ? 'bg-amber-500/10 text-amber-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {adv.type === 'bonus' ? <Gift className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{adv.employeeName}</span>
                          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono">
                            {adv.type === 'bonus' ? 'مكافأة' : `سلفة (${adv.splitMonths === 2 ? 'شهرين' : 'شهر'})`}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{adv.reason || 'بدون تفاصيل'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left font-mono">
                        <span className="font-black text-white text-sm">{adv.amount?.toLocaleString()} ج.م</span>
                        <div className="text-[10px]">
                          {adv.status === 'approved' && <span className="text-emerald-400 font-bold">معتمدة ✓</span>}
                          {adv.status === 'pending' && <span className="text-amber-400 font-bold">قيد المراجعة</span>}
                          {adv.status === 'rejected' && <span className="text-rose-400 font-bold">مرفوضة</span>}
                        </div>
                      </div>

                      {isManager && adv.status === 'pending' && (
                        <button
                          onClick={() => handleApproveAdvance(adv.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                        >
                          اعتماد
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: OVERTIME COST RADAR */}
      {activeSubTab === 'radar' && radar && (
        <div className="space-y-6">
          {/* Overtime Alert Banner */}
          <div className={`p-6 rounded-3xl border ${
            radar.isAlertActive 
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-200' 
              : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${radar.isAlertActive ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-white">رادار ميزانية الأوفرتايم (Overtime Budget Radar)</h3>
                <p className="text-sm font-bold">{radar.alertMessage}</p>
                <p className="text-xs text-zinc-400">
                  يراقب النظام تكلفة ساعات العمل الإضافية يومياً لتفادي المفاجآت بنهاية الشهر وحماية ميزانية الشركة.
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>المستهلك: {radar.totalOvertimeSpent?.toLocaleString()} ج.م ({radar.percentage}%)</span>
                <span>الميزانية المحددة: {radar.budget?.toLocaleString()} ج.م</span>
              </div>
              <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className={`h-full transition-all duration-500 ${
                    radar.percentage >= 80 ? 'bg-rose-500' : radar.percentage >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${radar.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
