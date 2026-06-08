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
          ? 'radial-gradient(circle at 92% 0%, rgba(88, 204, 2, 0.12), transparent 32%), radial-gradient(circle at 0% 100%, rgba(28, 176, 246, 0.1), transparent 32%), linear-gradient(180deg, #0B1620, #07111F)'
          : 'radial-gradient(circle at 92% 0%, rgba(88, 204, 2, 0.1), transparent 30%), radial-gradient(circle at 0% 100%, rgba(28, 176, 246, 0.08), transparent 30%), linear-gradient(180deg, #FFFFFF, #F7FBF6)',
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
            borderColor: 'transparent',
            backgroundColor: 'transparent',
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
    fontSize: 38,
    lineHeight: 42,
  },
  titleLong: {
    fontSize: 42,
    lineHeight: 46,
  },
  titleVeryLong: {
    fontSize: 34,
    lineHeight: 38,
  },
});
