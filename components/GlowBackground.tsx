import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { palette } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface GlowBackgroundProps {
  children: ReactNode;
  className?: string;
}

/**
 * Backdrop for the non-story screens: charcoal with one amber and one
 * violet-blue light pool, kept far below the surface so the two path colours
 * read as atmosphere rather than decoration.
 */
export function GlowBackground({ children, className }: GlowBackgroundProps) {
  return (
    <View className={cn('bg-background flex-1', className)}>
      <View
        pointerEvents="none"
        className="absolute -top-32 -left-24 h-80 w-80 rounded-full"
        style={{ backgroundColor: 'rgba(232, 163, 61, 0.07)' }}
      />
      <View
        pointerEvents="none"
        className="absolute -right-28 bottom-0 h-80 w-80 rounded-full"
        style={{ backgroundColor: 'rgba(124, 140, 255, 0.06)' }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[palette.transparent, palette.background]}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
