/**
 * src/utils/appBranding.js
 * 
 * Dynamic White-label Branding Manager:
 * - Updates Document Title: `<Company Name> - Office Attendance`
 * - Updates Browser Favicon & Mobile Apple Touch Icons to Tenant's Logo
 * - Syncs PWA Manifest App Name and Meta Tags
 * - Caches tenant branding locally for zero-latency flash-free loading
 */

import { companyConfig } from '../config/company.config';

export function getCachedBranding() {
  if (typeof window === 'undefined') {
    return { companyName: companyConfig.companyName, logoUrl: companyConfig.logoPath };
  }

  try {
    const cached = localStorage.getItem('office_branding');
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        companyName: parsed.companyName || companyConfig.companyName,
        logoUrl: parsed.logoUrl || companyConfig.logoPath
      };
    }
  } catch (e) {
    // ignore
  }

  return { companyName: companyConfig.companyName, logoUrl: companyConfig.logoPath };
}

export function updateAppBranding(companyName, logoUrl) {
  if (typeof window === 'undefined') return;

  const resolvedName = (companyName && String(companyName).trim()) || companyConfig.companyName;
  const resolvedLogo = (logoUrl && String(logoUrl).trim()) || companyConfig.logoPath;

  // 1. Update Title: `<Company Name> - Office Attendance`
  const dynamicTitle = `${resolvedName} - Office Attendance`;
  if (document.title !== dynamicTitle) {
    document.title = dynamicTitle;
  }

  // 2. Update Mobile Web App Titles
  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta) appleTitleMeta.content = resolvedName;

  const appNameMeta = document.querySelector('meta[name="application-name"]');
  if (appNameMeta) appNameMeta.content = resolvedName;

  // 3. Update Favicons & Apple Touch Icons
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

    // Also check if no icon exists, create one
    if (!document.querySelector('link[rel="icon"]')) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = resolvedLogo;
      document.head.appendChild(link);
    }
  }

  // 4. Cache in localStorage for subsequent page loads
  try {
    localStorage.setItem('office_branding', JSON.stringify({
      companyName: resolvedName,
      logoUrl: resolvedLogo
    }));
  } catch (e) {
    // ignore
  }
}
