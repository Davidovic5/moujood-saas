/**
 * src/utils/colorExtractor.js
 * 
 * Extracts dominant vibrant brand color from an uploaded company logo
 * and applies dynamic theme CSS variables across the entire application.
 */

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function adjustColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return rgbToHex(R, G, B);
}

export function getLuminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function extractDominantColor(imageSrc) {
  return new Promise((resolve) => {
    if (!imageSrc || typeof window === 'undefined') {
      return resolve({
        primary: '#10B981',
        primaryHover: '#059669',
        contrastText: '#FFFFFF'
      });
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorCounts = {};
        let maxCount = 0;
        let dominantRgb = null;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or semi-transparent pixels
          if (a < 128) continue;

          // Skip almost white / light gray (typical background)
          if (r > 230 && g > 230 && b > 230) continue;

          // Skip almost black / very dark gray
          if (r < 30 && g < 30 && b < 30) continue;

          // Skip low-saturation washed out grays
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          if (maxVal - minVal < 25) continue;

          // Quantize color into buckets of 16 for clustering
          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;
          const key = `${qr},${qg},${qb}`;

          colorCounts[key] = (colorCounts[key] || 0) + 1;
          if (colorCounts[key] > maxCount) {
            maxCount = colorCounts[key];
            dominantRgb = { r: qr, g: qg, b: qb };
          }
        }

        if (dominantRgb) {
          const hex = rgbToHex(dominantRgb.r, dominantRgb.g, dominantRgb.b);
          const hoverHex = adjustColor(hex, -15);
          const lum = getLuminance(dominantRgb.r, dominantRgb.g, dominantRgb.b);
          const contrastText = lum > 135 ? '#09090b' : '#ffffff';

          return resolve({
            primary: hex,
            primaryHover: hoverHex,
            contrastText
          });
        }
      } catch (err) {
        console.warn('Color extraction error:', err);
      }

      // Fallback emerald theme if image is purely monochromatic
      resolve({
        primary: '#10B981',
        primaryHover: '#059669',
        contrastText: '#FFFFFF'
      });
    };

    img.onerror = () => {
      resolve({
        primary: '#10B981',
        primaryHover: '#059669',
        contrastText: '#FFFFFF'
      });
    };

    img.src = imageSrc;
  });
}

export const OFFICIAL_EMERALD_PALETTE = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22'
};

export function hexToHsl(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = ((num >> 16) & 255) / 255;
  let g = ((num >> 8) & 255) / 255;
  let b = (num & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

export function hslToHex(h, s, l) {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = x => Math.round(Math.max(0, Math.min(255, x * 255))).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

export function applyTenantTheme(primaryColor) {
  if (typeof document === 'undefined' || !primaryColor) return;

  const hex = primaryColor.startsWith('#') ? primaryColor : `#${primaryColor}`;
  const isDefaultEmerald = hex.toLowerCase() === '#10b981';
  const hoverHex = isDefaultEmerald ? '#059669' : adjustColor(hex, -15);

  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const lum = getLuminance(r, g, b);
  // High contrast text: dark charcoal for bright colors (like cyan, yellow, amber, light blue), crisp white for dark colors
  const contrastText = lum > 135 ? '#09090b' : '#ffffff';

  const root = document.documentElement;
  root.style.setProperty('--brand-primary', hex);
  root.style.setProperty('--brand-primary-hover', hoverHex);
  root.style.setProperty('--brand-contrast-text', contrastText);
  root.style.setProperty('--brand-accent-glow', isDefaultEmerald ? 'rgba(16, 185, 129, 0.25)' : `rgba(${r}, ${g}, ${b}, 0.35)`);

  // Compute a comprehensive harmonious shade scale
  let shade50, shade100, shade200, shade300, shade400, shade500, shade600, shade700, shade800, shade900, shade950;

  if (isDefaultEmerald) {
    shade50 = OFFICIAL_EMERALD_PALETTE[50];
    shade100 = OFFICIAL_EMERALD_PALETTE[100];
    shade200 = OFFICIAL_EMERALD_PALETTE[200];
    shade300 = OFFICIAL_EMERALD_PALETTE[300];
    shade400 = OFFICIAL_EMERALD_PALETTE[400];
    shade500 = OFFICIAL_EMERALD_PALETTE[500];
    shade600 = OFFICIAL_EMERALD_PALETTE[600];
    shade700 = OFFICIAL_EMERALD_PALETTE[700];
    shade800 = OFFICIAL_EMERALD_PALETTE[800];
    shade900 = OFFICIAL_EMERALD_PALETTE[900];
    shade950 = OFFICIAL_EMERALD_PALETTE[950];
  } else {
    const [h, s, l] = hexToHsl(hex);
    shade50 = hslToHex(h, Math.min(s, 0.65), 0.96);
    shade100 = hslToHex(h, Math.min(s, 0.70), 0.90);
    shade200 = hslToHex(h, Math.min(s, 0.75), 0.80);
    shade300 = hslToHex(h, s, 0.65);
    shade400 = hslToHex(h, s, 0.52);
    shade500 = hex;
    shade600 = hslToHex(h, s, Math.max(0.15, l * 0.85));
    shade700 = hslToHex(h, s, Math.max(0.12, l * 0.70));
    shade800 = hslToHex(h, s, Math.max(0.08, l * 0.50));
    shade900 = hslToHex(h, s, Math.max(0.05, l * 0.35));
    shade950 = `rgba(${r}, ${g}, ${b}, 0.15)`;
  }

  const vars = [
    // Direct CSS variables (CSS standards)
    ['--emerald-50', shade50],
    ['--emerald-100', shade100],
    ['--emerald-200', shade200],
    ['--emerald-300', shade300],
    ['--emerald-400', shade400],
    ['--emerald-500', shade500],
    ['--emerald-600', shade600],
    ['--emerald-700', shade700],
    ['--emerald-800', shade800],
    ['--emerald-900', shade900],
    ['--emerald-950', shade950],

    // Tailwind v4 --color-emerald-* variables
    ['--color-emerald-50', shade50],
    ['--color-emerald-100', shade100],
    ['--color-emerald-200', shade200],
    ['--color-emerald-300', shade300],
    ['--color-emerald-400', shade400],
    ['--color-emerald-500', shade500],
    ['--color-emerald-600', shade600],
    ['--color-emerald-700', shade700],
    ['--color-emerald-800', shade800],
    ['--color-emerald-900', shade900],
    ['--color-emerald-950', shade950],

    // Amber & Yellow mappings (legacy and complementary component accents)
    ['--amber-300', shade300],
    ['--amber-400', shade400],
    ['--amber-500', shade500],
    ['--amber-600', shade600],
    ['--amber-700', shade700],
    ['--amber-800', shade800],
    ['--amber-900', shade900],
    ['--amber-950', shade950],
    ['--color-amber-300', shade300],
    ['--color-amber-400', shade400],
    ['--color-amber-500', shade500],
    ['--color-amber-600', shade600],
    ['--color-amber-700', shade700],
    ['--color-amber-800', shade800],
    ['--color-amber-900', shade900],
    ['--color-amber-950', shade950],
    ['--yellow-400', shade400],
    ['--yellow-500', shade500],
    ['--color-yellow-400', shade400],
    ['--color-yellow-500', shade500]
  ];

  vars.forEach(([k, v]) => root.style.setProperty(k, v));
}
