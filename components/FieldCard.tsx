import type { ReactNode } from 'react';
import { View } from 'react-native';

import { palette } from '@/lib/theme';
import { Body, Mono } from '@/components/ui/Text';

interface FieldCardProps {
  label: string;
  /** Quiet helper line under the control. */
  hint?: string;
  /** Replaces the hint and turns the outline amber-red. */
  error?: string | null;
  /** Focused / open — draws the thin amber outline. */
  isActive?: boolean;
  children: ReactNode;
}

/**
 * Every input on the setup screen lives in one of these: a charcoal surface card
 * with a monospace label and a hairline border that turns amber while the field
 * is in use. No white boxes anywhere.
 */
export function FieldCard({ label, hint, error, isActive = false, children }: FieldCardProps) {
  const borderColor = error ? palette.pathA : isActive ? palette.accent : palette.border;

  return (
    <View
      className="gap-3 rounded-3xl p-4"
      style={{
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor,
      }}
    >
      <Mono className="text-[11px] tracking-[2px] uppercase">{label}</Mono>
      {children}
      {error ? (
        <Body className="text-[13px] leading-5" color={palette.pathA}>
          {error}
        </Body>
      ) : hint ? (
        <Body className="text-muted text-[13px] leading-5">{hint}</Body>
      ) : null}
    </View>
  );
}
