/**
 * src/utils/appBranding.js
 * 
 * Multi-Tenant Strict Branding & Isolation Engine:
 * - Prevents tenant branding from leaking into Landing Page or God Mode
 * - Updates Document Title: `<Company Name> - Office Attendance` for tenants
 * - Dynamically updates Favicon & Apple Touch Icons per tenant
 * - Dynamically links PWA Manifest per tenant
 * - Restores official Moujood platform branding on public pages
 */

import { companyConfig } from '../config/company.config';
import { applyTenantTheme } from './colorExtractor';

export function getCachedBranding() {
  if (typeof window === 'undefined') return {};

  // If in God Mode, strictly return empty so Moujood branding is used
  if (window.location.search.includes('saas_god_mode=1') || window.location.pathname === '/saas-admin') {
    return {};
  }

  // Check if URL has tenant slug (/t/:slug or ?tenant=:slug)
  try {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let slug = null;
    if ((pathParts[0] === 't' || pathParts[0] === 'tenant') && pathParts[1]) {
      slug = pathParts[1].toLowerCase().trim();
    }
    if (!slug) {
      const p = new URLSearchParams(window.location.search).get('tenant');
      if (p) slug = p.toLowerCase().trim();
    }

    // Check logged in user
    if (!slug) {
      const userStr = localStorage.getItem('office_auth_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        slug = u.tenantSlug || (u.tenantId && u.tenantId !== 'default' ? u.tenantId.replace('tenant_', '') : null);
      }
    }

    if (slug) {
      const cached = localStorage.getItem(`tenant_branding_${slug}`);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (e) {}

  return {};
}

export function saveCachedBranding(slug, branding) {
  if (typeof window === 'undefined' || !slug || !branding) return;
  try {
    localStorage.setItem(`tenant_branding_${slug}`, JSON.stringify(branding));
  } catch (e) {}
}

export function resetPlatformBranding() {
  if (typeof window === 'undefined') return;

  const defaultTitle = 'موجود • Moujood | موچود.. موظفك في مكانه بالـ GPS وبدون أجهزة بصمة';
  if (document.title !== defaultTitle) {
    document.title = defaultTitle;
  }

  // Reset Favicon to Moujood's official icon
  const iconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]'
  ];
  iconSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.href = '/brand/favicon.svg';
    });
  });

  // Reset Manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    manifestLink.href = '/manifest.webmanifest?v=6.0';
  }

  // Reset Theme variables to Moujood emerald
  applyTenantTheme('#10B981');
}

export function setGodModeBranding() {
  if (typeof window === 'undefined') return;

  document.title = '👑 لوحة إدارة المنصة (God Mode) | موجود Moujood SaaS';

  const iconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]'
  ];
  iconSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.href = '/brand/favicon.svg';
    });
  });

  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    manifestLink.href = '/manifest.webmanifest?v=6.0';
  }

  applyTenantTheme('#10B981');
}

export function updateAppBranding(companyName, logoUrl, primaryColor = '#10B981', tenantSlug = '') {
  if (typeof window === 'undefined') return;

  // If in God Mode, do not apply tenant branding
  if (window.location.search.includes('saas_god_mode=1') || window.location.pathname === '/saas-admin') {
    setGodModeBranding();
    return;
  }

  const resolvedName = (companyName && String(companyName).trim()) || companyConfig.companyName;
  const resolvedLogo = (logoUrl && String(logoUrl).trim()) || companyConfig.logoPath;

  // 1. Update Title: `<Company Name> - Office Attendance`
  const dynamicTitle = `${resolvedName} - Office Attendance`;
  if (document.title !== dynamicTitle) {
    document.title = dynamicTitle;
  }

  // 2. Update Mobile Meta
  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta) appleTitleMeta.content = resolvedName;

  const appNameMeta = document.querySelector('meta[name="application-name"]');
  if (appNameMeta) appNameMeta.content = resolvedName;

  // 3. Update Favicon to Company Logo
  if (resolvedLogo) {
    const iconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]'
    ];

    iconSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.href = resolvedLogo;
      });
    });
  }

  // 4. Update Dynamic PWA Manifest Link if tenantSlug provided
  if (tenantSlug) {
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.href = `/api/saas/manifest/${tenantSlug}`;
    }
  }

  // 5. Apply Theme Colors
  if (primaryColor) {
    applyTenantTheme(primaryColor);
  }

  // 6. Save scoped branding
  if (tenantSlug) {
    saveCachedBranding(tenantSlug, {
      companyName: resolvedName,
      logoUrl: resolvedLogo,
      primaryColor: primaryColor || '#10B981'
    });
  }

  // Clean up dangerous legacy global keys that leaked across domains
  try {
    localStorage.removeItem('office_branding');
    localStorage.removeItem('saas_tenant_slug');
  } catch (e) {}
}
