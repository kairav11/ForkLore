import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { palette } from '@/lib/theme';
import { Body } from '@/components/ui/Text';

type ActionVariant = 'primary' | 'secondary' | 'ghost';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ActionVariant;
  icon?: LucideIcon;
  disabled?: boolean;
  /** Rendered instead of the icon, e.g. a spinner. */
  leading?: ReactNode;
}

const LABEL_COLOR: Record<ActionVariant, string> = {
  primary: palette.background,
  secondary: palette.foreground,
  ghost: palette.muted,
};

/**
 * The one button shape in the app: a full pill. Primary is a solid amber fill,
 * secondary a bordered surface card, ghost a bare label.
 */
export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled = false,
  leading,
}: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
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
        className="flex-row items-center justify-center gap-2.5 rounded-full"
        style={{
          height: isGhost ? 46 : 54,
          backgroundColor: isPrimary
            ? palette.accent
            : isGhost
              ? palette.transparent
              : palette.surface,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: palette.border,
        }}
      >
        {leading ?? (Icon ? <Icon size={isGhost ? 15 : 18} color={color} /> : null)}
        <Body
          weight={isPrimary ? 'semibold' : 'medium'}
          className={isGhost ? 'text-[15px]' : 'text-[16px]'}
          color={color}
        >
          {label}
        </Body>
      </View>
    </Pressable>
  );
}
