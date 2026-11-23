const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { 
  FieldVisit, 
  ShiftSchedule, 
  Employee, 
  Branch 
} = require('../models');
const { requireAuth } = require('../middleware/auth');

/**
 * 1. MULTI-STOP FIELD VISITS & MILEAGE TRACKER
 */

// Field Visit Check-In (at client site)
router.post('/field/checkin', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { clientName, locationName, latitude, longitude, notes, photoUrl } = req.body;

    if (!clientName) {
      return res.status(400).json({ error: 'يرجى إدخال اسم العميل أو موقع الزيارة' });
    }

    const employee = await Employee.findOne({ id: req.user.id, tenantId }).lean();
    if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });

    const visit = new FieldVisit({
      id: crypto.randomUUID(),
      tenantId,
      employeeId: employee.id,
      employeeName: employee.name,
      clientName: String(clientName).trim(),
      locationName: String(locationName || 'موقع العميل').trim(),
      latitude: Number(latitude || 0),
      longitude: Number(longitude || 0),
      checkInTime: new Date(),
      notes: String(notes || '').trim(),
      photoUrl: String(photoUrl || '').trim(),
      status: 'active'
    });

    await visit.save();
    res.status(201).json({ success: true, message: `تم تسجيل بدء زيارة (${clientName}) بنجاح`, visit });
  } catch (err) {
    console.error('Error in field checkin:', err);
    res.status(500).json({ error: 'Failed to record field check-in' });
  }
});

// Field Visit Check-Out (End visit, add mileage & expenses)
router.post('/field/checkout', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { visitId, mileageKm = 0, expenses = [] } = req.body;

    const visit = await FieldVisit.findOne({ id: visitId, tenantId, employeeId: req.user.id, status: 'active' });
    if (!visit) {
      return res.status(404).json({ error: 'الزيارة الميدانية غير موجودة أو مكتملة بالفعل' });
    }

    const checkOutTime = new Date();
    const durationMinutes = Math.max(1, Math.round((checkOutTime - new Date(visit.checkInTime)) / (1000 * 60)));
    
    // Egyptian standard fuel allowance (e.g. 5.5 EGP per Km)
    const fuelRatePerKm = 5.5;
    const fuelAllowance = Math.round(Number(mileageKm) * fuelRatePerKm);

    visit.checkOutTime = checkOutTime;
    visit.durationMinutes = durationMinutes;
    visit.mileageKm = Number(mileageKm);
    visit.fuelAllowance = fuelAllowance;
    visit.expenses = Array.isArray(expenses) ? expenses : [];
    visit.status = 'completed';

    await visit.save();
    res.json({
      success: true,
      message: `تم إنهاء الزيارة بنجاح (المدة: ${durationMinutes} دقيقة، بدل بنزين: ${fuelAllowance} ج.م)`,
      visit
    });
  } catch (err) {
    console.error('Error in field checkout:', err);
    res.status(500).json({ error: 'Failed to record field check-out' });
  }
});

// List Field Visits
router.get('/field/visits', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { employeeId, date } = req.query;

    const filter = { tenantId };
    const isManager = req.user?.role?.permissions?.canManageEmployees || req.user?.role?.isSystemAdmin;
    if (!isManager) {
      filter.employeeId = req.user.id;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (date) {
      filter.checkInTime = {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lte: new Date(`${date}T23:59:59.999Z`)
      };
    }

    const visits = await FieldVisit.find(filter).sort({ checkInTime: -1 }).limit(100).lean();
    res.json({ success: true, visits });
  } catch (err) {
    console.error('Error fetching visits:', err);
    res.status(500).json({ error: 'Failed to fetch field visits' });
  }
});

// Privacy-First Live Field Map (Only active visits)
router.get('/field/live-map', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const activeVisits = await FieldVisit.find({
      tenantId,
      status: 'active',
      latitude: { $ne: 0 }
    }).select('id employeeId employeeName clientName locationName latitude longitude checkInTime notes').lean();

    res.json({ success: true, count: activeVisits.length, activeVisits });
  } catch (err) {
    console.error('Error fetching live map:', err);
    res.status(500).json({ error: 'Failed to fetch active field team' });
  }
});

/**
 * 2. VISUAL DRAG & DROP ROSTER & SHIFT ENGINE
 */

// Get Shifts
router.get('/shifts', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { startDate, endDate, branchId } = req.query;

    const filter = { tenantId };
    if (branchId) filter.branchId = branchId;

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const shifts = await ShiftSchedule.find(filter).sort({ date: 1, startTime: 1 }).lean();
    res.json({ success: true, shifts });
  } catch (err) {
    console.error('Error fetching shifts:', err);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

// Create / Update Shift
router.post('/shifts/create', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { 
      employeeId, 
      branchId, 
      date, 
      startTime, 
      endTime, 
      shiftType = 'regular',
      splitSecondStart,
      splitSecondEnd,
      isBiddingOpen = false 
    } = req.body;

    if (!employeeId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'يرجى استكمال بيانات الشفت المطلوبة' });
    }

    const employee = await Employee.findOne({ id: employeeId, tenantId }).lean();
    if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });

    const shift = new ShiftSchedule({
      id: crypto.randomUUID(),
      tenantId,
      branchId: branchId || '',
      employeeId: employee.id,
      employeeName: employee.name,
      date,
      startTime,
      endTime,
      shiftType,
      splitSecondStart: splitSecondStart || '',
      splitSecondEnd: splitSecondEnd || '',
      isBiddingOpen: Boolean(isBiddingOpen),
      status: 'scheduled'
    });

    await shift.save();
    res.status(201).json({ success: true, message: `تم جدولة وردية (${shiftType}) للموظف ${employee.name} بنجاح`, shift });
  } catch (err) {
    console.error('Error creating shift:', err);
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

// AI Auto-Scheduler for the Week
router.post('/shifts/auto-schedule', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { startDate, daysCount = 7, branchId } = req.body;

    const employees = await Employee.find({ tenantId }).lean();
    if (employees.length === 0) {
      return res.status(400).json({ error: 'لا يوجد موظفين لجدولتهم' });
    }

    const start = new Date(startDate || Date.now());
    const generatedShifts = [];

    for (let d = 0; d < daysCount; d++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + d);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Assign employees to morning and evening shifts
      employees.forEach((emp, index) => {
        const isEvening = index % 2 !== 0;
        const shift = new ShiftSchedule({
          id: crypto.randomUUID(),
          tenantId,
          branchId: branchId || '',
          employeeId: emp.id,
          employeeName: emp.name,
          date: dateStr,
          startTime: isEvening ? '14:00' : '08:00',
          endTime: isEvening ? '22:00' : '16:00',
          shiftType: 'regular',
          status: 'scheduled'
        });
        generatedShifts.push(shift);
      });
    }

    await ShiftSchedule.insertMany(generatedShifts);

    res.json({
      success: true,
      message: `تم توزيع شفتات الأسبوع ذكياً لـ (${employees.length}) موظف بإجمالي (${generatedShifts.length}) وردية`,
      count: generatedShifts.length
    });
  } catch (err) {
    console.error('Error in auto scheduling:', err);
    res.status(500).json({ error: 'Failed to auto schedule shifts' });
  }
});

module.exports = router;
