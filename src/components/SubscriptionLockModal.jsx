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
    instapayUsername: 'davidovic',
    instapayUrl: 'https://ipn.eg/S/davidovic/instapay/3BW08C',
    instapayPhone: 'davidovic',
    accountName: 'David / موجود Moujood'
  };

  const plans = {
    starter: { name: 'باقة الانطلاق', priceMonthly: 349, priceYearly: 3490, cap: '15 موظف' },
    growth: { name: 'باقة النمو', priceMonthly: 849, priceYearly: 8490, cap: '50 موظف' },
    enterprise: { name: 'باقة المؤسسات', priceMonthly: 1599, priceYearly: 15990, cap: '100 موظف' }
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-['Cairo',sans-serif]" dir="rtl">
      <div className="bg-white border border-zinc-200/90 rounded-3xl max-w-lg w-full shadow-2xl p-6 text-zinc-900 space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header Alert */}
        <div className="text-center space-y-2 pb-2 border-b border-zinc-100">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-zinc-950">
            {lockInfo?.code === 'TRIAL_EXPIRED' 
              ? 'انتهت الفترة التجريبية المجانية (14 يوماً)' 
              : 'انتهت صلاحية اشتراك شركتكم'}
          </h3>
          <p className="text-xs text-zinc-500">
            للاستمرار في تسجيل الحضور والانصراف ومتابعة موظفيك، يرجى تجديد الاشتراك عبر تطبيق إنستاباي.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-500 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-zinc-950">تم إرسال إثبات التحويل بنجاح!</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              يقوم فريق الدعم الآن بمراجعة العملية وتفعيل اشتراك شركتكم فوراً. شكراً لثقتكم بنا!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
            
            {error && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-700 font-bold">
                {error}
              </div>
            )}

            {/* Plan Picker */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1.5">اختر الباقة للتجديد:</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(plans).map(([code, p]) => (
                  <div
                    key={code}
                    onClick={() => setSelectedPlan(code)}
                    className={`p-3 rounded-2xl border cursor-pointer text-center transition-all ${
                      selectedPlan === code
                        ? 'bg-zinc-950 border-zinc-950 text-white shadow-md'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100/80'
                    }`}
                  >
                    <div className={`font-black text-xs ${selectedPlan === code ? 'text-white' : 'text-zinc-900'}`}>{p.name}</div>
                    <div className={`text-[11px] font-bold font-mono mt-0.5 ${selectedPlan === code ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly} ج.م
                    </div>
                    <div className={`text-[9px] mt-0.5 ${selectedPlan === code ? 'text-zinc-300' : 'text-zinc-500'}`}>{p.cap}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cycle toggle */}
            <div className="flex items-center justify-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  billingCycle === 'monthly' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                شهري ({currentPlanConfig.priceMonthly} ج.م)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  billingCycle === 'yearly' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                سنوي ({currentPlanConfig.priceYearly} ج.م) 🎁
              </button>
            </div>

            {/* InstaPay Transfer Box */}
            <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-purple-900 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>بيانات التحويل عبر InstaPay:</span>
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold">
                  بدون عمولات ⚡
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">معرف إنستاباي (Username):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-purple-700 text-sm" dir="ltr">
                      {paymentInfo.instapayUsername}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUsername}
                      className="p-1 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                      title="نسخ"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">رقم الهاتف:</span>
                  <span className="font-mono text-zinc-900 font-bold" dir="ltr">{paymentInfo.instapayPhone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">المبلغ المطلوب تحويله:</span>
                  <span className="font-black text-emerald-600 font-mono text-sm">{amountToPay} ج.م</span>
                </div>

                <a
                  href="https://ipn.eg/S/davidovic/instapay/3BW08C"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <span>⚡ فتح تطبيق إنستاباي للدفع المباشر</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">بنقرة واحدة</span>
                </a>
              </div>
            </div>

            {/* Reference & Phone input */}
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-700 mb-1 font-bold">رقم العملية من تطبيق إنستاباي (Reference):</label>
                <input
                  type="text"
                  placeholder="مثال: 41289033482"
                  value={instapayReference}
                  onChange={(e) => setInstapayReference(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-950 font-mono p-2.5 rounded-xl outline-none focus:bg-white focus:border-zinc-950"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-zinc-700 mb-1 font-bold">رقم الهاتف المحول منه (اختياري):</label>
                <input
                  type="tel"
                  placeholder="010xxxxxxxx"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-950 font-mono p-2.5 rounded-xl outline-none focus:bg-white focus:border-zinc-950"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-zinc-700 mb-1 font-bold">إرفاق سكرين شوت الإيصال (اختياري):</label>
                <label className="w-full bg-zinc-50 border border-dashed border-zinc-300 hover:border-zinc-500 p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-zinc-600">
                  <ImageIcon className="w-4 h-4 text-zinc-500" />
                  <span>{receiptImage ? 'تم اختيار صورة الإيصال بنجاح ✓' : 'اضغط لاختيار صورة التحويل'}</span>
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
