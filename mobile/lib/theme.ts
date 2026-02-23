/**
 * Design system theme for Travorier
 *
 * Tokens extracted from Stitch Dashboard screen:
 * projects/7580322135798196968/screens/db644f60aab34c87878fd30177674006
 *
 * Color palette, typography, spacing, and border radius values are
 * defined here so every screen imports from a single source of truth.
 */
import { MD3LightTheme } from 'react-native-paper';

// ---------------------------------------------------------------------------
// Color palette (from Stitch Dashboard)
// ---------------------------------------------------------------------------
export const colors = {
  // Brand / primary
  primary: '#FF5722',
  primaryLight: '#fff3ee',    // tinted primary for backgrounds / chips
  primaryContent: '#ffffff',  // text/icon on primary-colored surfaces

  // Backgrounds
  background: '#f6f7f8',      // main app background (background-light)
  surface: '#ffffff',         // card / sheet surface (surface-light)

  // Dark-mode counterparts (available for future dark theme support)
  backgroundDark: '#101922',
  surfaceDark: '#1a2632',

  // Semantic / status
  success: '#22c55e',
  successLight: '#e8f8f0',    // tinted success background
  warning: '#f59e0b',
  warningLight: '#fff8e1',    // tinted warning background
  error: '#ef4444',
  errorLight: '#fef2f2',      // tinted error background (red-50)
  errorBorder: '#fee2e2',     // error-tinted border (red-100)
  info: '#3b82f6',

  // Text
  textPrimary: '#101922',     // headings, body copy  (matches background-dark)
  textSecondary: '#6b7280',   // captions, placeholders
  textDisabled: '#9ca3af',

  // Borders & dividers
  border: '#e5e7eb',
  divider: '#f3f4f6',

  // Misc
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Profile stat card accent palette (Stitch "User Account Profile" design)
  // Each stat uses a distinct category color; these live in the global palette
  // so they remain the single source of truth if reused elsewhere.
  statTrustIcon: '#2563eb',   // blue-600
  statTrustBg:   '#eff6ff',   // blue-50
  statTripsIcon: '#9333ea',   // purple-600
  statTripsBg:   '#faf5ff',   // purple-50
  statDelivIcon: '#ea580c',   // orange-600
  statDelivBg:   '#fff7ed',   // orange-50
  statRatingIcon:'#ca8a04',   // yellow-600
  statRatingBg:  '#fefce8',   // yellow-50

  // Menu icon slate tones (Stitch profile menu rows)
  menuIconBg:    '#f1f5f9',   // slate-100
  menuIconColor: '#475569',   // slate-600
};

// ---------------------------------------------------------------------------
// Spacing scale (4-pt grid)
// ---------------------------------------------------------------------------
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ---------------------------------------------------------------------------
// Border radius (from Stitch: 0.5rem base = 8px)
// ---------------------------------------------------------------------------
export const radius = {
  sm: 4,
  md: 8,    // DEFAULT (0.5rem)
  lg: 16,   // lg     (1rem)
  xl: 24,   // xl     (1.5rem)
  xxl: 32,
  full: 9999,
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const typography = {
  fontFamily: 'Inter',      // loaded via expo-font or system fallback
  fontFamilySans: 'Inter',

  // Font sizes (px equivalent)
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 30,
  },

  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ---------------------------------------------------------------------------
// Elevation / shadow (Material 3 levels 0–5)
// ---------------------------------------------------------------------------
export const elevation = {
  none: 0,
  xs: 1,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
};

// ---------------------------------------------------------------------------
// React Native Paper MD3 theme
// ---------------------------------------------------------------------------
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    // Brand
    primary: colors.primary,
    onPrimary: colors.primaryContent,
    primaryContainer: colors.primaryLight,
    onPrimaryContainer: colors.primary,

    // Backgrounds & surfaces
    background: colors.background,
    onBackground: colors.textPrimary,
    surface: colors.surface,
    onSurface: colors.textPrimary,
    surfaceVariant: colors.divider,
    onSurfaceVariant: colors.textSecondary,

    // Semantic
    error: colors.error,
    onError: colors.white,

    // Outline / border
    outline: colors.border,
    outlineVariant: colors.divider,

    // Inverse (used for snackbars, tooltips)
    inverseSurface: colors.backgroundDark,
    inverseOnSurface: colors.white,
    inversePrimary: colors.primaryLight,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    // Preserve MD3 type-scale structure; font family applied globally
  },
};

export type AppTheme = typeof theme;
