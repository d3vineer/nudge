import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'sectionTitle'
    | 'metric'
    | 'caption'
    | 'button'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'sectionTitle' && styles.sectionTitle,
        type === 'metric' && styles.metric,
        type === 'caption' && styles.caption,
        type === 'button' && styles.button,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 400,
  },
  smallBold: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
  },
  default: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 48,
    fontWeight: 400,
    lineHeight: 54,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 600,
  },
  sectionTitle: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: 600,
  },
  metric: {
    fontFamily: Fonts.mono,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: 600,
    fontVariant: ['tabular-nums'],
  },
  caption: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: 600,
  },
  button: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 700,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
