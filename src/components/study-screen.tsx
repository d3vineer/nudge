import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';

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

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.scrollView, { backgroundColor: theme.background }]}
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
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  center: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  header: {
    backgroundColor: 'transparent',
    gap: Spacing.two,
    maxWidth: 760,
  },
  subtitle: {
    maxWidth: 680,
  },
});
