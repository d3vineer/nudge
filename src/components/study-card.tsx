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
  const isDark = theme.background === '#07111F';

  return (
    <ThemedView
      type={tone}
      style={[
        styles.card,
        {
          borderColor: theme.hairline,
          boxShadow: isDark
            ? '0 2px 10px rgba(0, 0, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.05)',
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

/*export function ActionButton({ label, variant = 'primary', style, ...props }: ActionButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  // Duolingo-style 3D button: a solid darker "lip" under the button that collapses on press.
  const edgeColor = isPrimary ? theme.primaryActive : theme.hairline;

  return (
    <Pressable
      {...props}
      style={(state) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.primary : theme.card,
          borderColor: isPrimary ? 'transparent' : theme.hairline,
          boxShadow: state.pressed ? `0 1px 0 ${edgeColor}` : `0 4px 0 ${edgeColor}`,
          transform: state.pressed ? [{ translateY: 3 }] : undefined,
        },
        typeof style === 'function' ? style(state) : style,
      ]}>
      <ThemedText type="button" style={{ color: isPrimary ? theme.onPrimary : theme.primary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}*/

export function ActionButton({
  label,
  variant = 'primary',
  style,
  ...props
}: ActionButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  // Duolingo-style 3D button: a solid darker "lip" under the button that collapses on press.
  const edgeColor = isPrimary ? theme.primaryActive : theme.hairline;

  return (
    <Pressable
      {...props}
      style={(state) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.primary : theme.card,
          borderColor: isPrimary ? 'transparent' : theme.hairline,
          boxShadow: state.pressed
            ? `0 1px 0 ${edgeColor}`
            : `0 4px 0 ${edgeColor}`,
          transform: [
            {
              translateY: state.pressed ? 3 : 0,
            },
          ],
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <ThemedText
        type="button"
        style={{ color: isPrimary ? theme.onPrimary : theme.primary }}
      >
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
    borderWidth: 2,
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
    minWidth: 0,
  },
  button: {
    flexShrink: 1,
    minHeight: 52,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.twoHalf,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    backgroundColor: 'transparent',
    gap: Spacing.one,
    paddingBottom: Spacing.one,
  },
});
