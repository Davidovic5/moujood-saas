import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CreditCard, 
  Check, 
  Copy, 
  Sparkles, 
  Send, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';

export function SubscriptionLockModal({ isOpen, lockInfo, onPaymentSubmitted }) {
  const [selectedPlan, setSelectedPlan] = useState('growth');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [instapayReference, setInstapayReference] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const paymentInfo = lockInfo?.paymentInfo || {
    instapayUsername: 'smartattendance@instapay',
    instapayPhone: '01000000000',
    accountName: 'منظومة الحضور الذكي'
  };

  const plans = {
    starter: { name: 'باقة البداية', priceMonthly: 1000, priceYearly: 10000, cap: '15 موظف' },
    growth: { name: 'باقة النمو', priceMonthly: 3000, priceYearly: 30000, cap: '50 موظف' },
    enterprise: { name: 'باقة المؤسسات', priceMonthly: 5000, priceYearly: 50000, cap: '120 موظف' }
  };

  const currentPlanConfig = plans[selectedPlan] || plans.growth;
  const amountToPay = billingCycle === 'yearly' ? currentPlanConfig.priceYearly : currentPlanConfig.priceMonthly;

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(paymentInfo.instapayUsername);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    setError('');

    if (!instapayReference.trim() && !receiptImage) {
      setError('يرجى إدخال رقم العملية المرجعي من إنستاباي أو إرفاق صورة الإيصال');
      return;
    }

    setLoading(true);

    try {
      const res = await api.submitInstaPayProof({
        plan: selectedPlan,
        billingCycle,
        amount: amountToPay,
        instapayReference: instapayReference.trim(),
        senderPhone: senderPhone.trim(),
        receiptImage
      });

      if (res.success) {
        setSuccess(true);
        if (onPaymentSubmitted) {
          onPaymentSubmitted(res);
        }
      } else {
        setError(res.error || 'حدث خطأ في الإرسال');
      }
    } catch (err) {
      setError(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-['Cairo',sans-serif]" dir="rtl">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl max-w-lg w-full shadow-2xl p-6 text-zinc-100 space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header Alert */}
        <div className="text-center space-y-2 pb-2 border-b border-zinc-800">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            {lockInfo?.code === 'TRIAL_EXPIRED' 
              ? 'انتهت الفترة التجريبية المجانية (14 يوماً)' 
              : 'انتهت صلاحية اشتراك شركتكم'}
          </h3>
          <p className="text-xs text-zinc-400">
            للاستمرار في تسجيل الحضور والانصراف ومتابعة موظفيك، يرجى تجديد الاشتراك عبر تطبيق إنستاباي.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-white">تم إرسال إثبات التحويل بنجاح!</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              يقوم فريق الدعم الآن بمراجعة العملية وتفعيل اشتراك شركتكم فوراً. شكراً لثقتكم بنا!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
            
            {error && (
              <div className="bg-red-950/60 border border-red-800 p-3 rounded-xl text-xs text-red-300 font-bold">
                {error}
              </div>
            )}

            {/* Plan Picker */}
            <div>
              <label className="block text-zinc-300 font-bold mb-1.5">اختر الباقة للتجديد:</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(plans).map(([code, p]) => (
                  <div
                    key={code}
                    onClick={() => setSelectedPlan(code)}
                    className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                      selectedPlan === code
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{p.name}</div>
                    <div className="text-[10px] text-amber-400 mt-0.5">
                      {billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly} ج.م
                    </div>
                    <div className="text-[9px] text-zinc-500">{p.cap}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cycle toggle */}
            <div className="flex items-center justify-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  billingCycle === 'monthly' ? 'bg-amber-500 text-black' : 'text-zinc-400'
                }`}
              >
                شهري ({currentPlanConfig.priceMonthly} ج.م)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  billingCycle === 'yearly' ? 'bg-amber-500 text-black' : 'text-zinc-400'
                }`}
              >
                سنوي ({currentPlanConfig.priceYearly} ج.م) 🎁
              </button>
            </div>

            {/* InstaPay Transfer Box */}
            <div className="bg-purple-950/30 border border-purple-800/60 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-purple-300 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>بيانات التحويل عبر InstaPay:</span>
                </span>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-bold">
                  بدون عمولات ⚡
                </span>
              </div>

              <div className="bg-zinc-950/90 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">معرف إنستاباي (Username):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-amber-400" dir="ltr">
                      {paymentInfo.instapayUsername}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUsername}
                      className="text-zinc-400 hover:text-white"
                      title="نسخ"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">رقم الهاتف:</span>
                  <span className="font-mono text-zinc-200" dir="ltr">{paymentInfo.instapayPhone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">المبلغ المطلوب تحويله:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">{amountToPay} ج.م</span>
                </div>
              </div>
            </div>

            {/* Reference & Phone input */}
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1 font-bold">رقم العملية من تطبيق إنستاباي (Reference):</label>
                <input
                  type="text"
                  placeholder="مثال: 41289033482"
                  value={instapayReference}
                  onChange={(e) => setInstapayReference(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white font-mono p-2.5 rounded-xl outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">رقم الهاتف المحول منه (اختياري):</label>
                <input
                  type="tel"
                  placeholder="010xxxxxxxx"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white font-mono p-2.5 rounded-xl outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">إرفاق سكرين شوت الإيصال (اختياري):</label>
                <label className="w-full bg-zinc-950 border border-dashed border-zinc-700 hover:border-amber-500/50 p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-zinc-400">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>{receiptImage ? 'تم اختيار صورة الإيصال بنجاح ✓' : 'اضغط لاختيار صورة التحويل'}</span>
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'جاري إرسال البيانات...' : 'إرسال إثبات التحويل للتفعيل الفوري'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
