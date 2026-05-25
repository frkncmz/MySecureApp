// Theme constants for LoveLog app
// Warm coral & purple color scheme - Light mode only

export const Colors = {
  primary: '#FF4B5C',
  primaryLight: '#FF8A94',
  primaryDark: '#E03A4A',
  secondary: '#8A4FFF',
  secondaryLight: '#B794FF',

  background: '#FFF8F6',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF0ED',

  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  border: '#F0E0DD',
  borderLight: '#F5F0EA',
  divider: '#F3EDE6',

  success: '#34D399',
  successLight: '#ECFDF5',
  warning: '#FBBF24',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',

  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.06)',
  shadowDark: 'rgba(0, 0, 0, 0.12)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  archived: '#9CA3AF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  title: 32,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const ScoreColor = {
  getColor: (score: number): string => {
    if (score >= 8) return Colors.secondary;
    if (score >= 6) return Colors.success;
    if (score >= 4) return Colors.warning;
    return Colors.danger;
  },
  getLabel: (score: number): string => {
    if (score >= 8) return 'Amazing';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Not Great';
  },
} as const;
