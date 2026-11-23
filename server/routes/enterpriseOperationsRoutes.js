const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { 
  HRVault, 
  DailyPulse, 
  DeskBooking, 
  CompanyPolicy, 
  Employee 
} = require('../models');
const { requireAuth } = require('../middleware/auth');

/**
 * 1. MINI HR VAULT (30-Day Expiry Alerts)
 */

router.get('/hr-vault', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { docType, expiringOnly } = req.query;

    const filter = { tenantId, isResolved: false };
    if (docType) filter.docType = docType;

    const now = new Date();
    if (expiringOnly === 'true') {
      const in30Days = new Date();
      in30Days.setDate(now.getDate() + 30);
      filter.expiryDate = { $lte: in30Days };
    }

    const docs = await HRVault.find(filter).sort({ expiryDate: 1 }).lean();

    // Categorize
    const enriched = docs.map(d => {
      const diffDays = Math.ceil((new Date(d.expiryDate) - now) / (1000 * 60 * 60 * 24));
      return {
        ...d,
        daysRemaining: diffDays,
        isExpired: diffDays < 0,
        isUrgent: diffDays >= 0 && diffDays <= 30
      };
    });

    res.json({ success: true, count: enriched.length, documents: enriched });
  } catch (err) {
    console.error('Error fetching HR vault:', err);
    res.status(500).json({ error: 'Failed to fetch HR documents' });
  }
});

router.post('/hr-vault/add', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { employeeId, docType, title, expiryDate, notes, fileUrl } = req.body;

    if (!employeeId || !docType || !title || !expiryDate) {
      return res.status(400).json({ error: 'يرجى استكمال بيانات الوثيقة وتاريخ الانتهاء' });
    }

    const emp = await Employee.findOne({ id: employeeId, tenantId }).lean();
    if (!emp) return res.status(404).json({ error: 'الموظف غير موجود' });

    const doc = new HRVault({
      id: crypto.randomUUID(),
      tenantId,
      employeeId: emp.id,
      employeeName: emp.name,
      docType,
      title: String(title).trim(),
      expiryDate: new Date(expiryDate),
      notes: String(notes || '').trim(),
      fileUrl: String(fileUrl || '').trim()
    });

    await doc.save();
    res.status(201).json({ success: true, message: 'تم حفظ الوثيقة في خزنة الموارد البشرية وتفعيل التنبيه التلقائي', doc });
  } catch (err) {
    console.error('Error adding to HR vault:', err);
    res.status(500).json({ error: 'Failed to add HR document' });
  }
});

/**
 * 2. 1-TAP CHECK-OUT PULSE & ANONYMOUS MOOD
 */

router.post('/pulse/submit', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { mood, comment } = req.body; // 'happy', 'neutral', 'stressed'

    if (!['happy', 'neutral', 'stressed'].includes(mood)) {
      return res.status(400).json({ error: 'حالة المزاج غير صالحة' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const pulse = new DailyPulse({
      id: crypto.randomUUID(),
      tenantId,
      branchId: req.user?.branchId || '',
      date: todayStr,
      mood,
      comment: String(comment || '').trim()
    });

    await pulse.save();
    res.json({ success: true, message: 'شكراً لمشاركتك نبض اليوم! 💛' });
  } catch (err) {
    console.error('Error submitting pulse:', err);
    res.status(500).json({ error: 'Failed to record mood pulse' });
  }
});

router.get('/pulse/analytics', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const pulses = await DailyPulse.find({ tenantId }).sort({ createdAt: -1 }).limit(200).lean();

    const counts = { happy: 0, neutral: 0, stressed: 0 };
    pulses.forEach(p => {
      if (counts[p.mood] !== undefined) counts[p.mood]++;
    });

    const total = pulses.length || 1;
    const happinessScore = Math.round(((counts.happy * 100) + (counts.neutral * 50)) / total);

    res.json({
      success: true,
      totalResponses: pulses.length,
      happinessScore, // 0 - 100
      breakdown: {
        happyPercent: Math.round((counts.happy / total) * 100),
        neutralPercent: Math.round((counts.neutral / total) * 100),
        stressedPercent: Math.round((counts.stressed / total) * 100)
      },
      recentFeedback: pulses.filter(p => p.comment).slice(0, 10).map(p => ({ mood: p.mood, comment: p.comment, date: p.date }))
    });
  } catch (err) {
    console.error('Error in pulse analytics:', err);
    res.status(500).json({ error: 'Failed to fetch pulse analytics' });
  }
});

/**
 * 3. DESK & MEETING ROOM BOOKING (Hot-Desking)
 */

router.get('/booking/resources', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const bookings = await DeskBooking.find({ tenantId, date: targetDate, status: 'confirmed' }).lean();
    res.json({ success: true, targetDate, bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch desk bookings' });
  }
});

router.post('/booking/reserve', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { resourceName, resourceType = 'desk', date, timeSlot = 'full_day' } = req.body;

    const existing = await DeskBooking.findOne({
      tenantId,
      date,
      resourceName,
      timeSlot,
      status: 'confirmed'
    });

    if (existing) {
      return res.status(400).json({ error: 'هذا المكتب أو القاعة محجوزة بالفعل في هذا التوقيت' });
    }

    const booking = new DeskBooking({
      id: crypto.randomUUID(),
      tenantId,
      employeeId: req.user.id,
      employeeName: req.user.name,
      branchId: req.user.branchId || '',
      resourceType,
      resourceName,
      date,
      timeSlot,
      status: 'confirmed'
    });

    await booking.save();
    res.status(201).json({ success: true, message: `تم حجز (${resourceName}) بنجاح ليوم ${date}`, booking });
  } catch (err) {
    console.error('Error reserving resource:', err);
    res.status(500).json({ error: 'Failed to reserve resource' });
  }
});

/**
 * 4. COMPANY POLICIES & EMERGENCY WEATHER OVERRIDE
 */

router.get('/policies', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    let policy = await CompanyPolicy.findOne({ tenantId }).lean();
    if (!policy) {
      policy = {
        tenantId,
        gracePeriodMinutes: 15,
        overtimeMultiplierDay: 1.35,
        overtimeMultiplierNight: 1.70,
        overtimeMultiplierHoliday: 2.00,
        deductionCapPercent: 25,
        monthlyOvertimeBudget: 50000,
        hybridWeeklyDays: 3,
        emergencyWeatherActive: false
      };
    }
    res.json({ success: true, policy });
  } catch (err) {
    console.error('Error fetching policy:', err);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

router.put('/policies', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const updateData = req.body;

    const policy = await CompanyPolicy.findOneAndUpdate(
      { tenantId },
      { ...updateData, tenantId, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'تم حفظ وتطبيق لوائح الشركة بنجاح', policy });
  } catch (err) {
    console.error('Error updating policy:', err);
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

// Emergency / Weather Override (1-Click toggle)
router.post('/policies/emergency-weather', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { active, notes } = req.body;

    const policy = await CompanyPolicy.findOneAndUpdate(
      { tenantId },
      { 
        emergencyWeatherActive: Boolean(active),
        emergencyWeatherNotes: String(notes || 'طقس سيئ / حالة طارئة: تم إلغاء احتساب التأخيرات اليوم والسماح بالعمل عن بُعد').trim(),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      emergencyWeatherActive: policy.emergencyWeatherActive,
      message: policy.emergencyWeatherActive
        ? '🚨 تم تفعيل وضع الطوارئ والطقس السيئ بنجاح: تم إعفاء الجميع من التأخير اليوم!'
        : '✅ تم إنهاء وضع الطوارئ والعودة للنظام المعتاد.'
    });
  } catch (err) {
    console.error('Error in emergency weather override:', err);
    res.status(500).json({ error: 'Failed to toggle emergency weather' });
  }
});

module.exports = router;
