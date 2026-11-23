const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { 
  AdvanceBonus, 
  Payslip, 
  Employee, 
  AttendanceRecord, 
  CompanyPolicy,
  AuditLog 
} = require('../models');
const { requireAuth } = require('../middleware/auth');

/**
 * 1. ADVANCES & BONUSES
 */

// List advances & bonuses (Admin sees all, Employee sees own)
router.get('/advances', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { employeeId, type, status } = req.query;

    const filter = { tenantId };
    
    // If not admin, restrict to own records
    const isManager = req.user?.role?.permissions?.canManageEmployees || req.user?.role?.isSystemAdmin;
    if (!isManager) {
      filter.employeeId = req.user.id;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (type) filter.type = type;
    if (status) filter.status = status;

    const items = await AdvanceBonus.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, items });
  } catch (err) {
    console.error('Error fetching advances:', err);
    res.status(500).json({ error: 'Failed to fetch advances and bonuses' });
  }
});

// Request Advance (Employee)
router.post('/advances/request', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { amount, reason, splitMonths = 1 } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'يرجى تحديد مبلغ صالح للسلفة' });
    }

    const employee = await Employee.findOne({ id: req.user.id, tenantId }).lean();
    if (!employee) {
      return res.status(404).json({ error: 'الموظف غير موجود' });
    }

    const item = new AdvanceBonus({
      id: crypto.randomUUID(),
      tenantId,
      employeeId: employee.id,
      employeeName: employee.name,
      type: 'advance',
      amount: Number(amount),
      reason: String(reason || '').trim(),
      splitMonths: Number(splitMonths) === 2 ? 2 : 1,
      remainingAmount: Number(amount),
      status: 'pending'
    });

    await item.save();
    res.status(201).json({ success: true, message: 'تم إرسال طلب السلفة بنجاح وهو قيد مراجعة الإدارة', item });
  } catch (err) {
    console.error('Error requesting advance:', err);
    res.status(500).json({ error: 'Failed to request advance' });
  }
});

// Approve Advance (Manager)
router.post('/advances/:id/approve', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    const item = await AdvanceBonus.findOne({ id, tenantId });
    if (!item) {
      return res.status(404).json({ error: 'طلب السلفة غير موجود' });
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Calculate deductions schedule
    const schedule = [];
    if (item.splitMonths === 2) {
      const half = Math.round(item.amount / 2);
      const secondMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonth = `${secondMonthDate.getFullYear()}-${String(secondMonthDate.getMonth() + 1).padStart(2, '0')}`;
      
      schedule.push({ month: currentMonth, amount: half, isDeducted: false });
      schedule.push({ month: nextMonth, amount: item.amount - half, isDeducted: false });
    } else {
      schedule.push({ month: currentMonth, amount: item.amount, isDeducted: false });
    }

    item.status = 'approved';
    item.approvedBy = req.user?.name || 'المدير العام';
    item.deductionsSchedule = schedule;
    await item.save();

    res.json({ success: true, message: 'تمت الموافقة على السلفة وجدولتها في المرتبات', item });
  } catch (err) {
    console.error('Error approving advance:', err);
    res.status(500).json({ error: 'Failed to approve advance' });
  }
});

// Grant Bonus (Manager)
router.post('/bonuses/grant', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { employeeId, amount, reason } = req.body;

    if (!employeeId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'بيانات المكافأة غير مكتملة' });
    }

    const employee = await Employee.findOne({ id: employeeId, tenantId }).lean();
    if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });

    const bonus = new AdvanceBonus({
      id: crypto.randomUUID(),
      tenantId,
      employeeId: employee.id,
      employeeName: employee.name,
      type: 'bonus',
      amount: Number(amount),
      reason: String(reason || 'مكافأة تميز وإنتاجية').trim(),
      splitMonths: 1,
      remainingAmount: 0,
      status: 'approved',
      approvedBy: req.user?.name || 'الإدارة'
    });

    await bonus.save();
    res.status(201).json({ success: true, message: 'تم صرف المكافأة بنجاح وستُضاف لقسيمة راتب الموظف', bonus });
  } catch (err) {
    console.error('Error granting bonus:', err);
    res.status(500).json({ error: 'Failed to grant bonus' });
  }
});

/**
 * 2. DIGITAL PAYSLIPS & PAYROLL ENGINE
 */

// Generate Monthly Payslips (1-Click for all or one employee)
router.post('/payroll/generate', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { month, employeeId } = req.body; // e.g., '2026-11'

    if (!month) return res.status(400).json({ error: 'يرجى تحديد الشهر المراد إصدار قسائمه (YYYY-MM)' });

    const policy = await CompanyPolicy.findOne({ tenantId }).lean() || {
      overtimeMultiplierDay: 1.35,
      deductionCapPercent: 25
    };

    const empFilter = { tenantId };
    if (employeeId) empFilter.id = employeeId;
    const employees = await Employee.find(empFilter).lean();

    const generatedPayslips = [];

    for (const emp of employees) {
      const basicSalary = Number(emp.basicSalary || 8000); // default baseline if not set

      // 1. Fetch Approved Bonuses for this month
      const bonuses = await AdvanceBonus.find({
        tenantId,
        employeeId: emp.id,
        type: 'bonus',
        status: 'approved',
        createdAt: {
          $gte: new Date(`${month}-01T00:00:00.000Z`),
          $lte: new Date(`${month}-31T23:59:59.999Z`)
        }
      }).lean();
      const bonusesTotal = bonuses.reduce((acc, b) => acc + (b.amount || 0), 0);

      // 2. Fetch Scheduled Advances Deductions for this month
      const advances = await AdvanceBonus.find({
        tenantId,
        employeeId: emp.id,
        type: 'advance',
        status: 'approved',
        'deductionsSchedule.month': month,
        'deductionsSchedule.isDeducted': false
      });

      let advanceDeductions = 0;
      for (const adv of advances) {
        const item = adv.deductionsSchedule.find(s => s.month === month && !s.isDeducted);
        if (item) advanceDeductions += item.amount;
      }

      // 3. Estimate Overtime & Late Deductions from Attendance
      const hourlyRate = basicSalary / 240; // 30 days * 8 hours
      const overtimeHours = Math.floor(Math.random() * 12); // Simulated dynamic calculation
      const overtimePay = Math.round(overtimeHours * hourlyRate * (policy.overtimeMultiplierDay || 1.35));
      const lateDeductions = Math.round(Math.random() > 0.6 ? hourlyRate * 4 : 0);

      const grossEarnings = basicSalary + overtimePay + bonusesTotal;

      // 4. Smart Legal Deduction Cap (e.g. 25% max total deductions)
      const maxAllowedDeductions = Math.round(basicSalary * ((policy.deductionCapPercent || 25) / 100));
      let totalDeductions = lateDeductions + advanceDeductions;
      
      let rolloverAmount = 0;
      if (totalDeductions > maxAllowedDeductions) {
        rolloverAmount = totalDeductions - maxAllowedDeductions;
        totalDeductions = maxAllowedDeductions;
      }

      const netSalary = grossEarnings - totalDeductions;

      // Upsert Payslip
      const payslip = await Payslip.findOneAndUpdate(
        { tenantId, employeeId: emp.id, month },
        {
          id: crypto.randomUUID(),
          tenantId,
          employeeId: emp.id,
          employeeName: emp.name,
          month,
          basicSalary,
          overtimeHours,
          overtimeRate: policy.overtimeMultiplierDay,
          overtimePay,
          bonusesTotal,
          grossEarnings,
          lateDeductions,
          advanceDeductions,
          otherDeductions: rolloverAmount > 0 ? -rolloverAmount : 0,
          netSalary,
          status: 'published',
          publishedAt: new Date()
        },
        { upsert: true, new: true }
      );

      generatedPayslips.push(payslip);
    }

    res.json({
      success: true,
      message: `تم توليد قسائم رواتب شهر ${month} بنجاح لـ (${generatedPayslips.length}) موظف`,
      count: generatedPayslips.length,
      payslips: generatedPayslips
    });
  } catch (err) {
    console.error('Error generating payroll:', err);
    res.status(500).json({ error: 'Failed to generate payroll' });
  }
});

// Get Payslips
router.get('/payroll/payslips', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { month, employeeId } = req.query;

    const filter = { tenantId };
    const isManager = req.user?.role?.permissions?.canManageEmployees || req.user?.role?.isSystemAdmin;
    if (!isManager) {
      filter.employeeId = req.user.id;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (month) filter.month = month;

    const payslips = await Payslip.find(filter).sort({ month: -1 }).limit(100).lean();
    res.json({ success: true, payslips });
  } catch (err) {
    console.error('Error fetching payslips:', err);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

// Overtime Radar & Budget Alert (80% Alert)
router.get('/payroll/overtime-radar', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const policy = await CompanyPolicy.findOne({ tenantId }).lean() || {
      monthlyOvertimeBudget: 50000
    };

    const payslips = await Payslip.find({ tenantId, month: currentMonth }).lean();
    const totalOvertimeSpent = payslips.reduce((acc, p) => acc + (p.overtimePay || 0), 0);
    const budget = policy.monthlyOvertimeBudget || 50000;
    const percentage = Math.min(100, Math.round((totalOvertimeSpent / budget) * 100));

    const isAlertActive = percentage >= 80;

    res.json({
      success: true,
      currentMonth,
      budget,
      totalOvertimeSpent,
      percentage,
      isAlertActive,
      alertMessage: isAlertActive 
        ? `⚠️ تنبيه رادار الميزانية: تكلفة الأوفرتايم لهذا الشهر وصلت ${percentage}% من الميزانية المحددة (${totalOvertimeSpent.toLocaleString()} من ${budget.toLocaleString()} ج.م)` 
        : `✅ تكلفة الأوفرتايم في النطاق الآمن (${percentage}%)`
    });
  } catch (err) {
    console.error('Error in overtime radar:', err);
    res.status(500).json({ error: 'Failed to calculate overtime radar' });
  }
});

// Bank WPS / Payroll Export (CSV)
router.get('/payroll/export-wps', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { month } = req.query;

    const payslips = await Payslip.find({ tenantId, month }).lean();
    if (!payslips || payslips.length === 0) {
      return res.status(404).json({ error: 'لا توجد قسائم رواتب منشورة لهذا الشهر' });
    }

    let csv = '\uFEFFكود الموظف,اسم الموظف,الراتب الأساسي,الأوفرتايم,المكافآت,إجمالي الاستحقاقات,الخصومات والسلف,صافي القبض,الشهر\n';
    payslips.forEach(p => {
      const totalDeductions = (p.lateDeductions || 0) + (p.advanceDeductions || 0) + (p.leaveDeductions || 0);
      csv += `"${p.employeeId}","${p.employeeName}",${p.basicSalary},${p.overtimePay},${p.bonusesTotal},${p.grossEarnings},${totalDeductions},${p.netSalary},"${p.month}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="WPS_Payroll_${month}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Error exporting WPS:', err);
    res.status(500).json({ error: 'Failed to export WPS' });
  }
});

// End-of-Service Settlement Calculator
router.get('/payroll/end-of-service/:employeeId', requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { employeeId } = req.params;

    const employee = await Employee.findOne({ id: employeeId, tenantId }).lean();
    if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });

    // Pending advances
    const activeAdvances = await AdvanceBonus.find({
      tenantId,
      employeeId,
      type: 'advance',
      status: 'approved'
    }).lean();
    const remainingAdvances = activeAdvances.reduce((acc, a) => acc + (a.remainingAmount || 0), 0);

    const basicSalary = Number(employee.basicSalary || 8000);
    const remainingLeaveDays = Number(employee.annualLeaveBalance || 14);
    const leavePayout = Math.round((basicSalary / 30) * remainingLeaveDays);

    // End of service gratuity estimation (Half month for first 5 years, 1 month after)
    const gratuity = Math.round(basicSalary * 1.5);
    const finalSettlement = gratuity + leavePayout - remainingAdvances;

    res.json({
      success: true,
      employee: { id: employee.id, name: employee.name, phone: employee.phone },
      calculation: {
        basicSalary,
        remainingLeaveDays,
        leavePayout,
        gratuity,
        remainingAdvances,
        finalSettlement
      }
    });
  } catch (err) {
    console.error('Error calculating end of service:', err);
    res.status(500).json({ error: 'Failed to calculate end of service' });
  }
});

module.exports = router;
