import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Crosshair, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Globe,
  Copy,
  Check,
  Share2
} from 'lucide-react';
import { api, getResolvedSubdomain } from '../api';
import { companyConfig } from '../config/company.config';
import { compressImage } from '../utils/imageCompressor';
import { updateAppBranding } from '../utils/appBranding';
import { extractDominantColor } from '../utils/colorExtractor';

export function OfficeSettingsTab({ onSettingsUpdated }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branchForm, setBranchForm] = useState({
    name: '',
    city: '',
    sectorId: '',
    latitude: 30.0444,
    longitude: 31.2357,
    radiusMeters: companyConfig.defaults.defaultRadiusMeters || 100
  });

  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add Branch Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBranchForm, setNewBranchForm] = useState({
    name: '',
    city: 'القاهرة',
    sectorId: '',
    latitude: 30.0444,
    longitude: 31.2357,
    radiusMeters: companyConfig.defaults.defaultRadiusMeters || 100
  });
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [isDeletingBranch, setIsDeletingBranch] = useState(false);

  // Company Brand & Identity State
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#10B981');
  const [tenantSlug, setTenantSlug] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState('');
  const [brandingError, setBrandingError] = useState('');

  const loadData = async () => {
    try {
      // Determine active tenant slug
      const resolved = getResolvedSubdomain();
      let activeSlug = resolved;
      if (!activeSlug) {
        try {
          const userStr = localStorage.getItem('office_auth_user');
          if (userStr) {
            const u = JSON.parse(userStr);
            activeSlug = u.tenantSlug || (u.tenantId && u.tenantId !== 'default' ? u.tenantId.replace('tenant_', '') : '');
          }
        } catch (e) {}
      }
      setTenantSlug(activeSlug || '');

      const [res, sectorsRes] = await Promise.all([
        api.getSettings(),
        api.getSectors().catch(() => ({ sectors: [] }))
      ]);

      if (sectorsRes && sectorsRes.sectors) {
        setSectors(sectorsRes.sectors);
      }

      if (res.success) {
        if (res.settings) {
          setCompanyName(res.settings.companyName || companyConfig.companyName);
          setLogoUrl(res.settings.logoUrl || companyConfig.logoPath);
          if (res.settings.primaryColor) {
            setPrimaryColor(res.settings.primaryColor);
          }
        }

        const loadedBranches = res.branches || [];
        setBranches(loadedBranches);
        
        const b = loadedBranches.find(item => item.id === selectedBranchId) || loadedBranches[0];
        if (b) {
          setSelectedBranchId(b.id);
          setBranchForm({ ...b });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 300, 0.85);
        setLogoUrl(compressed);
        const extracted = await extractDominantColor(compressed);
        if (extracted && extracted.primary) {
          setPrimaryColor(extracted.primary);
        }
        setBrandingSuccess('');
        setBrandingError('');
      } catch (err) {
        setBrandingError(err.message || 'فشل معالجة صورة الشعار');
      }
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setBrandingError('يرجى كتابة اسم الشركة.');
      return;
    }

    setBrandingLoading(true);
    setBrandingError('');
    setBrandingSuccess('');

    try {
      const res = await api.updateSettings({
        companyName: companyName.trim(),
        logoUrl: logoUrl || '/brand/logo.svg',
        primaryColor
      });

      if (res.success) {
        updateAppBranding(companyName.trim(), logoUrl || '/brand/logo.svg', primaryColor, tenantSlug);
        setBrandingSuccess(`✅ تم حفظ وتحديث هوية وشعار الشركة بنجاح! الأيقونة والعنوان: ${companyName.trim()} - Office Attendance`);
        if (onSettingsUpdated) onSettingsUpdated();
      } else {
        setBrandingError(res.error || 'فشل تحديث هوية الشركة.');
      }
    } catch (err) {
      setBrandingError(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setBrandingLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBranchSelect = (id) => {
    setSelectedBranchId(id);
    const b = branches.find(item => item.id === id);
    if (b) {
      setBranchForm({ ...b });
      setSuccessMsg('');
      setErrorMsg('');
    }
  };

  const handleUseCurrentLocation = (isModal = false) => {
    if (!navigator.geolocation) {
      setErrorMsg('المتصفح لا يدعم تحديد الموقع الجغرافي.');
      return;
    }
    setGpsLoading(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        if (isModal) {
          setNewBranchForm(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
        } else {
          setBranchForm(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
        }
        setGpsLoading(false);
        setSuccessMsg(`تم جلب موقعك الحالي بنجاح. اضغط حفظ لاعتماده.`);
      },
      err => {
        setErrorMsg('فشل جلب الموقع: ' + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const radius = Math.max(10, parseInt(branchForm.radiusMeters, 10) || 100);
      const lat = parseFloat(branchForm.latitude);
      const lng = parseFloat(branchForm.longitude);

      const res = await api.updateBranch(selectedBranchId, {
        ...branchForm,
        latitude: lat,
        longitude: lng,
        radiusMeters: radius
      });

      if (res.success && res.branch) {
        setBranches(prev => prev.map(b => (b.id === res.branch.id ? res.branch : b)));
        setBranchForm({ ...res.branch });
        setSuccessMsg(`✅ تم حفظ وتثبيت إعدادات ${companyConfig.entitySingular} (${res.branch.name}) بنجاح! النطاق الحالي المعتمد: ${res.branch.radiusMeters} متر.`);
        if (onSettingsUpdated) onSettingsUpdated();
      } else {
        setErrorMsg(res.error || 'حدث خطأ في الحفظ');
      }
    } catch (err) {
      setErrorMsg(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranchForm.name.trim()) {
      setErrorMsg(`يرجى كتابة اسم ${companyConfig.entitySingular}.`);
      return;
    }

    setIsCreatingBranch(true);
    setErrorMsg('');
    try {
      const res = await api.createBranch({
        ...newBranchForm,
        radiusMeters: Math.max(10, parseInt(newBranchForm.radiusMeters, 10) || 100),
        latitude: parseFloat(newBranchForm.latitude),
        longitude: parseFloat(newBranchForm.longitude)
      });

      if (res.success && res.branch) {
        setBranches(prev => [...prev, res.branch]);
        setSelectedBranchId(res.branch.id);
        setBranchForm({ ...res.branch });
        setIsAddModalOpen(false);
        setNewBranchForm({
          name: '',
          city: 'القاهرة',
          sectorId: '',
          latitude: 30.0444,
          longitude: 31.2357,
          radiusMeters: companyConfig.defaults.defaultRadiusMeters || 100
        });
        setSuccessMsg(`✅ تم إنشاء ${companyConfig.entitySingular} (${res.branch.name}) بنجاح!`);
        if (onSettingsUpdated) onSettingsUpdated();
      } else {
        setErrorMsg(res.error || `فشل إنشاء ${companyConfig.entitySingular}.`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (branches.length <= 1) {
      setErrorMsg(`لا يمكن حذف ${companyConfig.entitySingular} الوحيد المتبقي بالنظام.`);
      return;
    }

    const b = branches.find(item => item.id === selectedBranchId);
    if (!b) return;

    if (!window.confirm(`هل أنت متأكد من حذف أو أرشفة ${companyConfig.entitySingular} "${b.name}"؟`)) {
      return;
    }

    setIsDeletingBranch(true);
    setErrorMsg('');
    try {
      const res = await api.deleteBranch(selectedBranchId);
      if (res.success) {
        const nextBranches = branches.filter(item => item.id !== selectedBranchId);
        setBranches(nextBranches);
        if (nextBranches.length > 0) {
          setSelectedBranchId(nextBranches[0].id);
          setBranchForm({ ...nextBranches[0] });
        }
        setSuccessMsg(`✅ تم حذف ${companyConfig.entitySingular} "${b.name}" بنجاح.`);
        if (onSettingsUpdated) onSettingsUpdated();
      } else {
        setErrorMsg(res.error || `فشل حذف ${companyConfig.entitySingular}.`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setIsDeletingBranch(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 text-right">

      {/* ================= COMPANY BRANDING & LOGO SECTION ================= */}
      <div className="bg-[#0E1118] border border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>هوية وشعار الشركة (Brand & Identity)</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded font-mono">
                  Office Attendance
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                تخصيص اسم شركتك والشعار ليظهرا كأيقونة رسمية للتطبيق وعنوان المتصفح
              </p>
            </div>
          </div>
        </div>

        {brandingSuccess && (
          <div className="bg-emerald-950/70 border border-emerald-700/80 p-3 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{brandingSuccess}</span>
          </div>
        )}

        {brandingError && (
          <div className="bg-rose-950/70 border border-rose-700/80 p-3 rounded-2xl flex items-center gap-2 text-rose-300 text-xs font-bold animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{brandingError}</span>
          </div>
        )}

        <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company Name */}
            <div>
              <label className="block text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>اسم الشركة أو المؤسسة:</span>
              </label>
              <input
                type="text"
                placeholder="مثال: شركة الأهرام، مستشفيات النيل..."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-[#08090C] border border-white/[0.08] focus:border-amber-400 text-sm text-white p-3 rounded-xl outline-none transition-all placeholder:text-zinc-500 font-medium"
                required
              />
            </div>

            {/* Logo Upload & Preview */}
            <div>
              <label className="block text-zinc-300 font-bold mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>لوجو الشركة (شعار التطبيق):</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-white/[0.1] p-1 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={logoUrl || '/brand/logo.svg'} 
                    alt="شعار الشركة" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs cursor-pointer border border-white/[0.08] transition-all">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{logoUrl && logoUrl !== '/brand/logo.svg' ? 'تغيير اللوجو' : 'رفع لوجو الشركة'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                    />
                  </label>
                  {logoUrl && logoUrl !== '/brand/logo.svg' && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('/brand/logo.svg')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      استعادة الافتراضي
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Color Swatch & Live Indicator */}
          {logoUrl && logoUrl !== '/brand/logo.svg' && (
            <div className="flex items-center gap-2 p-2.5 bg-zinc-950/80 border border-white/[0.08] rounded-xl">
              <span className="text-[11px] text-zinc-400 font-bold">اللون المستخرج تلقائياً من الشعار:</span>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: primaryColor }} />
                <span className="font-mono text-[10px] text-emerald-400 font-bold" dir="ltr">{primaryColor}</span>
                <span className="text-[10px] text-zinc-500">(يتم تطبيقه على أزرار وسمات التطبيق)</span>
              </div>
            </div>
          )}

          {/* Live Preview Bar */}
          <div className="p-3 bg-zinc-950/70 border border-white/[0.06] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold block">معاينة عنوان وأيقونة البرنامج في المتصفح والموبايل:</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/[0.1] p-0.5 flex items-center justify-center shrink-0" style={{ borderColor: primaryColor }}>
                  <img src={logoUrl || '/brand/logo.svg'} alt="" className="w-full h-full object-contain" />
                </div>
                <span className="text-xs font-bold text-white">
                  {companyName.trim() || 'اسم شركتك'} - Office Attendance
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={brandingLoading}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{brandingLoading ? 'جاري الحفظ...' : 'حفظ وتطبيق هوية الشركة'}</span>
            </button>
          </div>

          {/* Dedicated Company Link for Employees */}
          {tenantSlug && (
            <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>رابط شركتك المخصص للموظفين (تثبيت ودخول مباشر):</span>
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                  رابط دائم
                </span>
              </div>

              <div className="bg-[#08090C] border border-white/[0.08] p-2.5 rounded-xl flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-emerald-300 font-bold select-all truncate" dir="ltr">
                  {typeof window !== 'undefined' ? `${window.location.origin}/t/${tenantSlug}` : `/t/${tenantSlug}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/t/${tenantSlug}`;
                    navigator.clipboard.writeText(link);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                  }}
                  className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`رابط تطبيق الحضور والانصراف الرسمي لشركة ${companyName || 'شركتنا'}:\n${typeof window !== 'undefined' ? window.location.origin : ''}/t/${tenantSlug}\nيمكنكم الدخول وتثبيت التطبيق على هواتفكم الآن.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>إرسال الرابط لموظفيك عبر واتساب 💬</span>
                </a>
              </div>

              <p className="text-[10px] text-zinc-400 leading-relaxed">
                💡 شارك هذا الرابط مع موظفيك. عند فتحه على الهاتف سيظهر باسم وهوية ولوجو شركتك ويمكنهم تثبيته كتطبيق مباشر على الشاشة الرئيسية!
              </p>
            </div>
          )}
        </form>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-amber-400">
            إدارة {companyConfig.entityPlural} ونطاق الـ GPS ({branches.length} {companyConfig.entitySingular})
          </h2>
          <p className="text-xs text-zinc-400">
            تحديد الإحداثيات الجغرافية ونطاق الحضور الدقيق لكل {companyConfig.entitySingular} على حدة.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="py-2 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة {companyConfig.entitySingular} جديد</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/70 border border-emerald-700/80 p-3 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-950/70 border border-rose-700/80 p-3 rounded-2xl flex items-center gap-2 text-rose-300 text-xs font-bold animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Branch Selector Pills */}
      <div>
        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
          اختر {companyConfig.entitySingular} للتعديل على إحداثياته ونطاقه:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {branches.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => handleBranchSelect(b.id)}
              className={`p-2.5 rounded-2xl text-right border transition-all ${
                selectedBranchId === b.id
                  ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="font-black text-xs">{b.name}</div>
              <div className={`text-[10px] ${selectedBranchId === b.id ? 'text-zinc-900' : 'text-zinc-500'}`}>
                {b.city} • {b.radiusMeters}م
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Branch Settings Form */}
      {selectedBranchId && (
        <form onSubmit={handleSaveBranch} className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h3 className="font-black text-sm text-zinc-100">
                إعدادات {companyConfig.entitySingular}: <span className="text-amber-400 font-black">"{branchForm.name}"</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                {branchForm.city || 'الفرع'}
              </span>
              {branches.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteBranch}
                  disabled={isDeletingBranch}
                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/30 transition-colors"
                  title={`حذف هذا الـ ${companyConfig.entitySingular}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                اسم {companyConfig.entitySingular}:
              </label>
              <input
                type="text"
                value={branchForm.name}
                onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                className="w-full p-2.5 text-xs font-bold rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">المدينة / المنطقة:</label>
              <input
                type="text"
                value={branchForm.city}
                onChange={e => setBranchForm({ ...branchForm, city: e.target.value })}
                className="w-full p-2.5 text-xs font-bold rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* GPS Coordinates Box */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>إحداثيات المقر الجغرافية لهذا الـ {companyConfig.entitySingular}</span>
              </span>
              <button
                type="button"
                onClick={() => handleUseCurrentLocation(false)}
                disabled={gpsLoading}
                className="text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                <span>{gpsLoading ? 'جاري التحديد...' : 'تعيين موقعي الحالي لهذا المقر'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  خط العرض <span className="font-mono text-zinc-500 font-normal">(Lat)</span>:
                </label>
                <input
                  type="number"
                  step="any"
                  dir="ltr"
                  value={branchForm.latitude || ''}
                  onChange={e => setBranchForm({ ...branchForm, latitude: e.target.value })}
                  className="w-full p-2.5 text-xs font-mono font-bold text-left rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  خط الطول <span className="font-mono text-zinc-500 font-normal">(Lng)</span>:
                </label>
                <input
                  type="number"
                  step="any"
                  dir="ltr"
                  value={branchForm.longitude || ''}
                  onChange={e => setBranchForm({ ...branchForm, longitude: e.target.value })}
                  className="w-full p-2.5 text-xs font-mono font-bold text-left rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Radius Slider & Controls */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">
                نطاق الحضور المسموح به لهذا الـ {companyConfig.entitySingular}:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="5"
                  value={branchForm.radiusMeters || 100}
                  onChange={e => setBranchForm({ ...branchForm, radiusMeters: Math.max(10, parseInt(e.target.value, 10) || 10) })}
                  className="w-20 p-1.5 text-xs font-mono font-black text-center rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg">
                  متر
                </span>
              </div>
            </div>

            {/* Quick Preset Buttons & Steppers */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-zinc-400 font-bold ml-1">تحديد سريع:</span>
              {[30, 50, 75, 100, 150, 200].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBranchForm(prev => ({ ...prev, radiusMeters: val }))}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                    branchForm.radiusMeters === val
                      ? 'bg-amber-500 text-black shadow-sm font-black'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  {val}م
                </button>
              ))}
              <div className="mr-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBranchForm(prev => ({ ...prev, radiusMeters: Math.max(10, (prev.radiusMeters || 100) - 10) }))}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800"
                  title="تقليل 10 أمتار"
                >
                  -10م
                </button>
                <button
                  type="button"
                  onClick={() => setBranchForm(prev => ({ ...prev, radiusMeters: (prev.radiusMeters || 100) + 10 }))}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800"
                  title="زيادة 10 أمتار"
                >
                  +10م
                </button>
              </div>
            </div>

            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={branchForm.radiusMeters || 100}
              onChange={e => setBranchForm({ ...branchForm, radiusMeters: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
              <span>20م (مبنى ضيق)</span>
              <span>100م (موصى به لـ {companyConfig.entitySingular})</span>
              <span>500م (نطاق واسع)</span>
            </div>
          </div>

          {/* Submit Save */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-black" />
            <span>{loading ? 'جاري الحفظ...' : `حفظ إعدادات ${branchForm.name}`}</span>
          </button>
        </form>
      )}

      {/* Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm text-zinc-100">إضافة {companyConfig.entitySingular} جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  اسم {companyConfig.entitySingular} (مثلاً: الفرع الرئيسي، فرع المعادي):
                </label>
                <input
                  type="text"
                  placeholder={`اسم ${companyConfig.entitySingular}`}
                  value={newBranchForm.name}
                  onChange={e => setNewBranchForm({ ...newBranchForm, name: e.target.value })}
                  className="w-full p-2.5 text-xs font-bold rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">المدينة / المحافظة:</label>
                  <input
                    type="text"
                    placeholder="مثلاً: القاهرة"
                    value={newBranchForm.city}
                    onChange={e => setNewBranchForm({ ...newBranchForm, city: e.target.value })}
                    className="w-full p-2.5 text-xs font-bold rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">نطاق الحضور (بالمتر):</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={newBranchForm.radiusMeters}
                    onChange={e => setNewBranchForm({ ...newBranchForm, radiusMeters: parseInt(e.target.value, 10) || 100 })}
                    className="w-full p-2.5 text-xs font-mono font-bold rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {sectors.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">القطاع / المنطقة التابع لها:</label>
                  <select
                    value={newBranchForm.sectorId}
                    onChange={e => setNewBranchForm({ ...newBranchForm, sectorId: e.target.value })}
                    className="w-full p-2.5 text-xs font-bold rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">بدون قطاع محدد</option>
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* GPS Coordinates in Modal */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>الإحداثيات الجغرافية</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUseCurrentLocation(true)}
                    disabled={gpsLoading}
                    className="text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Crosshair className="w-3 h-3 text-amber-400" />
                    <span>{gpsLoading ? 'جاري التحديد...' : 'تعيين موقعي الحالي'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-500">Lat:</span>
                    <input
                      type="number"
                      step="any"
                      dir="ltr"
                      value={newBranchForm.latitude}
                      onChange={e => setNewBranchForm({ ...newBranchForm, latitude: e.target.value })}
                      className="w-full p-2 text-xs font-mono font-bold text-left rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500">Lng:</span>
                    <input
                      type="number"
                      step="any"
                      dir="ltr"
                      value={newBranchForm.longitude}
                      onChange={e => setNewBranchForm({ ...newBranchForm, longitude: e.target.value })}
                      className="w-full p-2 text-xs font-mono font-bold text-left rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isCreatingBranch}
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingBranch ? 'جاري الإضافة...' : `إضافة الـ ${companyConfig.entitySingular}`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
