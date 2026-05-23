/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F7FBFF',
    backgroundElement: 'rgba(255, 255, 255, 0.72)',
    backgroundSelected: 'rgba(191, 219, 254, 0.42)',
    textSecondary: '#475569',
    textMuted: '#64748B',
    hairline: 'rgba(125, 169, 212, 0.24)',
    hairlineSoft: 'rgba(219, 234, 254, 0.62)',
    card: 'rgba(255, 255, 255, 0.78)',
    cardStrong: 'rgba(240, 247, 255, 0.88)',
    primary: '#2563EB',
    primaryActive: '#1D4ED8',
    onPrimary: '#ffffff',
    darkSurface: '#0F172A',
    onDark: '#ffffff',
    brandPink: '#FF4D8B',
    brandTeal: '#0F172A',
    brandLavender: '#B8A4ED',
    brandPeach: '#FFD4BD',
    brandOchre: '#E8B94A',
    brandMint: '#A4D4C5',
    brandCoral: '#60A5FA',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#ef4444',
  },
  dark: {
    text: '#F8FAFC',
    background: '#07111F',
    backgroundElement: 'rgba(15, 23, 42, 0.7)',
    backgroundSelected: 'rgba(96, 165, 250, 0.22)',
    textSecondary: '#D6E4F0',
    textMuted: '#94A3B8',
    hairline: 'rgba(148, 163, 184, 0.24)',
    hairlineSoft: 'rgba(51, 65, 85, 0.62)',
    card: 'rgba(15, 23, 42, 0.78)',
    cardStrong: 'rgba(30, 41, 59, 0.82)',
    primary: '#93C5FD',
    primaryActive: '#BFDBFE',
    onPrimary: '#ffffff',
    darkSurface: '#020617',
    onDark: '#ffffff',
    brandPink: '#FF4D8B',
    brandTeal: '#BAE6FD',
    brandLavender: '#B8A4ED',
    brandPeach: '#FFD4BD',
    brandOchre: '#E8B94A',
    brandMint: '#A4D4C5',
    brandCoral: '#60A5FA',
    success: '#34D399',
    warning: '#F59E0B',
    error: '#ef4444',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-sans)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  twoHalf: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  seven: 96,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1180;
