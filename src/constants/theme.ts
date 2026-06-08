/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#3C3C3C',
    background: '#FFFFFF',
    backgroundElement: '#F7F7F7',
    backgroundSelected: '#DDF4FF',
    textSecondary: '#777777',
    textMuted: '#AFAFAF',
    hairline: '#E5E5E5',
    hairlineSoft: '#EFEFEF',
    card: '#FFFFFF',
    cardStrong: '#F7F7F7',
    primary: '#58CC02',
    primaryActive: '#46A302',
    onPrimary: '#ffffff',
    darkSurface: '#4B4B4B',
    onDark: '#ffffff',
    brandPink: '#FF4B4B',
    brandTeal: '#1CB0F6',
    brandLavender: '#CE82FF',
    brandPeach: '#FF9600',
    brandOchre: '#FFC800',
    brandMint: '#58CC02',
    brandCoral: '#1CB0F6',
    success: '#58CC02',
    warning: '#FFC800',
    error: '#FF4B4B',
  },
  dark: {
    text: '#FFFFFF',
    background: '#07111F',
    backgroundElement: '#16212B',
    backgroundSelected: 'rgba(28, 176, 246, 0.22)',
    textSecondary: '#C7CDD1',
    textMuted: '#8A9199',
    hairline: 'rgba(255, 255, 255, 0.16)',
    hairlineSoft: 'rgba(255, 255, 255, 0.1)',
    card: '#16212B',
    cardStrong: '#1B2730',
    primary: '#58CC02',
    primaryActive: '#46A302',
    onPrimary: '#ffffff',
    darkSurface: '#0A1118',
    onDark: '#ffffff',
    brandPink: '#FF4B4B',
    brandTeal: '#1CB0F6',
    brandLavender: '#CE82FF',
    brandPeach: '#FF9600',
    brandOchre: '#FFC800',
    brandMint: '#58CC02',
    brandCoral: '#1CB0F6',
    success: '#58CC02',
    warning: '#FFC800',
    error: '#FF4B4B',
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
