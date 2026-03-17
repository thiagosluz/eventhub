'use client';

import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  primaryColor: string;
}

const ThemeContext = createContext<ThemeContextType>({ primaryColor: '#10b981' });

export function ThemeProvider({ 
  children, 
  themeConfig,
  tenantThemeConfig
}: { 
  children: React.ReactNode;
  themeConfig?: Record<string, unknown>;
  tenantThemeConfig?: Record<string, unknown>;
}) {
  const primaryColor = (themeConfig?.primaryColor as string) || (tenantThemeConfig?.primaryColor as string) || '#10b981';
  const hslValue = hexToHsl(primaryColor);

  return (
    <ThemeContext.Provider value={{ primaryColor }}>
      <div 
        style={{ 
          '--primary': hslValue,
          '--color-primary': `hsl(${hslValue})`,
          '--color-primary-dark': `hsl(${hslValue} / 0.8)`
        } as React.CSSProperties}
        className="contents"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// Helper to convert hex to HSL format that Shadcn/Tailwind expects (e.g. "142 70.6% 45.3%")
function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const useTheme = () => useContext(ThemeContext);
