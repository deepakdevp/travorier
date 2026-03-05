/**
 * Travorier Design System Theme
 * Source of truth: docs/DESIGN.md
 * Stitch Project: 7580322135798196968
 *
 * DO NOT add colors or spacing values here without updating DESIGN.md first.
 */
import { MD3LightTheme } from 'react-native-paper';

// ─── Color Tokens ────────────────────────────────────────────────────────────
export const colors = {
  // Primary
  primary: '#136dec',
  primaryLight: '#2b8cee',
  primarySubtle: '#e8f0fe',

  // Neutrals
  background: '#f6f7f8',
  surface: '#ffffff',
  border: '#e5e7eb',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textDisabled: '#9ca3af',

  // Semantic
  success: '#16a34a',
  successSubtle: '#dcfce7',
  warning: '#d97706',
  warningSubtle: '#fef3c7',
  error: '#dc2626',
  errorSubtle: '#fee2e2',
  star: '#f59e0b',
} as const;

// ─── Status Chip Tokens ───────────────────────────────────────────────────────
export const statusColors = {
  active: { bg: '#dcfce7', text: '#16a34a' },
  matched: { bg: '#dbeafe', text: '#1d4ed8' },
  completed: { bg: '#f1f5f9', text: '#475569' },
  cancelled: { bg: '#f1f5f9', text: '#9ca3af' },
  initiated: { bg: '#fef3c7', text: '#d97706' },
} as const;

// ─── Spacing (4px base grid) ──────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ─── React Native Paper Theme ─────────────────────────────────────────────────
export const AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primarySubtle,
    secondary: colors.textSecondary,
    secondaryContainer: '#f1f5f9',
    surface: colors.surface,
    surfaceVariant: colors.background,
    background: colors.background,
    error: colors.error,
    errorContainer: colors.errorSubtle,
    outline: colors.border,
    onPrimary: '#ffffff',
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
  },
  // react-native-paper multiplies roundness by 4 → 2 × 4 = 8px base
  roundness: 2,
} as const;
