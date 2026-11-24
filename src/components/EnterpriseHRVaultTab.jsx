import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  UserCheck, 
  Clock, 
  Smile, 
  Meh, 
  Frown, 
  CloudRain, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  FileCheck,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { api } from '../api';

export default function EnterpriseHRVaultTab({ currentUser }) {
  const [activeTab, setActiveTab] = useState('vault'); // 'vault' | 'attrition' | 'mood'
  const [documents, setDocuments] = useState([]);
  const [attritionData, setAttritionData] = useState(null);
  const [pulseAnalytics, setPulseAnalytics] = useState(null);
  const [weatherActive, setWeatherActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Add Doc Form
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [empId, setEmpId] = useState('');
  const [docType, setDocType] = useState('probation_end');
  const [docTitle, setDocTitle] = useState('');
  const [docExpiry, setDocExpiry] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'vault') {
        const res = await api.getHRVault();
        if (res.success) setDocuments(res.documents || []);
      } else if (activeTab === 'attrition') {
        const res = await api.getAttritionRadar();
        if (res.success) setAttritionData(res);
      } else if (activeTab === 'mood') {
        const res = await api.getPulseAnalytics();
        if (res.success) setPulseAnalytics(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWeather = async () => {
    const nextState = !weatherActive;
    try {
      const res = await fetch('/api/enterprise/ops/policies/emergency-weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ active: nextState })
      });
      const data = await res.json();
      if (data.success) {
        setWeatherActive(nextState);
        setMessage(data.message);
      }
    } catch (e) {
      alert('خطأ في تفعيل وضع الطوارئ');
    }
  };

  return (
    <div className="space-y-6 text-zinc-100 font-['Cairo',sans-serif]" dir="rtl">
      
      {/* Header */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">خزنة ورادارات الموارد البشرية (AI HR Vault)</h2>
            <p className="text-xs text-zinc-400 mt-0.5">تنبيهات انتهاء العقود وفترات الاختبار، رادار التنبؤ بالاستقالات، ونبض مزاج الفريق</p>
          </div>
        </div>

        {/* Emergency Weather Button */}
        <button
          onClick={handleToggleWeather}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border shadow-lg ${
            weatherActive 
              ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/20' 
              : 'bg-zinc-950 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10'
          }`}
        >
          <CloudRain className="w-4 h-4" />
          <span>{weatherActive ? '🚨 وضع الطوارئ والطقس مُفعّل (إلغاء التأخيرات)' : 'زر طوارئ الطقس والمواصلات 🌧️'}</span>
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-emerald-300 text-sm font-bold flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-xs text-emerald-400 hover:underline">إغلاق</button>
        </div>
      )}

      {/* Tabs Switch */}
      <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 w-fit">
        <button
          onClick={() => setActiveTab('vault')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vault' ? 'bg-emerald-500 text-[var(--brand-contrast-text,#ffffff)] font-black shadow-md shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'
          }`}
        >
          خزنة التنبيهات (عقود/إقامات/اختبار)
        </button>
        <button
          onClick={() => setActiveTab('attrition')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'attrition' ? 'bg-emerald-500 text-[var(--brand-contrast-text,#ffffff)] font-black shadow-md shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>رادار التنبؤ بالاستقالات</span>
        </button>
        <button
          onClick={() => setActiveTab('mood')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'mood' ? 'bg-emerald-500 text-[var(--brand-contrast-text,#ffffff)] font-black shadow-md shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'
          }`}
        >
          نبض مزاج الفريق (Team Pulse)
        </button>
      </div>

      {/* VIEW 1: HR VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-zinc-400 font-bold">فترات الاختبار (3 شهور)</span>
              <h4 className="text-2xl font-black text-emerald-400">
                {documents.filter(d => d.docType === 'probation_end').length} موظف
              </h4>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-zinc-400 font-bold">تجديد العقود القادمة</span>
              <h4 className="text-2xl font-black text-emerald-400">
                {documents.filter(d => d.docType === 'contract_renewal').length} عقد
              </h4>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl space-y-1">
              <span className="text-xs text-zinc-400 font-bold">تنبيهات عاجلة (أقل من 30 يوم)</span>
              <h4 className="text-2xl font-black text-rose-400">
                {documents.filter(d => d.isUrgent).length} تنبيه
              </h4>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-3xl space-y-3">
            <h3 className="font-black text-white text-base">سجل وثائق ومواعيد الموظفين الحساسة</h3>
            {documents.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">لا توجد وثائق ذات تواريخ انتهاء مسجلة حالياً</div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((d) => (
                  <div key={d.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${d.isUrgent ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{d.title}</span>
                          <span className="text-xs text-zinc-400">({d.employeeName})</span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
                          تاريخ الانتهاء: {new Date(d.expiryDate).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        d.isExpired ? 'bg-rose-950 text-rose-400' : d.isUrgent ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400'
                      }`}>
                        {d.isExpired ? 'منتهية ❌' : `متبقي ${d.daysRemaining} يوم`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: AI ATTRITION RADAR */}
      {activeTab === 'attrition' && attritionData && (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-3xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
              <Sparkles className="w-4 h-4" />
              <span>تحليل الذكاء الاصطناعي لأنماط الحضور والانصراف</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              يقوم الرادار بتحليل مؤشرات التأخير المتزايد، استهلاك الإجازات العارضة المتفرقة، وتراجع ساعات الأوفرتايم للتنبؤ باحتمالية بحث الموظف عن فرصة عمل أخرى قبل تقديم استقالته بشهر كامل.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attritionData.report?.map((r, i) => (
              <div key={i} className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-3xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h4 className="font-black text-white text-base">{r.employeeName}</h4>
                    <span className="text-xs text-zinc-400 font-bold">{r.role}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black font-mono ${
                    r.riskScore >= 70 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400'
                  }`}>
                    احتمالية الاستقالة: {r.riskScore}%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-400">المؤشرات المرصودة:</span>
                  <ul className="space-y-1">
                    {r.indicators?.map((ind, idx) => (
                      <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1.5">
                        <span className="text-emerald-400 shrink-0">•</span>
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <span className="text-[11px] text-emerald-400 font-bold block">التوصية المقترحة:</span>
                  <p className="text-xs text-zinc-400 mt-0.5">{r.recommendedAction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: TEAM PULSE MOOD */}
      {activeTab === 'mood' && pulseAnalytics && (
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center sm:text-right">
              <span className="text-xs text-zinc-400 font-bold">مؤشر سعادة الفريق العام (Team Happiness Score)</span>
              <h3 className="text-4xl font-black text-emerald-400 font-mono">{pulseAnalytics.happinessScore}%</h3>
              <p className="text-xs text-zinc-500">تم حسابه مجهول الهوية بالكامل من لحظات تسجيل الانصراف</p>
            </div>

            <div className="flex items-center gap-6 text-center">
              <div>
                <Smile className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-zinc-300 block">مبسوط</span>
                <span className="text-xs font-mono text-emerald-400">{pulseAnalytics.breakdown?.happyPercent}%</span>
              </div>
              <div>
                <Meh className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-zinc-300 block">عادي</span>
                <span className="text-xs font-mono text-amber-400">{pulseAnalytics.breakdown?.neutralPercent}%</span>
              </div>
              <div>
                <Frown className="w-8 h-8 text-rose-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-zinc-300 block">مضغوط</span>
                <span className="text-xs font-mono text-rose-400">{pulseAnalytics.breakdown?.stressedPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
