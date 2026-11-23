import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  LogIn, 
  LogOut, 
  Timer, 
  Compass, 
  ShieldCheck, 
  FileText,
  AlertTriangle,
  Building2,
  Sparkles,
  Send,
  Hourglass,
  RefreshCw
} from 'lucide-react';
import { api } from '../api';
import { companyConfig } from '../config/company.config';

export function CheckInTab({ currentUser, officeSettings, onAttendanceUpdated }) {
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [completedRecord, setCompletedRecord] = useState(null);
  const [todayEarlyRequest, setTodayEarlyRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [earlySubmitting, setEarlySubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // High-level authority: Executive Director, Area Manager, Branch Manager, or anyone granted override_early_checkout permission
  const hasOverridePermission = currentUser.permissions && currentUser.permissions.override_early_checkout;
  const isExecutiveOrManager = [
    'executive_director',
    'area_manager',
    'branch_manager'
  ].includes(currentUser.titleCode) || Boolean(hasOverridePermission) || Boolean(currentUser.isSuperAdmin);

  // Branches & Mission State
  const [allBranches, setAllBranches] = useState([]);
  const [todayMission, setTodayMission] = useState(null);

  // Safe time formatting helper
  const safeTimeFormat = (timeStr) => {
    if (!timeStr) return '--:--';
    try {
      const clean = typeof timeStr === 'string' ? timeStr.replace(' ', 'T') : timeStr;
      const d = new Date(clean);
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '--:--';
    }
  };

  // Employee's regular home branch with solid fallbacks
  const fallbackHome = (allBranches || []).find(b => b.id === currentUser?.branchId) || {
    id: currentUser?.branchId || 'branch_october2',
    name: currentUser?.branchName || 'اكتوبر ٢',
    latitude: 29.9652734,
    longitude: 30.9634410,
    radiusMeters: 150
  };

  const homeBranch = currentUser?.branchDetails || fallbackHome;

  // If employee has an approved work mission today at another branch, dual-geofence applies!
  const missionBranch = todayMission && todayMission.missionBranchId
    ? (allBranches || []).find(b => b.id === todayMission.missionBranchId)
    : null;

  const branch = {
    id: homeBranch?.id || 'branch_october2',
    name: homeBranch?.name || currentUser?.branchName || companyConfig.entitySingular,
    latitude: Number(homeBranch?.latitude || 29.9652734),
    longitude: Number(homeBranch?.longitude || 30.9634410),
    radiusMeters: Number(homeBranch?.radiusMeters || 150)
  };
  
  // Real Phone GPS State (No Simulation)
  const [userCoords, setUserCoords] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState({
    distanceMeters: null,
    isWithinOffice: false,
    activeBranchName: null,
    isWorkMission: false,
    message: null,
    checkedAt: null
  });
  const [gpsLoading, setGpsLoading] = useState(false);

  // Early Checkout Modal state
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [earlyReason, setEarlyReason] = useState('');

  // 1-Tap Check-out Pulse state
  const [showPulseModal, setShowPulseModal] = useState(false);
  const [pulseSubmitted, setPulseSubmitted] = useState(false);

  const shiftHours = officeSettings?.shiftHours || 8;
  const shiftSeconds = shiftHours * 3600;

  // Real GPS reader using phone hardware
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('المتصفح أو الهاتف لا يدعم تحديد الموقع الجغرافي (GPS).'));
      }

      navigator.geolocation.getCurrentPosition(
        pos => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        err => {
          let msg = 'تعذر الوصول إلى موقع الـ GPS للهاتف.';
          if (err.code === 1) {
            msg = 'تم رفض إذن تحديد الموقع. يرجى تفعيل خدمة الـ GPS في الهاتف والسماح للمتصفح بالوصول لموقعك لتسجيل الحضور.';
          } else if (err.code === 2) {
            msg = 'إشارة الـ GPS غير متوفرة حالياً، يرجى تشغيل الموقع والتأكد من وضوح الإشارة.';
          } else if (err.code === 3) {
            msg = 'انتهت مهلة قراءة إشارة الـ GPS. يرجى إعادة المحاولة.';
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
      );
    });
  };

  // Refresh live distance
  const refreshLocation = async (silent = false) => {
    setGpsLoading(true);
    if (!silent) setErrorMsg('');

    try {
      const coords = await getCurrentLocation();
      setUserCoords(coords);

      const res = await api.verifyDistance(coords.lat, coords.lng, branch.id, currentUser?.id);
      if (res.success) {
        setDistanceInfo({
          distanceMeters: res.distanceMeters,
          isWithinOffice: res.isWithinOffice,
          activeBranchName: res.branch?.name,
          isWorkMission: res.isWorkMission,
          message: res.message,
          checkedAt: new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })
        });
      }
      return coords;
    } catch (err) {
      if (!silent) setErrorMsg(err.message);
      return null;
    } finally {
      setGpsLoading(false);
    }
  };

  // Only auto-ping live location on initial mount if permission is ALREADY granted
  // If permission is 'prompt', do NOT show popup on load; wait for user tap
  useEffect(() => {
    let isMounted = true;
    async function checkPermissionAndPing() {
      if (typeof window !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state === 'granted') {
            if (isMounted) refreshLocation(true);
          }
          return;
        } catch (e) {
          // Permissions API query not supported for geolocation on some browsers
        }
      }
    }
    checkPermissionAndPing();
    return () => { isMounted = false; };
  }, [branch.id]);

  // Load branches list
  useEffect(() => {
    api.getBranches().then(res => {
      if (res.success && res.branches) {
        setAllBranches(res.branches);
      }
    }).catch(console.error);
  }, []);

  // Fetch today's attendance, approved work missions & early checkout requests
  const fetchAttendance = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const data = await api.getTodayAttendance();
      if (data.success) {
        const myActive = data.records.find(
          r => r.employeeId === currentUser.id && !r.checkOutTime
        );
        setCurrentAttendance(myActive || null);

        const myCompleted = data.records
          .filter(r => r.employeeId === currentUser.id && r.checkOutTime)
          .sort((a, b) => new Date(b.checkOutTime) - new Date(a.checkOutTime))[0];
        setCompletedRecord(myCompleted || null);

        if (myActive) {
          const checkInTime = new Date(myActive.checkInTime).getTime();
          const now = Date.now();
          setElapsedSeconds(Math.max(0, Math.floor((now - checkInTime) / 1000)));
        }
      }

      // Fetch approved work missions for current user today
      const allApprovedReqs = await api.getRequests({ employeeId: currentUser.id, status: 'approved' });
      if (allApprovedReqs.success && allApprovedReqs.requests) {
        const mission = allApprovedReqs.requests.find(
          r => r.type === 'leave' && r.leaveType === 'work_mission' &&
          (r.missionDate === todayStr || r.date === todayStr || (r.startDate <= todayStr && r.endDate >= todayStr))
        );
        setTodayMission(mission || null);
      }

      // Fetch early checkout requests for current user today
      const reqRes = await api.getRequests({ employeeId: currentUser.id, type: 'early_checkout' });
      if (reqRes.success && reqRes.requests) {
        const todayReq = reqRes.requests.find(
          r => r.date === todayStr || (r.requestedAt && r.requestedAt.startsWith(todayStr))
        );
        setTodayEarlyRequest(todayReq || null);
      }
    } catch (err) {
      console.error('fetchAttendance error:', err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentUser]);

  // Reactive poll if pending early checkout request exists
  useEffect(() => {
    if (todayEarlyRequest && todayEarlyRequest.status === 'pending') {
      const pollTimer = setInterval(() => {
        fetchAttendance();
      }, 5000);
      return () => clearInterval(pollTimer);
    }
  }, [todayEarlyRequest]);

  // Live timer tick every second if checked in
  useEffect(() => {
    let interval = null;
    if (currentAttendance) {
      interval = setInterval(() => {
        const checkInTime = new Date(currentAttendance.checkInTime).getTime();
        const now = Date.now();
        const secs = Math.max(0, Math.floor((now - checkInTime) / 1000));
        setElapsedSeconds(secs);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [currentAttendance]);

  // Perform Live Check In (Always clickable: checks real GPS, verifies distance, blocks if outside)
  const handleCheckIn = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Mandatory SAP enforcement: regular employees cannot check in without SAP code
    const isSuper = Boolean(currentUser?.isSuperAdmin);
    if (!isSuper && (!currentUser?.sapNumber || !String(currentUser.sapNumber).trim())) {
      setErrorMsg('عذراً، يجب تسجيل كود الـ SAP الخاص بك أولاً لتتمكن من تسجيل الحضور.');
      setLoading(false);
      return;
    }

    try {
      // 1. Read fresh real GPS from phone hardware
      let coords = null;
      try {
        coords = await getCurrentLocation();
        setUserCoords(coords);
      } catch (gpsErr) {
        setErrorMsg(gpsErr.message);
        setLoading(false);
        return;
      }

      // 2. Verify live distance against branch coordinates (dual geofence enabled)
      const distRes = await api.verifyDistance(coords.lat, coords.lng, branch.id, currentUser?.id);
      if (distRes.success) {
        setDistanceInfo({
          distanceMeters: distRes.distanceMeters,
          isWithinOffice: distRes.isWithinOffice,
          activeBranchName: distRes.branch?.name,
          isWorkMission: distRes.isWorkMission,
          message: distRes.message,
          checkedAt: new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })
        });

        // 3. Block if outside the allowed radius
        if (!distRes.isWithinOffice) {
          setErrorMsg(
            distRes.message || `عذراً، لا يمكنك تسجيل الحضور لأنك بعيد عن مقر ${companyConfig.entitySingular} المعتمد بمسافة ${distRes.distanceMeters} متر! (النطاق المسموح به ${branch.radiusMeters} متر فقط). يرجى التواجد داخل الفرع والمحاولة مجدداً.`
          );
          setLoading(false);
          return;
        }
      }

      // 4. Send check-in request with verified real coordinates and accuracy
      const res = await api.checkIn(currentUser.id, coords.lat, coords.lng, coords.accuracy);
      if (res.success) {
        setSuccessMsg(res.message || `تم تسجيل حضورك بنجاح`);
        setCurrentAttendance(res.record);
        if (onAttendanceUpdated) onAttendanceUpdated();
        fetchAttendance();
      } else {
        setErrorMsg(res.error || 'حدث خطأ أثناء تسجيل الحضور');
      }
    } catch (err) {
      setErrorMsg(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // Perform Direct Check Out (for regular checkout or executive override)
  const handleCheckOut = async (forceOverride = false, reason = '') => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Must read fresh real GPS from phone hardware
      let coords = null;
      try {
        coords = await getCurrentLocation();
        setUserCoords(coords);
      } catch (gpsErr) {
        setErrorMsg('لا يمكن تسجيل الانصراف بدون تفعيل الـ GPS والسماح للمتصفح بالوصول لموقعك الحالي: ' + gpsErr.message);
        setLoading(false);
        return;
      }

      // 2. Verify live distance against branch coordinates (dual geofence enabled)
      const distRes = await api.verifyDistance(coords.lat, coords.lng, branch.id, currentUser?.id);
      if (distRes.success) {
        setDistanceInfo({
          distanceMeters: distRes.distanceMeters,
          isWithinOffice: distRes.isWithinOffice,
          activeBranchName: distRes.branch?.name,
          isWorkMission: distRes.isWorkMission,
          message: distRes.message,
          checkedAt: new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })
        });

        // 3. STRICT GEOFENCE: Block check-out if outside the branch radius!
        if (!distRes.isWithinOffice) {
          setErrorMsg(
            distRes.message || `عذراً، لا يمكنك تسجيل الانصراف لأنك خارج النطاق الجغرافي المسموح به بمسافة ${distRes.distanceMeters} متر! لا يُسمح بتسجيل الانصراف إلا وأنت متواجد داخل حدود الفرع.`
          );
          setLoading(false);
          return;
        }
      }

      const res = await api.checkOut(
        currentUser.id,
        coords.lat,
        coords.lng,
        forceOverride,
        reason,
        coords.accuracy
      );
      if (res.success) {
        setSuccessMsg(res.message);
        setCurrentAttendance(null);
        setShowEarlyModal(false);
        setEarlyReason('');
        setShowPulseModal(true);
        if (onAttendanceUpdated) onAttendanceUpdated();
        fetchAttendance();
      } else {
        setErrorMsg(res.error || 'حدث خطأ أثناء تسجيل الانصراف');
      }
    } catch (err) {
      setErrorMsg(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // Submit Emergency Early Checkout Request (for subordinate titles)
  const handleEarlyCheckoutRequest = async () => {
    if (!earlyReason.trim()) {
      setErrorMsg('يرجى كتابة سبب الانصراف الطارئ بالتفصيل.');
      return;
    }

    setEarlySubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.createRequest({
        employeeId: currentUser.id,
        type: 'early_checkout',
        date: todayStr,
        reason: earlyReason.trim()
      });

      if (res.success) {
        setSuccessMsg('تم إرسال طلب الانصراف الطارئ بنجاح للإدارة المختصة. سيتم تسجيل انصرافك تلقائياً عند اعتماده.');
        setShowEarlyModal(false);
        setEarlyReason('');
        await fetchAttendance();
      } else {
        setErrorMsg(res.error || 'فشل إرسال طلب الانصراف الطارئ');
      }
    } catch (err) {
      setErrorMsg(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setEarlySubmitting(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = Math.max(0, shiftSeconds - elapsedSeconds);
  const progressPercent = Math.min(100, (elapsedSeconds / shiftSeconds) * 100);
  const canCheckOutRegular = elapsedSeconds >= shiftSeconds;

  const isEarlyPending = todayEarlyRequest && todayEarlyRequest.status === 'pending';
  const isEarlyApproved = todayEarlyRequest && todayEarlyRequest.status === 'approved';
  const isEarlyRejected = todayEarlyRequest && todayEarlyRequest.status === 'rejected';

  return (
    <div className="space-y-4 pb-8 text-right">
      {/* Notifications */}
      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-700 p-4 rounded-2xl flex items-start gap-2.5 text-rose-200 text-xs shadow-lg animate-fade-in leading-relaxed">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-bold">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-700 p-4 rounded-2xl flex items-start gap-2.5 text-emerald-200 text-xs shadow-lg animate-fade-in leading-relaxed">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-black">{successMsg}</div>
        </div>
      )}

      {/* Approved Mission Today Banner */}
      {todayMission && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-3xl text-right space-y-1.5 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-400">
            <Building2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-black">🎯 لديك مأمورية عمل معتمدة اليوم</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-bold">
            متاح لك تسجيل الحضور والانصراف بحرية من أي من الموقعين: <span className="text-emerald-300 font-black">فرعك الأساسي ({homeBranch.name})</span> أو <span className="text-emerald-300 font-black">فرع المأمورية ({missionBranch?.name || todayMission.missionBranchName || 'فرع المأمورية'})</span>.
          </p>
        </div>
      )}

      {/* GPS Location & Branch Card (Clean Production View - Real Phone GPS) */}
      <div className="bg-[#0E1118] rounded-3xl p-4 sm:p-5 shadow-xl border border-white/[0.08]">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5 text-zinc-100 font-black text-xs min-w-0">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">نطاق فرعك الجغرافي (GPS)</span>
          </div>

          {distanceInfo.distanceMeters !== null ? (
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-black flex items-center gap-1.5 shrink-0 ${
              distanceInfo.isWithinOffice 
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60' 
                : 'bg-rose-950/80 text-rose-400 border border-rose-700/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${distanceInfo.isWithinOffice ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`}></span>
              {distanceInfo.isWithinOffice ? (distanceInfo.isWorkMission ? 'داخل نطاق المأمورية' : `داخل نطاق ${companyConfig.entitySingular}`) : `خارج نطاق ${companyConfig.entitySingular}`}
            </span>
          ) : (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              {gpsLoading ? 'جاري القياس...' : 'اضغط للتحديد'}
            </span>
          )}
        </div>

        <div className="bg-[#08090C] p-3 rounded-2xl border border-white/[0.06] text-xs text-zinc-300 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-bold">الفرع المعتمد:</span>
            <span className="font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1 text-right">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{distanceInfo.activeBranchName ? `فرع ${distanceInfo.activeBranchName}` : `فرع ${branch.name}`}</span>
              {todayMission && <span className="text-[10px] text-emerald-300 font-normal mr-1">(أو المأمورية)</span>}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-bold">المسافة الحالية عن المقر:</span>
            <span className={`font-mono font-black text-sm ${
              distanceInfo.distanceMeters === null 
                ? 'text-zinc-400' 
                : distanceInfo.isWithinOffice 
                  ? 'text-emerald-400' 
                  : 'text-rose-400'
            }`}>
              {distanceInfo.distanceMeters !== null 
                ? `${distanceInfo.distanceMeters} متر` 
                : (gpsLoading ? 'جاري القياس...' : 'اضغط تسجيل الحضور للقياس')}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400">النطاق المسموح به:</span>
            <span className="font-semibold text-zinc-200">{branch.radiusMeters} متر</span>
          </div>
        </div>

        {/* Quick Location Refresh Bar */}
        <div className="pt-2.5 mt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">
            {distanceInfo.checkedAt ? `آخر فحص: ${distanceInfo.checkedAt}` : 'يتم الفحص تلقائياً عبر GPS الهاتف'}
          </span>
          <button
            type="button"
            onClick={() => refreshLocation(false)}
            disabled={gpsLoading}
            className="py-1 px-2.5 rounded-lg font-bold bg-[#08090C] hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'جاري الفحص...' : 'فحص الموقع الآن'}</span>
          </button>
        </div>
      </div>

      {/* Completed Checkout Today Banner */}
      {!currentAttendance && completedRecord && (
        <div className="bg-emerald-950/70 border border-emerald-600/70 p-4 rounded-3xl text-right space-y-2 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              تم تسجيل انصرافك لهذا اليوم بنجاح
            </span>
            <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-900/50 px-2 py-0.5 rounded-lg border border-emerald-700/50">
              {safeTimeFormat(completedRecord.checkOutTime)}
            </span>
          </div>
          <div className="text-xs text-zinc-300 bg-[#08090C] p-2.5 rounded-2xl border border-white/[0.06] flex justify-between items-center">
            <span className="text-zinc-400 font-bold">إجمالي ساعات العمل المسجلة:</span>
            <span className="font-mono font-black text-emerald-400">
              {Math.floor((Number(completedRecord.durationMinutes) || 0) / 60)} س و {Math.floor((Number(completedRecord.durationMinutes) || 0) % 60)} د
            </span>
          </div>
          {completedRecord.checkOutNotes && (
            <div className="text-[11px] text-zinc-300 bg-[#08090C] p-2 rounded-xl border border-white/[0.06]">
              <span className="font-bold text-emerald-400">بيان الانصراف: </span>
              {completedRecord.checkOutNotes}
            </div>
          )}
        </div>
      )}

      {/* Main Attendance Card */}
      <div className="bg-[#0E1118] rounded-3xl p-5 sm:p-6 shadow-xl border border-white/[0.08] text-center relative overflow-hidden">
        {!currentAttendance ? (
          <div>
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#08090C] flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-inner">
              <LogIn className="w-8 h-8 ml-0.5" />
            </div>
            <h2 className="text-lg font-black text-white mb-1">تسجيل الحضور اليومي</h2>
            <p className="text-xs text-zinc-400 mb-5 max-w-xs mx-auto leading-relaxed">
              اضغط الزر للتحقق من موقعك الحالي وتسجيل حضورك في <b>فرع {branch.name}</b> وبدء احتساب وردية الـ {shiftHours} ساعات.
            </p>

            {/* Check-In Button: ALWAYS CLICKABLE (Calculates real GPS on click, checks range, blocks if outside) */}
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#052e16] shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#052e16] shrink-0" />
              <span className="truncate">{loading ? 'جاري التحقق من موقعك وتسجيل الحضور...' : `تسجيل الحضور في فرع ${branch.name}`}</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-3.5 py-1.5 rounded-full text-xs font-black mb-3 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>تمام كدا انت دلوقتي في العمل</span>
            </div>

            <h2 className="text-xl font-black text-zinc-100 mb-0.5">وردية العمل جارية</h2>
            <p className="text-xs text-zinc-400 mb-5">
              مسجل في <b>فرع {branch.name}</b> الساعة {safeTimeFormat(currentAttendance.checkInTime)}
            </p>

            {/* Circular Timer Ring */}
            <div className="relative w-44 h-44 mx-auto mb-5 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="88" cy="88" r="76" stroke="#1f2430" strokeWidth="10" fill="transparent" />
                <circle
                  cx="88"
                  cy="88"
                  r="76"
                  stroke={canCheckOutRegular ? '#10b981' : '#34d399'}
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 76}
                  strokeDashoffset={2 * Math.PI * 76 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-zinc-400 mb-0.5">الوقت المنقضي</span>
                <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                  {formatTime(elapsedSeconds)}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 mt-0.5">
                  {Math.round(progressPercent)}% من الـ {shiftHours} ساعات
                </span>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="bg-[#08090C] border border-white/[0.06] rounded-2xl p-3 mb-4 text-xs flex items-center justify-between text-zinc-300">
              <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
                <Timer className="w-4 h-4 text-emerald-400" />
                <span>المتبقي لانتهاء الـ {shiftHours} ساعات:</span>
              </div>
              <span className={`font-mono font-black text-sm ${canCheckOutRegular ? 'text-emerald-400' : 'text-emerald-400'}`}>
                {canCheckOutRegular ? 'اكتملت ساعات العمل 🎉' : formatTime(remainingSeconds)}
              </span>
            </div>

            {/* Pending Early Checkout Notice Card */}
            {isEarlyPending && (
              <div className="bg-emerald-950/60 border border-emerald-500/60 p-4 rounded-2xl text-right mb-4 animate-pulse space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                    <Hourglass className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span>طلب انصراف طارئ قيد المراجعة</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    بانتظار موافقة الإدارة
                  </span>
                </div>
                <div className="text-xs text-zinc-300 bg-[#08090C] p-2.5 rounded-xl border border-white/[0.06]">
                  <span className="text-zinc-500 font-bold">السبب المرفوع: </span>
                  <span className="text-zinc-200 font-semibold">{todayEarlyRequest.reason}</span>
                </div>
                <p className="text-[11px] text-emerald-300 font-bold">
                  ⚡ سيتم تسجيل انصرافك وإنهاء ورديتك تلقائياً فور موافقة الإدارة المختصة.
                </p>
              </div>
            )}

            {/* Rejected Early Checkout Notice Card */}
            {isEarlyRejected && (
              <div className="bg-rose-950/80 border border-rose-700/80 p-3.5 rounded-2xl text-right mb-4 space-y-1">
                <div className="flex items-center gap-2 text-rose-300 font-black text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>تم رفض طلب الانصراف الطارئ</span>
                </div>
                <p className="text-xs text-rose-200">
                  ملاحظة الإدارة: {todayEarlyRequest.reviewNote || 'يرجى استكمال ساعات الوردية كاملة'}
                </p>
              </div>
            )}

            {/* Check-Out Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleCheckOut(false)}
                disabled={loading || !canCheckOutRegular}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  canCheckOutRegular
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-[#052e16] shadow-emerald-500/25 active:scale-[0.98]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
                }`}
              >
                {canCheckOutRegular ? <Unlock className="w-4 h-4 text-[#052e16]" /> : <Lock className="w-4 h-4 text-zinc-500" />}
                <span>
                  {canCheckOutRegular 
                    ? 'تسجيل الانصراف (Check Out)' 
                    : `الانصراف مقفل (متبقي ${formatTime(remainingSeconds)})`}
                </span>
              </button>

              {/* Early Checkout Trigger Button */}
              {!canCheckOutRegular && !isEarlyPending && (
                <button
                  type="button"
                  onClick={() => setShowEarlyModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-black text-emerald-400 bg-[#08090C] hover:bg-zinc-800 border border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isExecutiveOrManager 
                      ? 'تسجيل انصراف مبكر مباشر (صلاحية إدارية)' 
                      : 'طلب انصراف طارئ (يتطلب موافقة الإدارة المختصة)'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Early Checkout Modal */}
      {showEarlyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0E1118] rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-white/[0.08] text-right animate-scale-up text-zinc-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-base font-black text-white mb-1">
              {isExecutiveOrManager 
                ? 'تسجيل انصراف مبكر (صلاحية إدارية)' 
                : 'تقديم طلب انصراف مبكر طارئ'}
            </h3>
            
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              {isExecutiveOrManager 
                ? `بصفتك (${currentUser.jobTitle || 'مسؤول إداري'})، يحق لك إنهاء ورديتك مبكراً مع كتابة سبب الانصراف.`
                : `وفقاً للائحة ${companyConfig.companyName}، يتطلب الانصراف قبل إتمام الـ 8 ساعات تقديم طلب طارئ وموافقة الإدارة المختصة.`}
            </p>

            {!isExecutiveOrManager && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl text-[11px] text-emerald-300 font-bold mb-3 leading-relaxed">
                ⚠️ تنبيه: لن يتم تسجيل الانصراف فوراً، بل سيصل إشعار للإدارة لاعتماده. فور الموافقة سيتم إنهاء الوردية تلقائياً.
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">سبب الانصراف الطارئ:</label>
              <textarea
                value={earlyReason}
                onChange={e => setEarlyReason(e.target.value)}
                placeholder="اكتب سبب الانصراف بالتفصيل..."
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl bg-[#08090C] border border-white/[0.08] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowEarlyModal(false);
                  setEarlyReason('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-xs font-bold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
              >
                إلغاء
              </button>

              {isExecutiveOrManager ? (
                <button
                  type="button"
                  disabled={!earlyReason.trim() || loading}
                  onClick={() => handleCheckOut(true, earlyReason)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#052e16] text-xs font-black shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'جاري التأكيد...' : 'تأكيد الانصراف الفوري'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!earlyReason.trim() || earlySubmitting}
                  onClick={handleEarlyCheckoutRequest}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#052e16] text-xs font-black shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#052e16]" />
                  <span>{earlySubmitting ? 'جاري الإرسال...' : 'إرسال للإدارة'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1-Tap Check-out Pulse Modal (نبض الفريق) */}
      {showPulseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1118] border border-white/[0.08] p-6 rounded-3xl max-w-sm w-full space-y-4 text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">نبض الفريق • مجهول الهوية 🔒</span>
              <h3 className="text-lg font-black text-white">كيف كان يومك في العمل اليوم؟</h3>
              <p className="text-xs text-zinc-400">مشاركتك تساعد الإدارة على تحسين بيئة العمل وتخفيف الضغط.</p>
            </div>

            {pulseSubmitted ? (
              <div className="py-6 text-emerald-400 font-bold text-sm">
                شكراً لمشاركتك! نتمنى لك يوماً سعيداً 💚
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 py-2">
                <button
                  type="button"
                  onClick={async () => {
                    await api.submitPulse({ mood: 'happy' }).catch(() => {});
                    setPulseSubmitted(true);
                    setTimeout(() => setShowPulseModal(false), 1200);
                  }}
                  className="p-3 bg-[#08090C] border border-white/[0.08] hover:border-emerald-500 rounded-2xl transition-all active:scale-95 space-y-1 group cursor-pointer"
                >
                  <span className="text-3xl block group-hover:scale-110 transition-transform">😄</span>
                  <span className="text-xs font-bold text-zinc-300 block">مبسوط</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await api.submitPulse({ mood: 'neutral' }).catch(() => {});
                    setPulseSubmitted(true);
                    setTimeout(() => setShowPulseModal(false), 1200);
                  }}
                  className="p-3 bg-[#08090C] border border-white/[0.08] hover:border-emerald-500 rounded-2xl transition-all active:scale-95 space-y-1 group cursor-pointer"
                >
                  <span className="text-3xl block group-hover:scale-110 transition-transform">😐</span>
                  <span className="text-xs font-bold text-zinc-300 block">عادي</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await api.submitPulse({ mood: 'stressed' }).catch(() => {});
                    setPulseSubmitted(true);
                    setTimeout(() => setShowPulseModal(false), 1200);
                  }}
                  className="p-3 bg-[#08090C] border border-white/[0.08] hover:border-rose-500 rounded-2xl transition-all active:scale-95 space-y-1 group cursor-pointer"
                >
                  <span className="text-3xl block group-hover:scale-110 transition-transform">😫</span>
                  <span className="text-xs font-bold text-zinc-300 block">مضغوط</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPulseModal(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 pt-1"
            >
              تخطي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}