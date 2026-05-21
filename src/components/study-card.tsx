import { Pressable, StyleSheet, type PressableProps, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = ViewProps & {
  tone?: ThemeColor;
};

export function StudyCard({ style, tone = 'card', ...props }: CardProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type={tone}
      style={[
        styles.card,
        {
          borderColor: theme.hairline,
          boxShadow: '0 8px 24px rgba(10, 10, 10, 0.07)',
        },
        style,
      ]}
      {...props}
    />
  );
}

type ActionButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
};

export function ActionButton({ label, variant = 'primary', style, ...props }: ActionButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      {...props}
      style={(state) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.primary : theme.background,
          borderColor: isPrimary ? theme.primary : theme.hairline,
          opacity: state.pressed ? 0.72 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}>
      <ThemedText type="button" style={{ color: isPrimary ? theme.onPrimary : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <ThemedView style={styles.sectionHeader}>
      <ThemedText type="sectionTitle">{title}</ThemedText>
      {detail ? (
        <ThemedText type="small" themeColor="textSecondary">
          {detail}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    backgroundColor: 'transparent',
    gap: Spacing.one,
  },
});
