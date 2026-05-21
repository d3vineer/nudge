/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0a0a0a',
    background: '#fffaf0',
    backgroundElement: '#faf5e8',
    backgroundSelected: '#ebe6d6',
    textSecondary: '#6a6a6a',
    textMuted: '#9a9a9a',
    hairline: '#e5e5e5',
    hairlineSoft: '#f0f0f0',
    card: '#f5f0e0',
    cardStrong: '#ebe6d6',
    primary: '#0a0a0a',
    primaryActive: '#1f1f1f',
    onPrimary: '#ffffff',
    darkSurface: '#0a1a1a',
    onDark: '#ffffff',
    brandPink: '#ff4d8b',
    brandTeal: '#1a3a3a',
    brandLavender: '#b8a4ed',
    brandPeach: '#ffb084',
    brandOchre: '#e8b94a',
    brandMint: '#a4d4c5',
    brandCoral: '#ff6b5a',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  dark: {
    text: '#fffaf0',
    background: '#0a1a1a',
    backgroundElement: '#1a2a2a',
    backgroundSelected: '#263737',
    textSecondary: '#c5c0b2',
    textMuted: '#a0a0a0',
    hairline: '#2f4242',
    hairlineSoft: '#243535',
    card: '#1a2a2a',
    cardStrong: '#263737',
    primary: '#fffaf0',
    primaryActive: '#f5f0e0',
    onPrimary: '#0a0a0a',
    darkSurface: '#050d0d',
    onDark: '#ffffff',
    brandPink: '#ff4d8b',
    brandTeal: '#a4d4c5',
    brandLavender: '#b8a4ed',
    brandPeach: '#ffb084',
    brandOchre: '#e8b94a',
    brandMint: '#a4d4c5',
    brandCoral: '#ff6b5a',
    success: '#22c55e',
    warning: '#f59e0b',
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
    sans: 'var(--font-display)',
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
