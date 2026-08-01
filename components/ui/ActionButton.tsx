import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { palette } from '@/lib/theme';
import { Body } from '@/components/ui/Text';

type ActionVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ActionSize = 'md' | 'sm';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ActionVariant;
  /** `sm` for the compact pills that sit inside a field. */
  size?: ActionSize;
  icon?: LucideIcon;
  disabled?: boolean;
  /** Rendered instead of the icon, e.g. a spinner. */
  leading?: ReactNode;
}

const LABEL_COLOR: Record<ActionVariant, string> = {
  primary: palette.background,
  secondary: palette.foreground,
  outline: palette.accent,
  ghost: palette.muted,
};

const FILL: Record<ActionVariant, string> = {
  primary: palette.accent,
  secondary: palette.surface,
  outline: palette.accentSoft,
  ghost: palette.transparent,
};

const EDGE: Record<ActionVariant, string> = {
  primary: palette.transparent,
  secondary: palette.border,
  outline: palette.accent,
  ghost: palette.transparent,
};

const HAS_EDGE: Record<ActionVariant, boolean> = {
  primary: false,
  secondary: true,
  outline: true,
  ghost: false,
};

/**
 * The one button shape in the app: a full pill, at two sizes. Primary is the
 * solid amber fill, outline the same pill drawn in amber for the secondary
 * action beside it, secondary a bordered surface card, ghost a bare label.
 */
export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  leading,
}: ActionButtonProps) {
  const isGhost = variant === 'ghost';
  const isSmall = size === 'sm';
  const color = LABEL_COLOR[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({ opacity: disabled ? 0.45 : pressed ? 0.82 : 1 })}
    >
      <View
        className="flex-row items-center justify-center gap-2 rounded-full"
        style={{
          height: isSmall ? 40 : isGhost ? 46 : 54,
          paddingHorizontal: isSmall ? 16 : 20,
          backgroundColor: FILL[variant],
          borderWidth: HAS_EDGE[variant] ? 1 : 0,
          borderColor: EDGE[variant],
        }}
      >
        {leading ?? (Icon ? <Icon size={isSmall ? 15 : isGhost ? 15 : 18} color={color} /> : null)}
        <Body
          weight={variant === 'primary' || variant === 'outline' ? 'semibold' : 'medium'}
          className={isSmall ? 'text-[14px]' : isGhost ? 'text-[15px]' : 'text-[16px]'}
          color={color}
        >
          {label}
        </Body>
      </View>
    </Pressable>
  );
}
