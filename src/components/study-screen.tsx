import { Platform, ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StudyScreenProps = ScrollViewProps & {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function StudyScreen({ eyebrow, title, subtitle, children, ...props }: StudyScreenProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const titleLength = title.length;
  const isCompact = width < 520;
  const isDark = theme.background === '#07111F';
  const backgroundStyle = Platform.select({
    web: {
      backgroundImage:
        isDark
          ? 'radial-gradient(circle at 16% 4%, rgba(96, 165, 250, 0.22), transparent 34%), radial-gradient(circle at 84% 10%, rgba(184, 164, 237, 0.18), transparent 30%), radial-gradient(circle at 50% 92%, rgba(164, 212, 197, 0.12), transparent 38%), linear-gradient(135deg, #07111F, #0F172A 52%, #111827)'
          : 'radial-gradient(circle at 16% 4%, rgba(186, 230, 253, 0.78), transparent 34%), radial-gradient(circle at 84% 10%, rgba(219, 234, 254, 0.72), transparent 30%), radial-gradient(circle at 50% 92%, rgba(204, 251, 241, 0.34), transparent 38%), linear-gradient(135deg, #ffffff, #f7fbff 52%, #eef7ff)',
    },
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.scrollView, { backgroundColor: theme.background }, backgroundStyle]}
      contentContainerStyle={[styles.content, isCompact && styles.contentCompact]}
      {...props}>
      <View
        style={[
          styles.frame,
          {
            borderColor: theme.hairline,
            backgroundColor: isDark ? 'rgba(7, 17, 31, 0.42)' : 'rgba(255, 255, 255, 0.34)',
          },
          isCompact && styles.frameCompact,
        ]}>
        <View style={[styles.center, isCompact && styles.centerCompact]}>
          <ThemedView style={[styles.header, isCompact && styles.headerCompact]}>
            <ThemedText type="caption" themeColor="textSecondary">
              {eyebrow}
            </ThemedText>
            <ThemedText
              type="title"
              style={[
                styles.title,
                isCompact && styles.titleCompact,
                titleLength > 22 && styles.titleLong,
                titleLength > 34 && styles.titleVeryLong,
              ]}>
              {title}
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          </ThemedView>
          {children}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  frame: {
    borderCurve: 'continuous',
    borderRadius: 32,
    borderWidth: 1,
    maxWidth: MaxContentWidth + Spacing.four,
    minWidth: 0,
    padding: Spacing.four,
    width: '100%',
  },
  frameCompact: {
    borderRadius: 26,
    padding: Spacing.three,
  },
  contentCompact: {
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.three,
  },
  center: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.five,
    minWidth: 0,
  },
  centerCompact: {
    gap: Spacing.four,
  },
  header: {
    backgroundColor: 'transparent',
    gap: Spacing.two,
    maxWidth: 760,
  },
  headerCompact: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  subtitle: {
    maxWidth: 680,
  },
  title: {
    flexShrink: 1,
  },
  titleCompact: {
    fontSize: 32,
    lineHeight: 36,
  },
  titleLong: {
    fontSize: 34,
    lineHeight: 39,
  },
  titleVeryLong: {
    fontSize: 30,
    lineHeight: 35,
  },
});
