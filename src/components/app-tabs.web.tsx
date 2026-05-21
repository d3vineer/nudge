import {
  TabList,
  TabSlot,
  TabListProps,
  Tabs,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import type { Href } from 'expo-router';
import React from 'react';
import { Pressable, useWindowDimensions, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { useThemeController } from '@/components/theme-controller';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const compact = width < 620;

  return (
    <Tabs style={styles.tabsRoot}>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="dashboard" href="/" asChild>
            <TabButton compact={compact}>{compact ? 'Home' : 'Dashboard'}</TabButton>
          </TabTrigger>
          <TabTrigger name="library" href={'/library' as Href} asChild>
            <TabButton compact={compact}>{compact ? 'Lib' : 'Library'}</TabButton>
          </TabTrigger>
          <TabTrigger name="study" href={'/study' as Href} asChild>
            <TabButton compact={compact}>Study</TabButton>
          </TabTrigger>
          <TabTrigger name="reviews" href={'/reviews' as Href} asChild>
            <TabButton compact={compact}>{compact ? 'Due' : 'Reviews'}</TabButton>
          </TabTrigger>
          <TabTrigger name="analytics" href={'/analytics' as Href} asChild>
            <TabButton compact={compact}>{compact ? 'Stats' : 'Analytics'}</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  compact,
  isFocused,
  ...props
}: TabTriggerSlotProps & { compact?: boolean }) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.tabButtonView, compact && styles.tabButtonViewCompact]}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const { width } = useWindowDimensions();
  const colors = useTheme();
  const compact = width < 620;

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView
        type="backgroundElement"
        style={[
          styles.innerContainer,
          {
            borderColor: colors.hairline,
            boxShadow: '0 10px 30px rgba(10, 10, 10, 0.08)',
          },
        ]}>
        <ThemedView style={styles.brandLockup}>
          <ThemedView style={[styles.logoMark, { backgroundColor: colors.primary }]}>
            <ThemedText type="smallBold" style={[styles.logoText, { color: colors.onPrimary }]}>
              n
            </ThemedText>
          </ThemedView>
          {!compact && (
            <ThemedText type="smallBold" style={styles.brandText}>
              Nudge
            </ThemedText>
          )}
        </ThemedView>

        {props.children}

        <ThemeToggle compact={compact} />
      </ThemedView>
    </View>
  );
}

function ThemeToggle({ compact }: { compact: boolean }) {
  const { mode, toggleMode } = useThemeController();
  const colors = useTheme();
  const nextMode = mode === 'dark' ? 'light' : 'dark';

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: mode === 'dark' }}
      accessibilityLabel={`Switch to ${nextMode} theme`}
      onPress={toggleMode}
      style={({ pressed }) => [
        styles.themeToggle,
        {
          borderColor: colors.hairline,
          backgroundColor: colors.background,
          opacity: pressed ? 0.72 : 1,
        },
      ]}>
      <ThemedText type="smallBold">{compact ? (mode === 'dark' ? 'D' : 'L') : mode}</ThemedText>
      <ThemedView
        style={[
          styles.themeToggleKnob,
          {
            backgroundColor: colors.primary,
            transform: [{ translateX: mode === 'dark' ? 14 : 0 }],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    width: '100%',
    padding: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 20,
  },
  tabsRoot: {
    flex: 1,
  },
  tabSlot: {
    flex: 1,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.one,
    maxWidth: MaxContentWidth,
  },
  brandLockup: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginRight: 'auto',
    flexShrink: 0,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
  },
  logoText: {
    fontSize: 22,
    lineHeight: 24,
    transform: [{ rotate: '10deg' }],
  },
  brandText: {
    paddingRight: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  tabButtonViewCompact: {
    paddingHorizontal: Spacing.two,
  },
  themeToggle: {
    minWidth: 74,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  themeToggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 999,
  },
});
