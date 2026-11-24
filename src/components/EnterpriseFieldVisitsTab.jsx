import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Fuel, 
  Receipt, 
  Camera, 
  CheckCircle, 
  Plus, 
  Play, 
  Square,
  Users,
  TrendingUp
} from 'lucide-react';
import { api } from '../api';

export default function EnterpriseFieldVisitsTab({ currentUser }) {
  const [visits, setVisits] = useState([]);
  const [activeVisits, setActiveVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Start Visit Modal / Form
  const [showStartModal, setShowStartModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');
  const [startingVisit, setStartingVisit] = useState(false);

  // End Visit Modal / Form
  const [endingVisitId, setEndingVisitId] = useState(null);
  const [mileageKm, setMileageKm] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const res = await api.getFieldVisits();
      if (res.success) {
        setVisits(res.visits || []);
        setActiveVisits((res.visits || []).filter(v => v.status === 'active'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVisit = async (e) => {
    e.preventDefault();
    if (!clientName.trim()) return alert('يرجى إدخال اسم العميل');
    setStartingVisit(true);

    try {
      // Get current GPS
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const res = await api.recordFieldCheckIn({
            clientName,
            locationName,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            notes
          });
          if (res.success) {
            setMessage(`🚀 ${res.message}`);
            setShowStartModal(false);
            setClientName('');
            setLocationName('');
            setNotes('');
            loadVisits();
          }
          setStartingVisit(false);
        },
        async (err) => {
          // Fallback if GPS fails
          const res = await api.recordFieldCheckIn({ clientName, locationName, notes });
          if (res.success) {
            setMessage(`🚀 ${res.message}`);
            setShowStartModal(false);
            loadVisits();
          }
          setStartingVisit(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (e) {
      alert('حدث خطأ أثناء بدء الزيارة');
      setStartingVisit(false);
    }
  };

  const handleEndVisit = async (e) => {
    e.preventDefault();
    if (!endingVisitId) return;

    try {
      const expenses = [];
      if (Number(expenseAmount) > 0) {
        expenses.push({
          type: 'transport_meals',
          amount: Number(expenseAmount),
          notes: expenseNotes || 'مصاريف مأمورية ميدانية'
        });
      }

      const res = await api.recordFieldCheckOut({
        visitId: endingVisitId,
        mileageKm: Number(mileageKm) || 0,
        expenses
      });

      if (res.success) {
        setMessage(`🏁 ${res.message}`);
        setEndingVisitId(null);
        setMileageKm('');
        setExpenseAmount('');
        setExpenseNotes('');
        loadVisits();
      }
    } catch (e) {
      alert('حدث خطأ أثناء إنهاء الزيارة');
    }
  };

  return (
    <div className="space-y-6 text-zinc-100 font-['Cairo',sans-serif]" dir="rtl">
      
      {/* Header */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">تسجيل زيارات العملاء والمواقع (Multi-Stop Field Visits)</h2>
            <p className="text-xs text-zinc-400 mt-0.5">خاص بمناديب المبيعات، المهندسين الميدانيين، وحساب بدل البنزين بالكيلومتر والمصاريف</p>
          </div>
        </div>

        <button
          onClick={() => setShowStartModal(true)}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[var(--brand-contrast-text,#ffffff)] rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-[var(--brand-contrast-text,#ffffff)] text-[var(--brand-contrast-text,#ffffff)]" />
          <span>بدء زيارة عميل جديدة (Check-in)</span>
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-emerald-300 text-sm font-bold flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-xs text-emerald-400 hover:underline">إغلاق</button>
        </div>
      )}

      {/* Active Visits Card */}
      {activeVisits.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-3xl space-y-3">
          <h3 className="font-black text-emerald-300 text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>زيارات ميدانية جارية الآن ({activeVisits.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeVisits.map((v) => (
              <div key={v.id} className="bg-zinc-950/90 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-white text-sm">{v.clientName}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{v.locationName || 'موقع العميل'}</p>
                  <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                    بدأت: {new Date(v.checkInTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={() => setEndingVisitId(v.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>إنهاء الزيارة (Check-out)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visits Log */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-3xl space-y-4">
        <h3 className="font-black text-white text-base">سجل خط سير الزيارات الميدانية</h3>
        {visits.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">لا توجد زيارات ميدانية مسجلة حتى الآن</div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <div key={v.id} className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-zinc-900 text-amber-400 rounded-xl mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm">{v.clientName}</span>
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
                        {v.employeeName}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{v.locationName} {v.notes ? `• ${v.notes}` : ''}</p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono mt-1">
                      <span>المدة: {v.durationMinutes || 0} دقيقة</span>
                      {v.mileageKm > 0 && <span>المسافة: {v.mileageKm} كم</span>}
                      {v.fuelAllowance > 0 && <span className="text-emerald-400 font-bold">بدل بنزين: {v.fuelAllowance} ج.م</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right sm:text-left text-xs font-mono">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'}`}>
                    {v.status === 'completed' ? 'مكتملة ✓' : 'جارية الآن...'}
                  </span>
                  <div className="text-zinc-500 text-[10px] mt-1">
                    {new Date(v.checkInTime).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* START VISIT MODAL */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-black text-white text-base">بدء زيارة ميدانية جديدة</h3>
            <form onSubmit={handleStartVisit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">اسم العميل أو الجهة:</label>
                <input
                  type="text"
                  placeholder="مثال: شركة النيل للأدوية"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm p-2.5 rounded-xl outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">العنوان أو المنطقة:</label>
                <input
                  type="text"
                  placeholder="مثال: المعادي - شارع 9"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm p-2.5 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">ملاحظات الزيارة:</label>
                <textarea
                  placeholder="تسليم عينات أو معاينة موقع..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white text-xs p-2.5 rounded-xl outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={startingVisit}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[var(--brand-contrast-text,#ffffff)] font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
                >
                  {startingVisit ? 'جاري تحديد الـ GPS...' : 'تسجيل الدخول بالموقع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* END VISIT MODAL */}
      {endingVisitId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-black text-white text-base">إنهاء الزيارة الميدانية وحساب البنزين</h3>
            <form onSubmit={handleEndVisit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                  <span>المسافة المقطوعة بالكيلومتر (كم):</span>
                </label>
                <input
                  type="number"
                  placeholder="مثال: 25"
                  value={mileageKm}
                  onChange={(e) => setMileageKm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white font-mono text-sm p-2.5 rounded-xl outline-none"
                />
                <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                  بدل البنزين المحسوب تلقائياً: {Math.round((Number(mileageKm) || 0) * 5.5)} ج.م
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مصاريف أوبر / مواصلات إضافية (اختياري):</span>
                </label>
                <input
                  type="number"
                  placeholder="مثال: 75"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white font-mono text-sm p-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEndingVisitId(null)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[var(--brand-contrast-text,#ffffff)] font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
                >
                  حفظ وإنهاء المأمورية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
