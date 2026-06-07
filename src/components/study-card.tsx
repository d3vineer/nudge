import { Platform, Pressable, StyleSheet, type PressableProps, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = ViewProps & {
  tone?: ThemeColor;
};

export function StudyCard({ style, tone = 'card', ...props }: CardProps) {
  const theme = useTheme();
  const isDark = theme.background === '#07111F';
  const glassStyle = Platform.select({
    web: {
      backdropFilter: 'blur(22px)',
      backgroundImage:
        tone === 'darkSurface'
          ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.82))'
          : isDark
            ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.82), rgba(30, 41, 59, 0.58))'
            : 'linear-gradient(145deg, rgba(255,255,255,0.88), rgba(240,247,255,0.68))',
    },
  });

  return (
    <ThemedView
      type={tone}
      style={[
        styles.card,
        glassStyle,
        {
          borderColor: theme.hairline,
          boxShadow: isDark
            ? '0 24px 70px rgba(0, 0, 0, 0.28)'
            : '0 24px 70px rgba(37, 99, 235, 0.10)',
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
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
    minWidth: 0,
  },
  button: {
    flexShrink: 1,
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    backgroundColor: 'transparent',
    gap: Spacing.one,
    paddingBottom: Spacing.one,
  },
});
