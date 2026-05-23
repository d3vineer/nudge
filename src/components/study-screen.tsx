import { Platform, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';

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
      contentContainerStyle={styles.content}
      {...props}>
      <View style={styles.center}>
        <ThemedView style={styles.header}>
          <ThemedText type="caption" themeColor="textSecondary">
            {eyebrow}
          </ThemedText>
          <ThemedText type="title">{title}</ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        </ThemedView>
        {children}
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
  center: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  header: {
    backgroundColor: 'transparent',
    gap: Spacing.one,
    maxWidth: 760,
  },
  subtitle: {
    maxWidth: 680,
  },
});
