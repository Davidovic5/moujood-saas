/**
 * Centralized White-Label Client Brand & Entity Configuration
 * -------------------------------------------------------------
 * Customizing this template for any new company takes under 2 minutes:
 * Simply update this single file to change company name, entity labels,
 * logos, primary brand colors, and default HR/shift policies.
 */

export interface CompanyThemeConfig {
  primary: string;           // Primary accent color (e.g. #EAB308 or #3B82F6)
  primaryHover: string;      // Button hover color (e.g. #CA8A04 or #2563EB)
  contrastText: string;      // Text on primary buttons (e.g. #000000 or #FFFFFF)
  accentGlow?: string;       // Box shadow glow / highlight
}

export interface CompanyDefaultsConfig {
  timezone: string;          // e.g. "Africa/Cairo"
  shiftHours: number;        // e.g. 8
  annualLeaveDays: number;   // e.g. 21
  monthlyExcuseHours: number;// e.g. 2
  defaultRadiusMeters: number; // e.g. 100
}

export interface CompanyConfig {
  companyName: string;
  companyShortName: string;
  entitySingular: string;    // e.g. "المقر" or "الفرع"
  entityPlural: string;      // e.g. "الفروع" or "المقرات"
  logoPath: string;
  faviconPath: string;
  theme: CompanyThemeConfig;
  defaults: CompanyDefaultsConfig;
}

export const companyConfig: CompanyConfig = {
  companyName: "موجود • Moujood",
  companyShortName: "موجود",
  entitySingular: "الفرع",
  entityPlural: "الفروع",
  logoPath: "/brand/logo.svg",
  faviconPath: "/brand/favicon.svg",
  theme: {
    primary: "#10B981",         // Smart Emerald Mint (رمز الحضور والنشاط لموجود)
    primaryHover: "#059669",
    contrastText: "#FFFFFF",
    accentGlow: "rgba(16, 185, 129, 0.30)"
  },
  defaults: {
    timezone: "Africa/Cairo",
    shiftHours: 8,
    annualLeaveDays: 21,
    monthlyExcuseHours: 2,
    defaultRadiusMeters: 100
  }
};

/**
 * Applies the brand theme dynamically into root CSS variables:
 * --brand-primary, --brand-primary-hover, --brand-contrast-text, etc.
 */
export function applyBrandTheme(theme = companyConfig.theme) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', theme.primary);
    root.style.setProperty('--brand-primary-hover', theme.primaryHover);
    root.style.setProperty('--brand-contrast-text', theme.contrastText);
    if (theme.accentGlow) {
      root.style.setProperty('--brand-accent-glow', theme.accentGlow);
    }
  }
}

export default companyConfig;
