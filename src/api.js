// API Service for Office Attendance App
import { getOrCreateDeviceId, getDeviceSummary } from './utils/deviceHelper';

const BASE_URL = '/api';

export function getResolvedSubdomain() {
  if (typeof window === 'undefined') return '';

  // 1. Path-based tenant: /t/:slug or /tenant/:slug
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/(?:t|tenant)\/([a-z0-9-]+)/i);
  if (match && match[1]) {
    return match[1].toLowerCase().trim();
  }

  // 2. Query parameter: ?tenant=slug
  const params = new URLSearchParams(window.location.search);
  const paramTenant = params.get('tenant');
  if (paramTenant) return paramTenant.toLowerCase().trim();

  // 3. Subdomain check (excluding localhost, www, api)
  const host = window.location.hostname;
  if (host.endsWith('.vercel.app')) {
    const parts = host.split('.');
    if (parts.length > 3 && parts[0] !== 'www' && parts[0] !== 'api') {
      return parts[0].toLowerCase();
    }
    return '';
  }

  const parts = host.split('.');
  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'api' && parts[0] !== 'localhost') {
    return parts[0].toLowerCase();
  }

  // 4. If an authenticated user is currently logged in, use their tenant slug
  const userStr = localStorage.getItem('office_auth_user');
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u.tenantSlug) return u.tenantSlug.toLowerCase();
      if (u.tenantId && u.tenantId !== 'default') return u.tenantId.replace('tenant_', '').toLowerCase();
    } catch (e) {}
  }

  return '';
}

function getAuthHeaders(extraHeaders = {}) {
  let token = typeof localStorage !== 'undefined' ? localStorage.getItem('office_auth_token') : null;
  const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('office_auth_user') : null;
  let userId = '';
  let userPhone = '';
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      userId = u.id || '';
      userPhone = u.phone || '';
      if (!token && u.token) {
        token = u.token;
        localStorage.setItem('office_auth_token', token);
      }
    } catch (e) {}
  }

  const deviceId = getOrCreateDeviceId();
  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': deviceId,
    ...extraHeaders
  };

  const tenantSlug = getResolvedSubdomain();
  if (tenantSlug) {
    headers['x-tenant-slug'] = tenantSlug;
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = userId;
  }
  if (userPhone) {
    headers['x-user-phone'] = userPhone;
  }
  return headers;
}

export const api = {
  // Sectors & Branches
  async getSectors() {
    const res = await fetch(`${BASE_URL}/sectors`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getBranches() {
    const res = await fetch(`${BASE_URL}/branches`, { headers: getAuthHeaders() });
    return res.json();
  },

  async updateBranch(id, data) {
    const res = await fetch(`${BASE_URL}/branches/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async createBranch(data) {
    const res = await fetch(`${BASE_URL}/branches`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteBranch(id) {
    const res = await fetch(`${BASE_URL}/branches/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Auth with Device Binding
  async login(phone, password) {
    const deviceId = getOrCreateDeviceId();
    const deviceInfo = getDeviceSummary();
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, password, pin: password, deviceId, deviceInfo }),
    });
    const data = await res.json();
    if (data.success && data.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('office_auth_token', data.token);
    }
    return data;
  },

  async restoreSessionToken(userId, phone) {
    try {
      const res = await fetch(`${BASE_URL}/auth/session-token`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, phone }),
      });
      const data = await res.json();
      if (data.success && data.token && typeof localStorage !== 'undefined') {
        localStorage.setItem('office_auth_token', data.token);
      }
      return data;
    } catch (e) {
      return null;
    }
  },

  async register(data) {
    const deviceId = getOrCreateDeviceId();
    const deviceInfo = getDeviceSummary();
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, deviceId, deviceInfo }),
    });
    const resData = await res.json();
    if (resData.success && resData.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('office_auth_token', resData.token);
    }
    return resData;
  },

  async updateProfile(employeeId, profileData) {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId, ...profileData }),
    });
    return res.json();
  },

  async setSapNumber(employeeId, sapNumber) {
    const res = await fetch(`${BASE_URL}/auth/set-sap-number`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId, sapNumber }),
    });
    return res.json();
  },

  async changePassword(employeeId, oldPassword, newPassword) {
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId, oldPassword, newPassword }),
    });
    return res.json();
  },

  async deleteAccount(employeeId) {
    const res = await fetch(`${BASE_URL}/auth/account`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  },

  async deleteEmployee(employeeId) {
    const res = await fetch(`${BASE_URL}/employees/${employeeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Device Management (فك ارتباط الجهاز)
  async resetEmployeeDevice(employeeId) {
    const res = await fetch(`${BASE_URL}/employees/${employeeId}/reset-device`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Reset Employee Password by Admin/Manager (إعادة تعيين كلمة مرور الموظف)
  async resetEmployeePassword(employeeId, newPassword = '1234') {
    const res = await fetch(`${BASE_URL}/employees/${employeeId}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    return res.json();
  },

  // Balance & Details Management (تعديل بيانات ومسمى وفرع ورصيد الموظف)
  async updateEmployeeBalances(employeeId, balances) {
    const res = await fetch(`${BASE_URL}/employees/${employeeId}/balances`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(balances)
    });
    return res.json();
  },

  async updateEmployeeDetails(employeeId, data) {
    const res = await fetch(`${BASE_URL}/employees/${employeeId}/details`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Push Notifications (إشعارات الموبايل)
  async getVapidPublicKey() {
    const res = await fetch(`${BASE_URL}/notifications/vapid-public-key`, { headers: getAuthHeaders() });
    return res.json();
  },

  async subscribePush(employeeId, subscription) {
    const res = await fetch(`${BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId, subscription, userAgent: navigator.userAgent })
    });
    return res.json();
  },

  async unsubscribePush(endpoint) {
    const res = await fetch(`${BASE_URL}/notifications/unsubscribe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ endpoint })
    });
    return res.json();
  },

  // In-App Notifications
  async getNotifications(employeeId) {
    const res = await fetch(`${BASE_URL}/notifications?employeeId=${encodeURIComponent(employeeId)}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async markNotificationsAsRead(employeeId, notificationIds = null) {
    const res = await fetch(`${BASE_URL}/notifications/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId, notificationIds })
    });
    return res.json();
  },

  // Monthly Reports & Logs (سجل وتقارير الحضور والإجازات الشهرية)
  async getMonthlyReport(year, month, branchId = null, employeeId = null) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    if (branchId) params.append('branchId', branchId);
    if (employeeId) params.append('employeeId', employeeId);
    const res = await fetch(`${BASE_URL}/reports/monthly?${params.toString()}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Office Settings
  async getSettings() {
    const res = await fetch(`${BASE_URL}/settings`, { headers: getAuthHeaders() });
    return res.json();
  },

  async updateSettings(settings) {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async verifyDistance(latitude, longitude, branchId, employeeId = null) {
    const res = await fetch(`${BASE_URL}/settings/verify-distance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ latitude, longitude, branchId, employeeId }),
    });
    return res.json();
  },

  // Titles & Permissions
  async getTitles() {
    const res = await fetch(`${BASE_URL}/titles`, { headers: getAuthHeaders() });
    return res.json();
  },

  async updateTitlePermissions(code, permissions) {
    const res = await fetch(`${BASE_URL}/titles/${code}/permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissions }),
    });
    return res.json();
  },

  async createTitle(data) {
    const res = await fetch(`${BASE_URL}/titles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateTitle(code, data) {
    const res = await fetch(`${BASE_URL}/titles/${code}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteTitle(code) {
    const res = await fetch(`${BASE_URL}/titles/${code}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async reorderTitles(codes) {
    const res = await fetch(`${BASE_URL}/titles/reorder`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ codes }),
    });
    return res.json();
  },

  // Employees
  async getEmployees(branchId = null) {
    const url = branchId ? `${BASE_URL}/employees?branchId=${branchId}` : `${BASE_URL}/employees`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },

  async getEmployeeById(id) {
    const res = await fetch(`${BASE_URL}/employees/${id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async addEmployee(empData) {
    const res = await fetch(`${BASE_URL}/employees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(empData),
    });
    return res.json();
  },

  // Live Presence with Branch Filter
  async getLiveStatus(date, branchId = null) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (branchId) params.append('branchId', branchId);
    const res = await fetch(`${BASE_URL}/status/live?${params.toString()}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Attendance
  async getTodayAttendance(branchId = null) {
    const url = branchId ? `${BASE_URL}/attendance/today?branchId=${branchId}` : `${BASE_URL}/attendance/today`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },

  async checkIn(employeeId, latitude, longitude, accuracy = null) {
    const res = await fetch(`${BASE_URL}/attendance/check-in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId, latitude, longitude, accuracy }),
    });
    return res.json();
  },

  async checkOut(employeeId, latitude, longitude, forceOverride = false, reason = '', accuracy = null) {
    const res = await fetch(`${BASE_URL}/attendance/check-out`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId, latitude, longitude, forceOverride, reason, accuracy }),
    });
    return res.json();
  },

  // Requests (Leaves & Permissions)
  async getRequests(filters = {}) {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    const res = await fetch(`${BASE_URL}/requests?${params.toString()}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async createRequest(reqData) {
    const res = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reqData),
    });
    return res.json();
  },

  async reviewRequest(requestId, reviewerId, status, reviewNote) {
    const res = await fetch(`${BASE_URL}/requests/${requestId}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reviewerId, status, reviewNote }),
    });
    return res.json();
  },

  // WebAuthn / Biometrics (Face ID & Touch ID)
  async getWebAuthnRegisterOptions(employeeId) {
    const res = await fetch(`${BASE_URL}/auth/webauthn/register-options`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  },

  async verifyWebAuthnRegistration(employeeId, response) {
    const deviceId = getOrCreateDeviceId();
    const deviceInfo = getDeviceSummary();
    const res = await fetch(`${BASE_URL}/auth/webauthn/register-verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId, response, deviceId, deviceInfo }),
    });
    return res.json();
  },

  async getWebAuthnLoginOptions(phone = '') {
    const res = await fetch(`${BASE_URL}/auth/webauthn/login-options`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },

  async verifyWebAuthnLogin(response, phone = '') {
    const deviceId = getOrCreateDeviceId();
    const deviceInfo = getDeviceSummary();
    const res = await fetch(`${BASE_URL}/auth/webauthn/login-verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ response, phone, deviceId, deviceInfo }),
    });
    const data = await res.json();
    if (data.success && data.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('office_auth_token', data.token);
    }
    return data;
  },

  async getWebAuthnStatus(employeeId) {
    const res = await fetch(`${BASE_URL}/auth/webauthn/status?employeeId=${encodeURIComponent(employeeId)}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async removeWebAuthnCredential(employeeId, credentialId) {
    const res = await fetch(`${BASE_URL}/auth/webauthn/credentials`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employeeId, credentialId }),
    });
    return res.json();
  },

  // ================= SaaS Platform APIs =================
  async getSaasPlans() {
    const res = await fetch(`${BASE_URL}/saas/plans`);
    return res.json();
  },

  async registerCompany(data) {
    const res = await fetch(`${BASE_URL}/saas/register-company`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getSubscriptionStatus() {
    const res = await fetch(`${BASE_URL}/saas/subscription/status`, { headers: getAuthHeaders() });
    return res.json();
  },

  async submitInstaPayProof(data) {
    const res = await fetch(`${BASE_URL}/saas/subscription/pay-instapay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getTenantPublicInfo(slug) {
    const res = await fetch(`${BASE_URL}/saas/tenant-public-info/${encodeURIComponent(slug)}`);
    return res.json();
  },

  async deleteTenant(id, saasKey) {
    const res = await fetch(`${BASE_URL}/saas/admin/tenants/${id}`, {
      method: 'DELETE',
      headers: { 'x-saas-key': saasKey }
    });
    return res.json();
  },

  // SaaS God Mode Admin APIs
  async saasAdminLogin(key) {
    const res = await fetch(`${BASE_URL}/saas/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    return res.json();
  },

  async getSaasStats(saasKey) {
    const res = await fetch(`${BASE_URL}/saas/admin/stats`, {
      headers: { 'x-saas-key': saasKey }
    });
    return res.json();
  },

  async getSaasTenants(saasKey) {
    const res = await fetch(`${BASE_URL}/saas/admin/tenants`, {
      headers: { 'x-saas-key': saasKey }
    });
    return res.json();
  },

  async updateTenantSubscription(id, data, saasKey) {
    const res = await fetch(`${BASE_URL}/saas/admin/tenants/${id}/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-saas-key': saasKey },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getSaasPayments(saasKey, status = '') {
    const url = status 
      ? `${BASE_URL}/saas/admin/payments?status=${encodeURIComponent(status)}`
      : `${BASE_URL}/saas/admin/payments`;
    const res = await fetch(url, {
      headers: { 'x-saas-key': saasKey }
    });
    return res.json();
  },

  async approveSaasPayment(id, adminNote, saasKey) {
    const res = await fetch(`${BASE_URL}/saas/admin/payments/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-saas-key': saasKey },
      body: JSON.stringify({ adminNote })
    });
    return res.json();
  },

  async rejectSaasPayment(id, reason, saasKey) {
    const res = await fetch(`${BASE_URL}/saas/admin/payments/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-saas-key': saasKey },
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  // 1-Click Sandbox Login
  async sandboxLogin() {
    const res = await fetch(`${BASE_URL}/saas/sandbox-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  // Advances & Bonuses
  async getAdvances(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/enterprise/payroll/advances?${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async requestAdvance(data) {
    const res = await fetch(`${BASE_URL}/enterprise/payroll/advances/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async approveAdvance(id) {
    const res = await fetch(`${BASE_URL}/enterprise/payroll/advances/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async grantBonus(data) {
    const res = await fetch(`${BASE_URL}/enterprise/payroll/bonuses/grant`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Digital Payslips & Overtime Radar
  async getPayslips(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/enterprise/payroll/payroll/payslips?${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async generatePayroll(data) {
    const res = await fetch(`${BASE_URL}/enterprise/payroll/payroll/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getOvertimeRadar() {
    const res = await fetch(`${BASE_URL}/enterprise/payroll/payroll/overtime-radar`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Field Visits
  async recordFieldCheckIn(data) {
    const res = await fetch(`${BASE_URL}/enterprise/shifts/field/checkin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async recordFieldCheckOut(data) {
    const res = await fetch(`${BASE_URL}/enterprise/shifts/field/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getFieldVisits(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/enterprise/shifts/field/visits?${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  // Shifts & Visual Roster
  async getShifts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/enterprise/shifts/shifts?${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async createShift(data) {
    const res = await fetch(`${BASE_URL}/enterprise/shifts/shifts/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async autoScheduleShifts(data) {
    const res = await fetch(`${BASE_URL}/enterprise/shifts/shifts/auto-schedule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Mini HR Vault
  async getHRVault(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/enterprise/ops/hr-vault?${query}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async addHRVaultDoc(data) {
    const res = await fetch(`${BASE_URL}/enterprise/ops/hr-vault/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // 1-Tap Pulse & Analytics
  async submitPulse(data) {
    const res = await fetch(`${BASE_URL}/enterprise/ops/pulse/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getPulseAnalytics() {
    const res = await fetch(`${BASE_URL}/enterprise/ops/pulse/analytics`, { headers: getAuthHeaders() });
    return res.json();
  },

  // AI Radars & Assistant
  async getAttritionRadar() {
    const res = await fetch(`${BASE_URL}/saas/ai/attrition-radar`, { headers: getAuthHeaders() });
    return res.json();
  },

  async askAIHRAssistant(query) {
    const res = await fetch(`${BASE_URL}/saas/ai/hr-chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query })
    });
    return res.json();
  }
};
