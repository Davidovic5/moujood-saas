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
          const contrastText = lum > 160 ? '#09090B' : '#FFFFFF';

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

export function applyTenantTheme(primaryColor) {
  if (typeof document === 'undefined' || !primaryColor) return;

  const hex = primaryColor.startsWith('#') ? primaryColor : `#${primaryColor}`;
  const hoverHex = adjustColor(hex, -15);

  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const lum = getLuminance(r, g, b);
  const contrastText = lum > 160 ? '#09090B' : '#FFFFFF';

  const root = document.documentElement;
  root.style.setProperty('--brand-primary', hex);
  root.style.setProperty('--brand-primary-hover', hoverHex);
  root.style.setProperty('--brand-contrast-text', contrastText);
  root.style.setProperty('--brand-accent-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
}
